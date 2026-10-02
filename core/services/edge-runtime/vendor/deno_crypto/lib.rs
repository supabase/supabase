// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use aes_kw::KekAes128;
use aes_kw::KekAes192;
use aes_kw::KekAes256;

use base64::prelude::BASE64_URL_SAFE_NO_PAD;
use base64::Engine;
use deno_core::error::not_supported;
use deno_core::op2;
use deno_core::ToJsBuffer;

use deno_core::unsync::spawn_blocking;
use deno_core::JsBuffer;
use deno_core::OpState;
use serde::Deserialize;

use p256::elliptic_curve::sec1::FromEncodedPoint;
use p256::pkcs8::DecodePrivateKey;
use rand::rngs::OsRng;
use rand::rngs::StdRng;
use rand::thread_rng;
use rand::Rng;
use rand::SeedableRng;
use ring::digest;
use ring::hkdf;
use ring::hmac::Algorithm as HmacAlgorithm;
use ring::hmac::Key as HmacKey;
use ring::pbkdf2;
use ring::rand as RingRand;
use ring::signature::EcdsaKeyPair;
use ring::signature::EcdsaSigningAlgorithm;
use ring::signature::EcdsaVerificationAlgorithm;
use ring::signature::KeyPair;
use rsa::pkcs1::DecodeRsaPrivateKey;
use rsa::pkcs1::DecodeRsaPublicKey;
use rsa::signature::SignatureEncoding;
use rsa::signature::Signer;
use rsa::signature::Verifier;
use rsa::traits::SignatureScheme;
use rsa::Pss;
use rsa::RsaPrivateKey;
use rsa::RsaPublicKey;
use sha1::Sha1;
use sha2::Digest;
use sha2::Sha256;
use sha2::Sha384;
use sha2::Sha512;
use std::num::NonZeroU32;
use std::path::PathBuf;

pub use rand; // Re-export rand

mod decrypt;
mod ed25519;
mod encrypt;
mod export_key;
mod generate_key;
mod import_key;
mod key;
mod shared;
mod x25519;
mod x448;

pub use crate::decrypt::op_crypto_decrypt;
pub use crate::decrypt::DecryptError;
pub use crate::ed25519::Ed25519Error;
pub use crate::encrypt::op_crypto_encrypt;
pub use crate::encrypt::EncryptError;
pub use crate::export_key::op_crypto_export_key;
pub use crate::export_key::ExportKeyError;
pub use crate::generate_key::op_crypto_generate_key;
pub use crate::generate_key::GenerateKeyError;
pub use crate::import_key::op_crypto_import_key;
pub use crate::import_key::ImportKeyError;
use crate::key::Algorithm;
use crate::key::CryptoHash;
use crate::key::CryptoNamedCurve;
use crate::key::HkdfOutput;
pub use crate::shared::SharedError;
use crate::shared::V8RawKeyData;
pub use crate::x25519::X25519Error;
pub use crate::x448::X448Error;

deno_core::extension!(deno_crypto,
  deps = [ deno_webidl, deno_web ],
  ops = [
    op_crypto_get_random_values,
    op_crypto_generate_key,
    op_crypto_sign_key,
    op_crypto_verify_key,
    op_crypto_derive_bits,
    op_crypto_import_key,
    op_crypto_export_key,
    op_crypto_encrypt,
    op_crypto_decrypt,
    op_crypto_subtle_digest,
    op_crypto_random_uuid,
    op_crypto_wrap_key,
    op_crypto_unwrap_key,
    op_crypto_base64url_decode,
    op_crypto_base64url_encode,
    x25519::op_crypto_generate_x25519_keypair,
    x25519::op_crypto_derive_bits_x25519,
    x25519::op_crypto_import_spki_x25519,
    x25519::op_crypto_import_pkcs8_x25519,
    x25519::op_crypto_export_spki_x25519,
    x25519::op_crypto_export_pkcs8_x25519,
    x448::op_crypto_generate_x448_keypair,
    x448::op_crypto_derive_bits_x448,
    x448::op_crypto_import_spki_x448,
    x448::op_crypto_import_pkcs8_x448,
    x448::op_crypto_export_spki_x448,
    x448::op_crypto_export_pkcs8_x448,
    ed25519::op_crypto_generate_ed25519_keypair,
    ed25519::op_crypto_import_spki_ed25519,
    ed25519::op_crypto_import_pkcs8_ed25519,
    ed25519::op_crypto_sign_ed25519,
    ed25519::op_crypto_verify_ed25519,
    ed25519::op_crypto_export_spki_ed25519,
    ed25519::op_crypto_export_pkcs8_ed25519,
    ed25519::op_crypto_jwk_x_ed25519,
  ],
  esm = [ "00_crypto.js" ],
  options = {
    maybe_seed: Option<u64>,
  },
  state = |state, options| {
    if let Some(seed) = options.maybe_seed {
      state.put(StdRng::seed_from_u64(seed));
    }
  },
);

