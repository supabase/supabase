// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
use deno_core::error::generic_error;
use deno_core::error::type_error;
use deno_core::op2;
use deno_core::unsync::spawn_blocking;
use deno_core::JsBuffer;
use deno_core::OpState;
use deno_core::StringOrBuffer;
use deno_core::ToJsBuffer;
use elliptic_curve::sec1::ToEncodedPoint;
use hkdf::Hkdf;
use keys::AsymmetricPrivateKey;
use keys::AsymmetricPublicKey;
use keys::EcPrivateKey;
use keys::EcPublicKey;
use keys::KeyObjectHandle;
use num_bigint::BigInt;
use num_bigint_dig::BigUint;
use rand::distributions::Distribution;
use rand::distributions::Uniform;
use rand::Rng;
use ring::signature::Ed25519KeyPair;
use std::future::Future;
use std::rc::Rc;

use p224::NistP224;
use p256::NistP256;
use p384::NistP384;
use rsa::pkcs8::DecodePrivateKey;
use rsa::pkcs8::DecodePublicKey;
use rsa::Oaep;
use rsa::Pkcs1v15Encrypt;
use rsa::RsaPrivateKey;
use rsa::RsaPublicKey;

pub mod cipher;
mod dh;
pub mod digest;
pub mod keys;
mod md5_sha1;
mod pkcs3;
mod primes;
pub mod sign;
pub mod x509;

use self::digest::match_fixed_digest_with_eager_block_buffer;

#[op2(fast)]
pub fn op_node_check_prime(
  #[bigint] num: i64,
  #[number] checks: usize,
) -> bool {
  primes::is_probably_prime(&BigInt::from(num), checks)
}

#[op2]
pub fn op_node_check_prime_bytes(
  #[anybuffer] bytes: &[u8],
  #[number] checks: usize,
) -> bool {
  let candidate = BigInt::from_bytes_be(num_bigint::Sign::Plus, bytes);
  primes::is_probably_prime(&candidate, checks)
}

#[op2(async)]
pub async fn op_node_check_prime_async(
  #[bigint] num: i64,
  #[number] checks: usize,
) -> Result<bool, tokio::task::JoinError> {
  // TODO(@littledivy): use rayon for CPU-bound tasks
  spawn_blocking(move || primes::is_probably_prime(&BigInt::from(num), checks))
    .await
}

#[op2(async)]
pub fn op_node_check_prime_bytes_async(
  #[anybuffer] bytes: &[u8],
  #[number] checks: usize,
) -> impl Future<Output = Result<bool, tokio::task::JoinError>> {
  let candidate = BigInt::from_bytes_be(num_bigint::Sign::Plus, bytes);
  // TODO(@littledivy): use rayon for CPU-bound tasks
  async move {
    spawn_blocking(move || primes::is_probably_prime(&candidate, checks)).await
  }
}

#[op2]
#[cppgc]
pub fn op_node_create_hash(
  #[string] algorithm: &str,
  output_length: Option<u32>,
) -> Result<digest::Hasher, digest::HashError> {
  digest::Hasher::new(algorithm, output_length.map(|l| l as usize))
}

#[op2]
#[serde]
pub fn op_node_get_hashes() -> Vec<&'static str> {
  digest::Hash::get_hashes()
}

#[op2(fast)]
pub fn op_node_hash_update(
  #[cppgc] hasher: &digest::Hasher,
  #[buffer] data: &[u8],
) -> bool {
  hasher.update(data)
}

#[op2(fast)]
pub fn op_node_hash_update_str(
  #[cppgc] hasher: &digest::Hasher,
  #[string] data: &str,
) -> bool {
  hasher.update(data.as_bytes())
}

#[op2]
#[buffer]
pub fn op_node_hash_digest(
  #[cppgc] hasher: &digest::Hasher,
) -> Option<Box<[u8]>> {
  hasher.digest()
}

#[op2]
#[string]
pub fn op_node_hash_digest_hex(
  #[cppgc] hasher: &digest::Hasher,
) -> Option<String> {
  let digest = hasher.digest()?;
  Some(faster_hex::hex_string(&digest))
}

#[op2]
#[cppgc]
pub fn op_node_hash_clone(
  #[cppgc] hasher: &digest::Hasher,
  output_length: Option<u32>,
) -> Result<Option<digest::Hasher>, digest::HashError> {
  hasher.clone_inner(output_length.map(|l| l as usize))
}

#[derive(Debug, thiserror::Error)]
pub enum PrivateEncryptDecryptError {
  #[error(transparent)]
  Pkcs8(#[from] pkcs8::Error),
  #[error(transparent)]
  Spki(#[from] spki::Error),
  #[error(transparent)]
  Utf8(#[from] std::str::Utf8Error),
  #[error(transparent)]
  Rsa(#[from] rsa::Error),
  #[error("Unknown padding")]
  UnknownPadding,
}

#[op2]
#[serde]
pub fn op_node_private_encrypt(
  #[serde] key: StringOrBuffer,
  #[serde] msg: StringOrBuffer,
  #[smi] padding: u32,
) -> Result<ToJsBuffer, PrivateEncryptDecryptError> {
  let key = RsaPrivateKey::from_pkcs8_pem((&key).try_into()?)?;

  let mut rng = rand::thread_rng();
  match padding {
    1 => Ok(
      key
        .as_ref()
        .encrypt(&mut rng, Pkcs1v15Encrypt, &msg)?
        .into(),
    ),
    4 => Ok(
      key
        .as_ref()
        .encrypt(&mut rng, Oaep::new::<sha1::Sha1>(), &msg)?
        .into(),
    ),
    _ => Err(PrivateEncryptDecryptError::UnknownPadding),
  }
}

#[op2]
#[serde]
pub fn op_node_private_decrypt(
  #[serde] key: StringOrBuffer,
  #[serde] msg: StringOrBuffer,
  #[smi] padding: u32,
) -> Result<ToJsBuffer, PrivateEncryptDecryptError> {
  let key = RsaPrivateKey::from_pkcs8_pem((&key).try_into()?)?;

  match padding {
    1 => Ok(key.decrypt(Pkcs1v15Encrypt, &msg)?.into()),
    4 => Ok(key.decrypt(Oaep::new::<sha1::Sha1>(), &msg)?.into()),
    _ => Err(PrivateEncryptDecryptError::UnknownPadding),
  }
}

#[op2]
#[serde]
pub fn op_node_public_encrypt(
  #[serde] key: StringOrBuffer,
  #[serde] msg: StringOrBuffer,
  #[smi] padding: u32,
) -> Result<ToJsBuffer, PrivateEncryptDecryptError> {
  let key = RsaPublicKey::from_public_key_pem((&key).try_into()?)?;

  let mut rng = rand::thread_rng();
  match padding {
    1 => Ok(key.encrypt(&mut rng, Pkcs1v15Encrypt, &msg)?.into()),
    4 => Ok(
      key
        .encrypt(&mut rng, Oaep::new::<sha1::Sha1>(), &msg)?
        .into(),
    ),
    _ => Err(PrivateEncryptDecryptError::UnknownPadding),
  }
}

#[op2(fast)]
#[smi]
pub fn op_node_create_cipheriv(
  state: &mut OpState,
  #[string] algorithm: &str,
  #[buffer] key: &[u8],
  #[buffer] iv: &[u8],
) -> Result<u32, cipher::CipherContextError> {
  let context = cipher::CipherContext::new(algorithm, key, iv)?;
  Ok(state.resource_table.add(context))
}

#[op2(fast)]
pub fn op_node_cipheriv_set_aad(
  state: &mut OpState,
  #[smi] rid: u32,
  #[buffer] aad: &[u8],
) -> bool {
  let context = match state.resource_table.get::<cipher::CipherContext>(rid) {
    Ok(context) => context,
    Err(_) => return false,
  };
  context.set_aad(aad);
  true
}

#[op2(fast)]
pub fn op_node_cipheriv_encrypt(
  state: &mut OpState,
  #[smi] rid: u32,
  #[buffer] input: &[u8],
  #[buffer] output: &mut [u8],
) -> bool {
  let context = match state.resource_table.get::<cipher::CipherContext>(rid) {
    Ok(context) => context,
    Err(_) => return false,
  };
  context.encrypt(input, output);
  true
}

#[op2]
#[serde]
pub fn op_node_cipheriv_final(
  state: &mut OpState,
  #[smi] rid: u32,
  auto_pad: bool,
  #[buffer] input: &[u8],
  #[anybuffer] output: &mut [u8],
) -> Result<Option<Vec<u8>>, cipher::CipherContextError> {
  let context = state
    .resource_table
    .take::<cipher::CipherContext>(rid)
    .map_err(cipher::CipherContextError::Resource)?;
  let context = Rc::try_unwrap(context)
    .map_err(|_| cipher::CipherContextError::ContextInUse)?;
  context.r#final(auto_pad, input, output)
}

#[op2]
#[buffer]
pub fn op_node_cipheriv_take(
  state: &mut OpState,
  #[smi] rid: u32,
) -> Result<Option<Vec<u8>>, cipher::CipherContextError> {
  let context = state
    .resource_table
    .take::<cipher::CipherContext>(rid)
    .map_err(cipher::CipherContextError::Resource)?;
  let context = Rc::try_unwrap(context)
    .map_err(|_| cipher::CipherContextError::ContextInUse)?;
  Ok(context.take_tag())
}

#[op2(fast)]
#[smi]
pub fn op_node_create_decipheriv(
  state: &mut OpState,
  #[string] algorithm: &str,
  #[buffer] key: &[u8],
  #[buffer] iv: &[u8],
) -> Result<u32, cipher::DecipherContextError> {
  let context = cipher::DecipherContext::new(algorithm, key, iv)?;
  Ok(state.resource_table.add(context))
}

#[op2(fast)]
pub fn op_node_decipheriv_set_aad(
  state: &mut OpState,
  #[smi] rid: u32,
  #[buffer] aad: &[u8],
) -> bool {
  let context = match state.resource_table.get::<cipher::DecipherContext>(rid) {
    Ok(context) => context,
    Err(_) => return false,
  };
  context.set_aad(aad);
  true
}

#[op2(fast)]
pub fn op_node_decipheriv_decrypt(
  state: &mut OpState,
  #[smi] rid: u32,
  #[buffer] input: &[u8],
  #[buffer] output: &mut [u8],
) -> bool {
  let context = match state.resource_table.get::<cipher::DecipherContext>(rid) {
    Ok(context) => context,
    Err(_) => return false,
  };
  context.decrypt(input, output);
  true
}

#[op2(fast)]
pub fn op_node_decipheriv_take(
  state: &mut OpState,
  #[smi] rid: u32,
) -> Result<(), cipher::DecipherContextError> {
  let context = state
    .resource_table
    .take::<cipher::DecipherContext>(rid)
    .map_err(cipher::DecipherContextError::Resource)?;
  Rc::try_unwrap(context)
    .map_err(|_| cipher::DecipherContextError::ContextInUse)?;
  Ok(())
}

#[op2]
pub fn op_node_decipheriv_final(
  state: &mut OpState,
  #[smi] rid: u32,
  auto_pad: bool,
  #[buffer] input: &[u8],
  #[anybuffer] output: &mut [u8],
  #[buffer] auth_tag: &[u8],
) -> Result<(), cipher::DecipherContextError> {
  let context = state
    .resource_table
    .take::<cipher::DecipherContext>(rid)
    .map_err(cipher::DecipherContextError::Resource)?;
  let context = Rc::try_unwrap(context)
    .map_err(|_| cipher::DecipherContextError::ContextInUse)?;
  context.r#final(auto_pad, input, output, auth_tag)
}

#[op2]
#[buffer]
pub fn op_node_sign(
  #[cppgc] handle: &KeyObjectHandle,
  #[buffer] digest: &[u8],
  #[string] digest_type: &str,
  #[smi] pss_salt_length: Option<u32>,
  #[smi] dsa_signature_encoding: u32,
) -> Result<Box<[u8]>, sign::KeyObjectHandlePrehashedSignAndVerifyError> {
  handle.sign_prehashed(
    digest_type,
    digest,
    pss_salt_length,
    dsa_signature_encoding,
  )
}

#[op2]
pub fn op_node_verify(
  #[cppgc] handle: &KeyObjectHandle,
  #[buffer] digest: &[u8],
  #[string] digest_type: &str,
  #[buffer] signature: &[u8],
  #[smi] pss_salt_length: Option<u32>,
  #[smi] dsa_signature_encoding: u32,
) -> Result<bool, sign::KeyObjectHandlePrehashedSignAndVerifyError> {
  handle.verify_prehashed(
    digest_type,
    digest,
    signature,
    pss_salt_length,
    dsa_signature_encoding,
  )
}

#[derive(Debug, thiserror::Error)]
pub enum Pbkdf2Error {
  #[error("unsupported digest: {0}")]
  UnsupportedDigest(String),
  #[error(transparent)]
  Join(#[from] tokio::task::JoinError),
}

fn pbkdf2_sync(
  password: &[u8],
  salt: &[u8],
  iterations: u32,
  algorithm_name: &str,
  derived_key: &mut [u8],
) -> Result<(), Pbkdf2Error> {
  match_fixed_digest_with_eager_block_buffer!(
    algorithm_name,
    fn <D>() {
      pbkdf2::pbkdf2_hmac::<D>(password, salt, iterations, derived_key);
      Ok(())
    },
    _ => {
      Err(Pbkdf2Error::UnsupportedDigest(algorithm_name.to_string()))
    }
  )
}

#[op2]
pub fn op_node_pbkdf2(
  #[serde] password: StringOrBuffer,
  #[serde] salt: StringOrBuffer,
  #[smi] iterations: u32,
  #[string] digest: &str,
  #[buffer] derived_key: &mut [u8],
) -> bool {
  pbkdf2_sync(&password, &salt, iterations, digest, derived_key).is_ok()
}

#[op2(async)]
#[serde]
pub async fn op_node_pbkdf2_async(
  #[serde] password: StringOrBuffer,
  #[serde] salt: StringOrBuffer,
  #[smi] iterations: u32,
  #[string] digest: String,
  #[number] keylen: usize,
) -> Result<ToJsBuffer, Pbkdf2Error> {
  spawn_blocking(move || {
    let mut derived_key = vec![0; keylen];
    pbkdf2_sync(&password, &salt, iterations, &digest, &mut derived_key)
      .map(|_| derived_key.into())
  })
  .await?
}

#[op2(fast)]
pub fn op_node_fill_random(#[buffer] buf: &mut [u8]) {
  rand::thread_rng().fill(buf);
}

#[op2(async)]
#[serde]
pub async fn op_node_fill_random_async(#[smi] len: i32) -> ToJsBuffer {
  spawn_blocking(move || {
    let mut buf = vec![0u8; len as usize];
    rand::thread_rng().fill(&mut buf[..]);
    buf.into()
  })
  .await
  .unwrap()
}

#[derive(Debug, thiserror::Error)]
pub enum HkdfError {
  #[error("expected secret key")]
  ExpectedSecretKey,
  #[error("HKDF-Expand failed")]
  HkdfExpandFailed,
  #[error("Unsupported digest: {0}")]
  UnsupportedDigest(String),
  #[error(transparent)]
  Join(#[from] tokio::task::JoinError),
}

fn hkdf_sync(
  digest_algorithm: &str,
  handle: &KeyObjectHandle,
  salt: &[u8],
  info: &[u8],
  okm: &mut [u8],
) -> Result<(), HkdfError> {
  let Some(ikm) = handle.as_secret_key() else {
    return Err(HkdfError::ExpectedSecretKey);
  };

  match_fixed_digest_with_eager_block_buffer!(
    digest_algorithm,
    fn <D>() {
      let hk = Hkdf::<D>::new(Some(salt), ikm);
      hk.expand(info, okm)
        .map_err(|_| HkdfError::HkdfExpandFailed)
    },
    _ => {
      Err(HkdfError::UnsupportedDigest(digest_algorithm.to_string()))
    }
  )
}

#[op2(fast)]
pub fn op_node_hkdf(
  #[string] digest_algorithm: &str,
  #[cppgc] handle: &KeyObjectHandle,
  #[buffer] salt: &[u8],
  #[buffer] info: &[u8],
  #[buffer] okm: &mut [u8],
) -> Result<(), HkdfError> {
  hkdf_sync(digest_algorithm, handle, salt, info, okm)
}

#[op2(async)]
#[serde]
pub async fn op_node_hkdf_async(
  #[string] digest_algorithm: String,
  #[cppgc] handle: &KeyObjectHandle,
  #[buffer] salt: JsBuffer,
  #[buffer] info: JsBuffer,
  #[number] okm_len: usize,
) -> Result<ToJsBuffer, HkdfError> {
  let handle = handle.clone();
  spawn_blocking(move || {
    let mut okm = vec![0u8; okm_len];
    hkdf_sync(&digest_algorithm, &handle, &salt, &info, &mut okm)?;
    Ok(okm.into())
  })
  .await?
}

#[op2]
#[serde]
pub fn op_node_dh_compute_secret(
  #[buffer] prime: JsBuffer,
  #[buffer] private_key: JsBuffer,
  #[buffer] their_public_key: JsBuffer,
) -> ToJsBuffer {
  let pubkey: BigUint = BigUint::from_bytes_be(their_public_key.as_ref());
  let privkey: BigUint = BigUint::from_bytes_be(private_key.as_ref());
  let primei: BigUint = BigUint::from_bytes_be(prime.as_ref());
  let shared_secret: BigUint = pubkey.modpow(&privkey, &primei);

  shared_secret.to_bytes_be().into()
}

#[op2(fast)]
#[number]
pub fn op_node_random_int(#[number] min: i64, #[number] max: i64) -> i64 {
  let mut rng = rand::thread_rng();
  // Uniform distribution is required to avoid Modulo Bias
  // https://en.wikipedia.org/wiki/Fisher–Yates_shuffle#Modulo_bias
  let dist = Uniform::from(min..max);

  dist.sample(&mut rng)
}

#[allow(clippy::too_many_arguments)]
fn scrypt(
  password: StringOrBuffer,
  salt: StringOrBuffer,
  keylen: u32,
  cost: u32,
  block_size: u32,
  parallelization: u32,
  _maxmem: u32,
  output_buffer: &mut [u8],
) -> Result<(), deno_core::error::AnyError> {
  // Construct Params
  let params = scrypt::Params::new(
    cost as u8,
    block_size,
    parallelization,
    keylen as usize,
  )
  .unwrap();

  // Call into scrypt
  let res = scrypt::scrypt(&password, &salt, &params, output_buffer);
  if res.is_ok() {
    Ok(())
  } else {
    // TODO(lev): key derivation failed, so what?
    Err(generic_error("scrypt key derivation failed"))
  }
}

#[allow(clippy::too_many_arguments)]
#[op2]
pub fn op_node_scrypt_sync(
  #[serde] password: StringOrBuffer,
  #[serde] salt: StringOrBuffer,
  #[smi] keylen: u32,
  #[smi] cost: u32,
  #[smi] block_size: u32,
  #[smi] parallelization: u32,
  #[smi] maxmem: u32,
  #[anybuffer] output_buffer: &mut [u8],
) -> Result<(), deno_core::error::AnyError> {
  scrypt(
    password,
    salt,
    keylen,
    cost,
    block_size,
    parallelization,
    maxmem,
    output_buffer,
  )
}

#[derive(Debug, thiserror::Error)]
pub enum ScryptAsyncError {
  #[error(transparent)]
  Join(#[from] tokio::task::JoinError),
  #[error(transparent)]
  Other(deno_core::error::AnyError),
}

#[op2(async)]
#[serde]
pub async fn op_node_scrypt_async(
  #[serde] password: StringOrBuffer,
  #[serde] salt: StringOrBuffer,
  #[smi] keylen: u32,
  #[smi] cost: u32,
  #[smi] block_size: u32,
  #[smi] parallelization: u32,
  #[smi] maxmem: u32,
) -> Result<ToJsBuffer, ScryptAsyncError> {
  spawn_blocking(move || {
    let mut output_buffer = vec![0u8; keylen as usize];

    scrypt(
      password,
      salt,
      keylen,
      cost,
      block_size,
      parallelization,
      maxmem,
      &mut output_buffer,
    )
    .map(|_| output_buffer.into())
    .map_err(ScryptAsyncError::Other)
  })
  .await?
}

#[derive(Debug, thiserror::Error)]
pub enum EcdhEncodePubKey {
  #[error("Invalid public key")]
  InvalidPublicKey,
  #[error("Unsupported curve")]
  UnsupportedCurve,
  #[error(transparent)]
  Sec1(#[from] sec1::Error),
}

#[op2]
#[buffer]
pub fn op_node_ecdh_encode_pubkey(
  #[string] curve: &str,
  #[buffer] pubkey: &[u8],
  compress: bool,
) -> Result<Vec<u8>, EcdhEncodePubKey> {
  use elliptic_curve::sec1::FromEncodedPoint;

  match curve {
    "secp256k1" => {
      let pubkey =
        elliptic_curve::PublicKey::<k256::Secp256k1>::from_encoded_point(
          &elliptic_curve::sec1::EncodedPoint::<k256::Secp256k1>::from_bytes(
            pubkey,
          )?,
        );
      // CtOption does not expose its variants.
      if pubkey.is_none().into() {
        return Err(EcdhEncodePubKey::InvalidPublicKey);
      }

      let pubkey = pubkey.unwrap();

      Ok(pubkey.to_encoded_point(compress).as_ref().to_vec())
    }
    "prime256v1" | "secp256r1" => {
      let pubkey = elliptic_curve::PublicKey::<NistP256>::from_encoded_point(
        &elliptic_curve::sec1::EncodedPoint::<NistP256>::from_bytes(pubkey)?,
      );
      // CtOption does not expose its variants.
      if pubkey.is_none().into() {
        return Err(EcdhEncodePubKey::InvalidPublicKey);
      }

      let pubkey = pubkey.unwrap();

      Ok(pubkey.to_encoded_point(compress).as_ref().to_vec())
    }
    "secp384r1" => {
      let pubkey = elliptic_curve::PublicKey::<NistP384>::from_encoded_point(
        &elliptic_curve::sec1::EncodedPoint::<NistP384>::from_bytes(pubkey)?,
      );
      // CtOption does not expose its variants.
      if pubkey.is_none().into() {
        return Err(EcdhEncodePubKey::InvalidPublicKey);
      }

      let pubkey = pubkey.unwrap();

      Ok(pubkey.to_encoded_point(compress).as_ref().to_vec())
    }
    "secp224r1" => {
      let pubkey = elliptic_curve::PublicKey::<NistP224>::from_encoded_point(
        &elliptic_curve::sec1::EncodedPoint::<NistP224>::from_bytes(pubkey)?,
      );
      // CtOption does not expose its variants.
      if pubkey.is_none().into() {
        return Err(EcdhEncodePubKey::InvalidPublicKey);
      }

      let pubkey = pubkey.unwrap();

      Ok(pubkey.to_encoded_point(compress).as_ref().to_vec())
    }
    &_ => Err(EcdhEncodePubKey::UnsupportedCurve),
  }
}

#[op2(fast)]
pub fn op_node_ecdh_generate_keys(
  #[string] curve: &str,
  #[buffer] pubbuf: &mut [u8],
  #[buffer] privbuf: &mut [u8],
  #[string] format: &str,
) -> Result<(), deno_core::error::AnyError> {
  let mut rng = rand::thread_rng();
  let compress = format == "compressed";
  match curve {
    "secp256k1" => {
      let privkey =
        elliptic_curve::SecretKey::<k256::Secp256k1>::random(&mut rng);
      let pubkey = privkey.public_key();
      pubbuf.copy_from_slice(pubkey.to_encoded_point(compress).as_ref());
      privbuf.copy_from_slice(privkey.to_nonzero_scalar().to_bytes().as_ref());

      Ok(())
    }
    "prime256v1" | "secp256r1" => {
      let privkey = elliptic_curve::SecretKey::<NistP256>::random(&mut rng);
      let pubkey = privkey.public_key();
      pubbuf.copy_from_slice(pubkey.to_encoded_point(compress).as_ref());
      privbuf.copy_from_slice(privkey.to_nonzero_scalar().to_bytes().as_ref());

      Ok(())
    }
    "secp384r1" => {
      let privkey = elliptic_curve::SecretKey::<NistP384>::random(&mut rng);
      let pubkey = privkey.public_key();
      pubbuf.copy_from_slice(pubkey.to_encoded_point(compress).as_ref());
      privbuf.copy_from_slice(privkey.to_nonzero_scalar().to_bytes().as_ref());

      Ok(())
    }
    "secp224r1" => {
      let privkey = elliptic_curve::SecretKey::<NistP224>::random(&mut rng);
      let pubkey = privkey.public_key();
      pubbuf.copy_from_slice(pubkey.to_encoded_point(compress).as_ref());
      privbuf.copy_from_slice(privkey.to_nonzero_scalar().to_bytes().as_ref());

      Ok(())
    }
    &_ => Err(type_error(format!("Unsupported curve: {}", curve))),
  }
}

#[derive(Debug, thiserror::Error)]
pub enum EcdhError {
  #[error("Public key is not valid for specified curve")]
  InvalidPublicKey,
  #[error("Private key is not valid for specified curve")]
  InvalidPrivateKey,
  #[error("Unsupported curve")]
  UnsupportedCurve,
}

#[op2]
pub fn op_node_ecdh_compute_secret(
  #[string] curve: &str,
  #[buffer] this_priv: Option<JsBuffer>,
  #[buffer] their_pub: &mut [u8],
  #[buffer] secret: &mut [u8],
) -> Result<(), EcdhError> {
  let this_priv = this_priv.ok_or(EcdhError::InvalidPrivateKey)?;
  match curve {
    "secp256k1" => {
      let their_public_key =
        elliptic_curve::PublicKey::<k256::Secp256k1>::from_sec1_bytes(
          their_pub,
        )
        .map_err(|_| EcdhError::InvalidPublicKey)?;
      let this_private_key =
        elliptic_curve::SecretKey::<k256::Secp256k1>::from_slice(&this_priv)
          .map_err(|_| EcdhError::InvalidPrivateKey)?;
      let shared_secret = elliptic_curve::ecdh::diffie_hellman(
        this_private_key.to_nonzero_scalar(),
        their_public_key.as_affine(),
      );
      secret.copy_from_slice(shared_secret.raw_secret_bytes());
    }
    "prime256v1" | "secp256r1" => {
      let their_public_key =
        elliptic_curve::PublicKey::<NistP256>::from_sec1_bytes(their_pub)
          .map_err(|_| EcdhError::InvalidPublicKey)?;
      let this_private_key =
        elliptic_curve::SecretKey::<NistP256>::from_slice(&this_priv)
          .map_err(|_| EcdhError::InvalidPrivateKey)?;
      let shared_secret = elliptic_curve::ecdh::diffie_hellman(
        this_private_key.to_nonzero_scalar(),
        their_public_key.as_affine(),
      );
      secret.copy_from_slice(shared_secret.raw_secret_bytes());
    }
    "secp384r1" => {
      let their_public_key =
        elliptic_curve::PublicKey::<NistP384>::from_sec1_bytes(their_pub)
          .map_err(|_| EcdhError::InvalidPublicKey)?;
      let this_private_key =
        elliptic_curve::SecretKey::<NistP384>::from_slice(&this_priv)
          .map_err(|_| EcdhError::InvalidPrivateKey)?;
      let shared_secret = elliptic_curve::ecdh::diffie_hellman(
        this_private_key.to_nonzero_scalar(),
        their_public_key.as_affine(),
      );
      secret.copy_from_slice(shared_secret.raw_secret_bytes());
    }
    "secp224r1" => {
      let their_public_key =
        elliptic_curve::PublicKey::<NistP224>::from_sec1_bytes(their_pub)
          .map_err(|_| EcdhError::InvalidPublicKey)?;
      let this_private_key =
        elliptic_curve::SecretKey::<NistP224>::from_slice(&this_priv)
          .map_err(|_| EcdhError::InvalidPrivateKey)?;
      let shared_secret = elliptic_curve::ecdh::diffie_hellman(
        this_private_key.to_nonzero_scalar(),
        their_public_key.as_affine(),
      );
      secret.copy_from_slice(shared_secret.raw_secret_bytes());
    }
    _ => return Err(EcdhError::UnsupportedCurve),
  }

  Ok(())
}

#[op2(fast)]
pub fn op_node_ecdh_compute_public_key(
  #[string] curve: &str,
  #[buffer] privkey: &[u8],
  #[buffer] pubkey: &mut [u8],
) -> Result<(), EcdhError> {
  match curve {
    "secp256k1" => {
      let this_private_key =
        elliptic_curve::SecretKey::<k256::Secp256k1>::from_slice(privkey)
          .map_err(|_| EcdhError::InvalidPrivateKey)?;
      let public_key = this_private_key.public_key();
      pubkey.copy_from_slice(public_key.to_sec1_bytes().as_ref());
    }
    "prime256v1" | "secp256r1" => {
      let this_private_key =
        elliptic_curve::SecretKey::<NistP256>::from_slice(privkey)
          .map_err(|_| EcdhError::InvalidPrivateKey)?;
      let public_key = this_private_key.public_key();
      pubkey.copy_from_slice(public_key.to_sec1_bytes().as_ref());
    }
    "secp384r1" => {
      let this_private_key =
        elliptic_curve::SecretKey::<NistP384>::from_slice(privkey)
          .map_err(|_| EcdhError::InvalidPrivateKey)?;
      let public_key = this_private_key.public_key();
      pubkey.copy_from_slice(public_key.to_sec1_bytes().as_ref());
    }
    "secp224r1" => {
      let this_private_key =
        elliptic_curve::SecretKey::<NistP224>::from_slice(privkey)
          .map_err(|_| EcdhError::InvalidPrivateKey)?;
      let public_key = this_private_key.public_key();
      pubkey.copy_from_slice(public_key.to_sec1_bytes().as_ref());
    }
    _ => return Err(EcdhError::UnsupportedCurve),
  }

  Ok(())
}

#[inline]
fn gen_prime(size: usize) -> ToJsBuffer {
  primes::Prime::generate(size).0.to_bytes_be().into()
}

#[op2]
#[serde]
pub fn op_node_gen_prime(#[number] size: usize) -> ToJsBuffer {
  gen_prime(size)
}

#[op2(async)]
#[serde]
pub async fn op_node_gen_prime_async(
  #[number] size: usize,
) -> Result<ToJsBuffer, tokio::task::JoinError> {
  spawn_blocking(move || gen_prime(size)).await
}

#[derive(Debug, thiserror::Error)]
pub enum DiffieHellmanError {
  #[error("Expected private key")]
  ExpectedPrivateKey,
  #[error("Expected public key")]
  ExpectedPublicKey,
  #[error("DH parameters mismatch")]
  DhParametersMismatch,
  #[error("Unsupported key type for diffie hellman, or key type mismatch")]
  UnsupportedKeyTypeForDiffieHellmanOrKeyTypeMismatch,
}

#[op2]
#[buffer]
pub fn op_node_diffie_hellman(
  #[cppgc] private: &KeyObjectHandle,
  #[cppgc] public: &KeyObjectHandle,
) -> Result<Box<[u8]>, DiffieHellmanError> {
  let private = private
    .as_private_key()
    .ok_or(DiffieHellmanError::ExpectedPrivateKey)?;
  let public = public
    .as_public_key()
    .ok_or(DiffieHellmanError::ExpectedPublicKey)?;

  let res =
    match (private, &*public) {
      (
        AsymmetricPrivateKey::Ec(EcPrivateKey::P224(private)),
        AsymmetricPublicKey::Ec(EcPublicKey::P224(public)),
      ) => p224::ecdh::diffie_hellman(
        private.to_nonzero_scalar(),
        public.as_affine(),
      )
      .raw_secret_bytes()
      .to_vec()
      .into_boxed_slice(),
      (
        AsymmetricPrivateKey::Ec(EcPrivateKey::P256(private)),
        AsymmetricPublicKey::Ec(EcPublicKey::P256(public)),
      ) => p256::ecdh::diffie_hellman(
        private.to_nonzero_scalar(),
        public.as_affine(),
      )
      .raw_secret_bytes()
      .to_vec()
      .into_boxed_slice(),
      (
        AsymmetricPrivateKey::Ec(EcPrivateKey::P384(private)),
        AsymmetricPublicKey::Ec(EcPublicKey::P384(public)),
      ) => p384::ecdh::diffie_hellman(
        private.to_nonzero_scalar(),
        public.as_affine(),
      )
      .raw_secret_bytes()
      .to_vec()
      .into_boxed_slice(),
      (
        AsymmetricPrivateKey::X25519(private),
        AsymmetricPublicKey::X25519(public),
      ) => private
        .diffie_hellman(public)
        .to_bytes()
        .into_iter()
        .collect(),
      (AsymmetricPrivateKey::Dh(private), AsymmetricPublicKey::Dh(public)) => {
        if private.params.prime != public.params.prime
          || private.params.base != public.params.base
        {
          return Err(DiffieHellmanError::DhParametersMismatch);
        }

        // OSIP - Octet-String-to-Integer primitive
        let public_key = public.key.clone().into_vec();
        let pubkey = BigUint::from_bytes_be(&public_key);

        // Exponentiation (z = y^x mod p)
        let prime = BigUint::from_bytes_be(private.params.prime.as_bytes());
        let private_key = private.key.clone().into_vec();
        let private_key = BigUint::from_bytes_be(&private_key);
        let shared_secret = pubkey.modpow(&private_key, &prime);

        shared_secret.to_bytes_be().into()
      }
      _ => return Err(
        DiffieHellmanError::UnsupportedKeyTypeForDiffieHellmanOrKeyTypeMismatch,
      ),
    };

  Ok(res)
}

#[derive(Debug, thiserror::Error)]
pub enum SignEd25519Error {
  #[error("Expected private key")]
  ExpectedPrivateKey,
  #[error("Expected Ed25519 private key")]
  ExpectedEd25519PrivateKey,
  #[error("Invalid Ed25519 private key")]
  InvalidEd25519PrivateKey,
}

#[op2(fast)]
pub fn op_node_sign_ed25519(
  #[cppgc] key: &KeyObjectHandle,
  #[buffer] data: &[u8],
  #[buffer] signature: &mut [u8],
) -> Result<(), SignEd25519Error> {
  let private = key
    .as_private_key()
    .ok_or(SignEd25519Error::ExpectedPrivateKey)?;

  let ed25519 = match private {
    AsymmetricPrivateKey::Ed25519(private) => private,
    _ => return Err(SignEd25519Error::ExpectedEd25519PrivateKey),
  };

  let pair = Ed25519KeyPair::from_seed_unchecked(ed25519.as_bytes().as_slice())
    .map_err(|_| SignEd25519Error::InvalidEd25519PrivateKey)?;
  signature.copy_from_slice(pair.sign(data).as_ref());

  Ok(())
}

#[derive(Debug, thiserror::Error)]
pub enum VerifyEd25519Error {
  #[error("Expected public key")]
  ExpectedPublicKey,
  #[error("Expected Ed25519 public key")]
  ExpectedEd25519PublicKey,
}

#[op2(fast)]
pub fn op_node_verify_ed25519(
  #[cppgc] key: &KeyObjectHandle,
  #[buffer] data: &[u8],
  #[buffer] signature: &[u8],
) -> Result<bool, VerifyEd25519Error> {
  let public = key
    .as_public_key()
    .ok_or(VerifyEd25519Error::ExpectedPublicKey)?;

  let ed25519 = match &*public {
    AsymmetricPublicKey::Ed25519(public) => public,
    _ => return Err(VerifyEd25519Error::ExpectedEd25519PublicKey),
  };

  let verified = ring::signature::UnparsedPublicKey::new(
    &ring::signature::ED25519,
    ed25519.as_bytes().as_slice(),
  )
  .verify(data, signature)
  .is_ok();

  Ok(verified)
}