#[derive(Debug, thiserror::Error)]
pub enum Error {
  #[error(transparent)]
  General(#[from] SharedError),
  #[error(transparent)]
  JoinError(#[from] tokio::task::JoinError),
  #[error(transparent)]
  Der(#[from] rsa::pkcs1::der::Error),
  #[error("Missing argument hash")]
  MissingArgumentHash,
  #[error("Missing argument saltLength")]
  MissingArgumentSaltLength,
  #[error("unsupported algorithm")]
  UnsupportedAlgorithm,
  #[error(transparent)]
  KeyRejected(#[from] ring::error::KeyRejected),
  #[error(transparent)]
  RSA(#[from] rsa::Error),
  #[error(transparent)]
  Pkcs1(#[from] rsa::pkcs1::Error),
  #[error(transparent)]
  Unspecified(#[from] ring::error::Unspecified),
  #[error("Invalid key format")]
  InvalidKeyFormat,
  #[error(transparent)]
  P256Ecdsa(#[from] p256::ecdsa::Error),
  #[error("Unexpected error decoding private key")]
  DecodePrivateKey,
  #[error("Missing argument publicKey")]
  MissingArgumentPublicKey,
  #[error("Missing argument namedCurve")]
  MissingArgumentNamedCurve,
  #[error("Missing argument info")]
  MissingArgumentInfo,
  #[error("The length provided for HKDF is too large")]
  HKDFLengthTooLarge,
  #[error(transparent)]
  Base64Decode(#[from] base64::DecodeError),
  #[error("Data must be multiple of 8 bytes")]
  DataInvalidSize,
  #[error("Invalid key length")]
  InvalidKeyLength,
  #[error("encryption error")]
  EncryptionError,
  #[error("decryption error - integrity check failed")]
  DecryptionError,
  #[error("The ArrayBufferView's byte length ({0}) exceeds the number of bytes of entropy available via this API (65536)")]
  ArrayBufferViewLengthExceeded(usize),
  #[error(transparent)]
  Other(deno_core::error::AnyError),
}

#[op2]
#[serde]
pub fn op_crypto_base64url_decode(
  #[string] data: String,
) -> Result<ToJsBuffer, Error> {
  let data: Vec<u8> = BASE64_URL_SAFE_NO_PAD.decode(data)?;
  Ok(data.into())
}

#[op2]
#[string]
pub fn op_crypto_base64url_encode(#[buffer] data: JsBuffer) -> String {
  let data: String = BASE64_URL_SAFE_NO_PAD.encode(data);
  data
}

#[op2(fast)]
pub fn op_crypto_get_random_values(
  state: &mut OpState,
  #[buffer] out: &mut [u8],
) -> Result<(), Error> {
  if out.len() > 65536 {
    return Err(Error::ArrayBufferViewLengthExceeded(out.len()));
  }

  let maybe_seeded_rng = state.try_borrow_mut::<StdRng>();
  if let Some(seeded_rng) = maybe_seeded_rng {
    seeded_rng.fill(out);
  } else {
    let mut rng = thread_rng();
    rng.fill(out);
  }

  Ok(())
}

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum KeyFormat {
  Raw,
  Pkcs8,
  Spki,
}

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum KeyType {
  Secret,
  Private,
  Public,
}

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
pub struct KeyData {
  r#type: KeyType,
  data: JsBuffer,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct SignArg {
  key: KeyData,
  algorithm: Algorithm,
  salt_length: Option<u32>,
  hash: Option<CryptoHash>,
  named_curve: Option<CryptoNamedCurve>,
}

#[op2(async)]
#[serde]
pub async fn op_crypto_sign_key(
  #[serde] args: SignArg,
  #[buffer] zero_copy: JsBuffer,
) -> Result<ToJsBuffer, Error> {
  deno_core::unsync::spawn_blocking(move || {
    let data = &*zero_copy;
    let algorithm = args.algorithm;

    let signature = match algorithm {
      Algorithm::RsassaPkcs1v15 => {
        use rsa::pkcs1v15::SigningKey;
        let private_key = RsaPrivateKey::from_pkcs1_der(&args.key.data)?;
        match args.hash.ok_or_else(|| Error::MissingArgumentHash)? {
          CryptoHash::Sha1 => {
            let signing_key = SigningKey::<Sha1>::new(private_key);
            signing_key.sign(data)
          }
          CryptoHash::Sha256 => {
            let signing_key = SigningKey::<Sha256>::new(private_key);
            signing_key.sign(data)
          }
          CryptoHash::Sha384 => {
            let signing_key = SigningKey::<Sha384>::new(private_key);
            signing_key.sign(data)
          }
          CryptoHash::Sha512 => {
            let signing_key = SigningKey::<Sha512>::new(private_key);
            signing_key.sign(data)
          }
        }
        .to_vec()
      }
      Algorithm::RsaPss => {
        let private_key = RsaPrivateKey::from_pkcs1_der(&args.key.data)?;

        let salt_len = args
          .salt_length
          .ok_or_else(|| Error::MissingArgumentSaltLength)?
          as usize;

        let mut rng = OsRng;
        match args.hash.ok_or_else(|| Error::MissingArgumentHash)? {
          CryptoHash::Sha1 => {
            let signing_key = Pss::new_with_salt::<Sha1>(salt_len);
            let hashed = Sha1::digest(data);
            signing_key.sign(Some(&mut rng), &private_key, &hashed)?
          }
          CryptoHash::Sha256 => {
            let signing_key = Pss::new_with_salt::<Sha256>(salt_len);
            let hashed = Sha256::digest(data);
            signing_key.sign(Some(&mut rng), &private_key, &hashed)?
          }
          CryptoHash::Sha384 => {
            let signing_key = Pss::new_with_salt::<Sha384>(salt_len);
            let hashed = Sha384::digest(data);
            signing_key.sign(Some(&mut rng), &private_key, &hashed)?
          }
          CryptoHash::Sha512 => {
            let signing_key = Pss::new_with_salt::<Sha512>(salt_len);
            let hashed = Sha512::digest(data);
            signing_key.sign(Some(&mut rng), &private_key, &hashed)?
          }
        }
        .to_vec()
      }
      Algorithm::Ecdsa => {
        let curve: &EcdsaSigningAlgorithm = args
          .named_curve
          .ok_or_else(|| Error::Other(not_supported()))?
          .into();

        let rng = RingRand::SystemRandom::new();
        let key_pair = EcdsaKeyPair::from_pkcs8(curve, &args.key.data, &rng)?;
        // We only support P256-SHA256 & P384-SHA384. These are recommended signature pairs.
        // https://briansmith.org/rustdoc/ring/signature/index.html#statics
        if let Some(hash) = args.hash {
          match hash {
            CryptoHash::Sha256 | CryptoHash::Sha384 => (),
            _ => return Err(Error::UnsupportedAlgorithm),
          }
        };

        let signature = key_pair.sign(&rng, data)?;

        // Signature data as buffer.
        signature.as_ref().to_vec()
      }
      Algorithm::Hmac => {
        let hash: HmacAlgorithm = args
          .hash
          .ok_or_else(|| Error::Other(not_supported()))?
          .into();

        let key = HmacKey::new(hash, &args.key.data);

        let signature = ring::hmac::sign(&key, data);
        signature.as_ref().to_vec()
      }
      _ => return Err(Error::UnsupportedAlgorithm),
    };

    Ok(signature.into())
  })
  .await?
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct VerifyArg {
  key: KeyData,
  algorithm: Algorithm,
  salt_length: Option<u32>,
  hash: Option<CryptoHash>,
  signature: JsBuffer,
  named_curve: Option<CryptoNamedCurve>,
}

#[op2(async)]
pub async fn op_crypto_verify_key(
  #[serde] args: VerifyArg,
  #[buffer] zero_copy: JsBuffer,
) -> Result<bool, Error> {
  deno_core::unsync::spawn_blocking(move || {
    let data = &*zero_copy;
    let algorithm = args.algorithm;

    let verification = match algorithm {
      Algorithm::RsassaPkcs1v15 => {
        use rsa::pkcs1v15::Signature;
        use rsa::pkcs1v15::VerifyingKey;
        let public_key = read_rsa_public_key(args.key)?;
        let signature: Signature = args.signature.as_ref().try_into()?;
        match args.hash.ok_or_else(|| Error::MissingArgumentHash)? {
          CryptoHash::Sha1 => {
            let verifying_key = VerifyingKey::<Sha1>::new(public_key);
            verifying_key.verify(data, &signature).is_ok()
          }
          CryptoHash::Sha256 => {
            let verifying_key = VerifyingKey::<Sha256>::new(public_key);
            verifying_key.verify(data, &signature).is_ok()
          }
          CryptoHash::Sha384 => {
            let verifying_key = VerifyingKey::<Sha384>::new(public_key);
            verifying_key.verify(data, &signature).is_ok()
          }
          CryptoHash::Sha512 => {
            let verifying_key = VerifyingKey::<Sha512>::new(public_key);
            verifying_key.verify(data, &signature).is_ok()
          }
        }
      }
      Algorithm::RsaPss => {
        let public_key = read_rsa_public_key(args.key)?;
        let signature = args.signature.as_ref();

        let salt_len = args
          .salt_length
          .ok_or_else(|| Error::MissingArgumentSaltLength)?
          as usize;

        match args.hash.ok_or_else(|| Error::MissingArgumentHash)? {
          CryptoHash::Sha1 => {
            let pss = Pss::new_with_salt::<Sha1>(salt_len);
            let hashed = Sha1::digest(data);
            pss.verify(&public_key, &hashed, signature).is_ok()
          }
          CryptoHash::Sha256 => {
            let pss = Pss::new_with_salt::<Sha256>(salt_len);
            let hashed = Sha256::digest(data);
            pss.verify(&public_key, &hashed, signature).is_ok()
          }
          CryptoHash::Sha384 => {
            let pss = Pss::new_with_salt::<Sha384>(salt_len);
            let hashed = Sha384::digest(data);
            pss.verify(&public_key, &hashed, signature).is_ok()
          }
          CryptoHash::Sha512 => {
            let pss = Pss::new_with_salt::<Sha512>(salt_len);
            let hashed = Sha512::digest(data);
            pss.verify(&public_key, &hashed, signature).is_ok()
          }
        }
      }
      Algorithm::Hmac => {
        let hash: HmacAlgorithm = args
          .hash
          .ok_or_else(|| Error::Other(not_supported()))?
          .into();
        let key = HmacKey::new(hash, &args.key.data);
        ring::hmac::verify(&key, data, &args.signature).is_ok()
      }
      Algorithm::Ecdsa => {
        let signing_alg: &EcdsaSigningAlgorithm = args
          .named_curve
          .ok_or_else(|| Error::Other(not_supported()))?
          .into();
        let verify_alg: &EcdsaVerificationAlgorithm = args
          .named_curve
          .ok_or_else(|| Error::Other(not_supported()))?
          .into();

        let private_key;

        let public_key_bytes = match args.key.r#type {
          KeyType::Private => {
            let rng = RingRand::SystemRandom::new();
            private_key =
              EcdsaKeyPair::from_pkcs8(signing_alg, &args.key.data, &rng)?;

            private_key.public_key().as_ref()
          }
          KeyType::Public => &*args.key.data,
          _ => return Err(Error::InvalidKeyFormat),
        };

        let public_key =
          ring::signature::UnparsedPublicKey::new(verify_alg, public_key_bytes);

        public_key.verify(data, &args.signature).is_ok()
      }
      _ => return Err(Error::UnsupportedAlgorithm),
    };

    Ok(verification)
  })
  .await?
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DeriveKeyArg {
  key: KeyData,
  algorithm: Algorithm,
  hash: Option<CryptoHash>,
  length: usize,
  iterations: Option<u32>,
  // ECDH
  public_key: Option<KeyData>,
  named_curve: Option<CryptoNamedCurve>,
  // HKDF
  info: Option<JsBuffer>,
}

#[op2(async)]
#[serde]
pub async fn op_crypto_derive_bits(
  #[serde] args: DeriveKeyArg,
  #[buffer] zero_copy: Option<JsBuffer>,
) -> Result<ToJsBuffer, Error> {
  deno_core::unsync::spawn_blocking(move || {
    let algorithm = args.algorithm;
    match algorithm {
      Algorithm::Pbkdf2 => {
        let zero_copy =
          zero_copy.ok_or_else(|| Error::Other(not_supported()))?;
        let salt = &*zero_copy;
        // The caller must validate these cases.
        assert!(args.length > 0);
        assert!(args.length % 8 == 0);

        let algorithm =
          match args.hash.ok_or_else(|| Error::Other(not_supported()))? {
            CryptoHash::Sha1 => pbkdf2::PBKDF2_HMAC_SHA1,
            CryptoHash::Sha256 => pbkdf2::PBKDF2_HMAC_SHA256,
            CryptoHash::Sha384 => pbkdf2::PBKDF2_HMAC_SHA384,
            CryptoHash::Sha512 => pbkdf2::PBKDF2_HMAC_SHA512,
          };

        // This will never panic. We have already checked length earlier.
        let iterations = NonZeroU32::new(
          args
            .iterations
            .ok_or_else(|| Error::Other(not_supported()))?,
        )
        .unwrap();
        let secret = args.key.data;
        let mut out = vec![0; args.length / 8];
        pbkdf2::derive(algorithm, iterations, salt, &secret, &mut out);
        Ok(out.into())
      }
      Algorithm::Ecdh => {
        let named_curve = args
          .named_curve
          .ok_or_else(|| Error::MissingArgumentNamedCurve)?;

        let public_key = args
          .public_key
          .ok_or_else(|| Error::MissingArgumentPublicKey)?;

        match named_curve {
          CryptoNamedCurve::P256 => {
            let secret_key = p256::SecretKey::from_pkcs8_der(&args.key.data)
              .map_err(|_| Error::DecodePrivateKey)?;

            let public_key = match public_key.r#type {
              KeyType::Private => {
                p256::SecretKey::from_pkcs8_der(&public_key.data)
                  .map_err(|_| Error::DecodePrivateKey)?
                  .public_key()
              }
              KeyType::Public => {
                let point = p256::EncodedPoint::from_bytes(public_key.data)
                  .map_err(|_| Error::DecodePrivateKey)?;

                let pk = p256::PublicKey::from_encoded_point(&point);
                // pk is a constant time Option.
                if pk.is_some().into() {
                  pk.unwrap()
                } else {
                  return Err(Error::DecodePrivateKey);
                }
              }
              _ => unreachable!(),
            };

            let shared_secret = p256::elliptic_curve::ecdh::diffie_hellman(
              secret_key.to_nonzero_scalar(),
              public_key.as_affine(),
            );

            // raw serialized x-coordinate of the computed point
            Ok(shared_secret.raw_secret_bytes().to_vec().into())
          }
          CryptoNamedCurve::P384 => {
            let secret_key = p384::SecretKey::from_pkcs8_der(&args.key.data)
              .map_err(|_| Error::DecodePrivateKey)?;

            let public_key = match public_key.r#type {
              KeyType::Private => {
                p384::SecretKey::from_pkcs8_der(&public_key.data)
                  .map_err(|_| Error::DecodePrivateKey)?
                  .public_key()
              }
              KeyType::Public => {
                let point = p384::EncodedPoint::from_bytes(public_key.data)
                  .map_err(|_| Error::DecodePrivateKey)?;

                let pk = p384::PublicKey::from_encoded_point(&point);
                // pk is a constant time Option.
                if pk.is_some().into() {
                  pk.unwrap()
                } else {
                  return Err(Error::DecodePrivateKey);
                }
              }
              _ => unreachable!(),
            };

            let shared_secret = p384::elliptic_curve::ecdh::diffie_hellman(
              secret_key.to_nonzero_scalar(),
              public_key.as_affine(),
            );

            // raw serialized x-coordinate of the computed point
            Ok(shared_secret.raw_secret_bytes().to_vec().into())
          }
        }
      }
      Algorithm::Hkdf => {
        let zero_copy =
          zero_copy.ok_or_else(|| Error::Other(not_supported()))?;
        let salt = &*zero_copy;
        let algorithm =
          match args.hash.ok_or_else(|| Error::Other(not_supported()))? {
            CryptoHash::Sha1 => hkdf::HKDF_SHA1_FOR_LEGACY_USE_ONLY,
            CryptoHash::Sha256 => hkdf::HKDF_SHA256,
            CryptoHash::Sha384 => hkdf::HKDF_SHA384,
            CryptoHash::Sha512 => hkdf::HKDF_SHA512,
          };

        let info = args.info.ok_or_else(|| Error::MissingArgumentInfo)?;
        // IKM
        let secret = args.key.data;
        // L
        let length = args.length / 8;

        let salt = hkdf::Salt::new(algorithm, salt);
        let prk = salt.extract(&secret);
        let info = &[&*info];
        let okm = prk
          .expand(info, HkdfOutput(length))
          .map_err(|_e| Error::HKDFLengthTooLarge)?;
        let mut r = vec![0u8; length];
        okm.fill(&mut r)?;
        Ok(r.into())
      }
      _ => Err(Error::UnsupportedAlgorithm),
    }
  })
  .await?
}

fn read_rsa_public_key(key_data: KeyData) -> Result<RsaPublicKey, Error> {
  let public_key = match key_data.r#type {
    KeyType::Private => {
      RsaPrivateKey::from_pkcs1_der(&key_data.data)?.to_public_key()
    }
    KeyType::Public => RsaPublicKey::from_pkcs1_der(&key_data.data)?,
    KeyType::Secret => unreachable!("unexpected KeyType::Secret"),
  };
  Ok(public_key)
}

#[op2]
#[string]
pub fn op_crypto_random_uuid(state: &mut OpState) -> Result<String, Error> {
  let maybe_seeded_rng = state.try_borrow_mut::<StdRng>();
  let uuid = if let Some(seeded_rng) = maybe_seeded_rng {
    let mut bytes = [0u8; 16];
    seeded_rng.fill(&mut bytes);
    fast_uuid_v4(&mut bytes)
  } else {
    let mut rng = thread_rng();
    let mut bytes = [0u8; 16];
    rng.fill(&mut bytes);
    fast_uuid_v4(&mut bytes)
  };

  Ok(uuid)
}

#[op2(async)]
#[serde]
pub async fn op_crypto_subtle_digest(
  #[serde] algorithm: CryptoHash,
  #[buffer] data: JsBuffer,
) -> Result<ToJsBuffer, Error> {
  let output = spawn_blocking(move || {
    digest::digest(algorithm.into(), &data)
      .as_ref()
      .to_vec()
      .into()
  })
  .await?;

  Ok(output)
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct WrapUnwrapKeyArg {
  key: V8RawKeyData,
  algorithm: Algorithm,
}

#[op2]
#[serde]
pub fn op_crypto_wrap_key(
  #[serde] args: WrapUnwrapKeyArg,
  #[buffer] data: JsBuffer,
) -> Result<ToJsBuffer, Error> {
  let algorithm = args.algorithm;

  match algorithm {
    Algorithm::AesKw => {
      let key = args.key.as_secret_key()?;

      if data.len() % 8 != 0 {
        return Err(Error::DataInvalidSize);
      }

      let wrapped_key = match key.len() {
        16 => KekAes128::new(key.into()).wrap_vec(&data),
        24 => KekAes192::new(key.into()).wrap_vec(&data),
        32 => KekAes256::new(key.into()).wrap_vec(&data),
        _ => return Err(Error::InvalidKeyLength),
      }
      .map_err(|_| Error::EncryptionError)?;

      Ok(wrapped_key.into())
    }
    _ => Err(Error::UnsupportedAlgorithm),
  }
}

#[op2]
#[serde]
pub fn op_crypto_unwrap_key(
  #[serde] args: WrapUnwrapKeyArg,
  #[buffer] data: JsBuffer,
) -> Result<ToJsBuffer, Error> {
  let algorithm = args.algorithm;
  match algorithm {
    Algorithm::AesKw => {
      let key = args.key.as_secret_key()?;

      if data.len() % 8 != 0 {
        return Err(Error::DataInvalidSize);
      }

      let unwrapped_key = match key.len() {
        16 => KekAes128::new(key.into()).unwrap_vec(&data),
        24 => KekAes192::new(key.into()).unwrap_vec(&data),
        32 => KekAes256::new(key.into()).unwrap_vec(&data),
        _ => return Err(Error::InvalidKeyLength),
      }
      .map_err(|_| Error::DecryptionError)?;

      Ok(unwrapped_key.into())
    }
    _ => Err(Error::UnsupportedAlgorithm),
  }
}

pub fn get_declaration() -> PathBuf {
  PathBuf::from(env!("CARGO_MANIFEST_DIR")).join("lib.deno_crypto.d.ts")
}

const HEX_CHARS: &[u8; 16] = b"0123456789abcdef";

fn fast_uuid_v4(bytes: &mut [u8; 16]) -> String {
  // Set UUID version to 4 and variant to 1.
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;

  let buf = [
    HEX_CHARS[(bytes[0] >> 4) as usize],
    HEX_CHARS[(bytes[0] & 0x0f) as usize],
    HEX_CHARS[(bytes[1] >> 4) as usize],
    HEX_CHARS[(bytes[1] & 0x0f) as usize],
    HEX_CHARS[(bytes[2] >> 4) as usize],
    HEX_CHARS[(bytes[2] & 0x0f) as usize],
    HEX_CHARS[(bytes[3] >> 4) as usize],
    HEX_CHARS[(bytes[3] & 0x0f) as usize],
    b'-',
    HEX_CHARS[(bytes[4] >> 4) as usize],
    HEX_CHARS[(bytes[4] & 0x0f) as usize],
    HEX_CHARS[(bytes[5] >> 4) as usize],
    HEX_CHARS[(bytes[5] & 0x0f) as usize],
    b'-',
    HEX_CHARS[(bytes[6] >> 4) as usize],
    HEX_CHARS[(bytes[6] & 0x0f) as usize],
    HEX_CHARS[(bytes[7] >> 4) as usize],
    HEX_CHARS[(bytes[7] & 0x0f) as usize],
    b'-',
    HEX_CHARS[(bytes[8] >> 4) as usize],
    HEX_CHARS[(bytes[8] & 0x0f) as usize],
    HEX_CHARS[(bytes[9] >> 4) as usize],
    HEX_CHARS[(bytes[9] & 0x0f) as usize],
    b'-',
    HEX_CHARS[(bytes[10] >> 4) as usize],
    HEX_CHARS[(bytes[10] & 0x0f) as usize],
    HEX_CHARS[(bytes[11] >> 4) as usize],
    HEX_CHARS[(bytes[11] & 0x0f) as usize],
    HEX_CHARS[(bytes[12] >> 4) as usize],
    HEX_CHARS[(bytes[12] & 0x0f) as usize],
    HEX_CHARS[(bytes[13] >> 4) as usize],
    HEX_CHARS[(bytes[13] & 0x0f) as usize],
    HEX_CHARS[(bytes[14] >> 4) as usize],
    HEX_CHARS[(bytes[14] & 0x0f) as usize],
    HEX_CHARS[(bytes[15] >> 4) as usize],
    HEX_CHARS[(bytes[15] & 0x0f) as usize],
  ];

  // Safety: the buffer is all valid UTF-8.
  unsafe { String::from_utf8_unchecked(buf.to_vec()) }
}

#[test]
fn test_fast_uuid_v4_correctness() {
  let mut rng = thread_rng();
  let mut bytes = [0u8; 16];
  rng.fill(&mut bytes);
  let uuid = fast_uuid_v4(&mut bytes.clone());
  let uuid_lib = uuid::Builder::from_bytes(bytes)
    .set_variant(uuid::Variant::RFC4122)
    .set_version(uuid::Version::Random)
    .as_uuid()
    .to_string();
  assert_eq!(uuid, uuid_lib);
}
