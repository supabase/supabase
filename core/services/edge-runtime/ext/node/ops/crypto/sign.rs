// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
use rand::rngs::OsRng;
use rsa::signature::hazmat::PrehashSigner as _;
use rsa::signature::hazmat::PrehashVerifier as _;
use rsa::traits::SignatureScheme as _;
use spki::der::Decode;

use crate::ops::crypto::digest::match_fixed_digest;
use crate::ops::crypto::digest::match_fixed_digest_with_oid;

use super::keys::AsymmetricPrivateKey;
use super::keys::AsymmetricPublicKey;
use super::keys::EcPrivateKey;
use super::keys::EcPublicKey;
use super::keys::KeyObjectHandle;
use super::keys::RsaPssHashAlgorithm;
use core::ops::Add;
use ecdsa::der::MaxOverhead;
use ecdsa::der::MaxSize;
use elliptic_curve::generic_array::ArrayLength;
use elliptic_curve::FieldBytesSize;

fn dsa_signature<C: elliptic_curve::PrimeCurve>(
  encoding: u32,
  signature: ecdsa::Signature<C>,
) -> Result<Box<[u8]>, KeyObjectHandlePrehashedSignAndVerifyError>
where
  MaxSize<C>: ArrayLength<u8>,
  <FieldBytesSize<C> as Add>::Output: Add<MaxOverhead> + ArrayLength<u8>,
{
  match encoding {
    // DER
    0 => Ok(signature.to_der().to_bytes().to_vec().into_boxed_slice()),
    // IEEE P1363
    1 => Ok(signature.to_bytes().to_vec().into_boxed_slice()),
    _ => Err(
      KeyObjectHandlePrehashedSignAndVerifyError::InvalidDsaSignatureEncoding,
    ),
  }
}

#[derive(Debug, thiserror::Error)]
pub enum KeyObjectHandlePrehashedSignAndVerifyError {
  #[error("invalid DSA signature encoding")]
  InvalidDsaSignatureEncoding,
  #[error("key is not a private key")]
  KeyIsNotPrivate,
  #[error("digest not allowed for RSA signature: {0}")]
  DigestNotAllowedForRsaSignature(String),
  #[error("failed to sign digest with RSA")]
  FailedToSignDigestWithRsa,
  #[error("digest not allowed for RSA-PSS signature: {0}")]
  DigestNotAllowedForRsaPssSignature(String),
  #[error("failed to sign digest with RSA-PSS")]
  FailedToSignDigestWithRsaPss,
  #[error("failed to sign digest with DSA")]
  FailedToSignDigestWithDsa,
  #[error("rsa-pss with different mf1 hash algorithm and hash algorithm is not supported")]
  RsaPssHashAlgorithmUnsupported,
  #[error(
    "private key does not allow {actual} to be used, expected {expected}"
  )]
  PrivateKeyDisallowsUsage { actual: String, expected: String },
  #[error("failed to sign digest")]
  FailedToSignDigest,
  #[error("x25519 key cannot be used for signing")]
  X25519KeyCannotBeUsedForSigning,
  #[error("Ed25519 key cannot be used for prehashed signing")]
  Ed25519KeyCannotBeUsedForPrehashedSigning,
  #[error("DH key cannot be used for signing")]
  DhKeyCannotBeUsedForSigning,
  #[error("key is not a public or private key")]
  KeyIsNotPublicOrPrivate,
  #[error("Invalid DSA signature")]
  InvalidDsaSignature,
  #[error("x25519 key cannot be used for verification")]
  X25519KeyCannotBeUsedForVerification,
  #[error("Ed25519 key cannot be used for prehashed verification")]
  Ed25519KeyCannotBeUsedForPrehashedVerification,
  #[error("DH key cannot be used for verification")]
  DhKeyCannotBeUsedForVerification,
}

impl KeyObjectHandle {
  pub fn sign_prehashed(
    &self,
    digest_type: &str,
    digest: &[u8],
    pss_salt_length: Option<u32>,
    dsa_signature_encoding: u32,
  ) -> Result<Box<[u8]>, KeyObjectHandlePrehashedSignAndVerifyError> {
    let private_key = self
      .as_private_key()
      .ok_or(KeyObjectHandlePrehashedSignAndVerifyError::KeyIsNotPrivate)?;

    match private_key {
      AsymmetricPrivateKey::Rsa(key) => {
        let signer = if digest_type == "md5-sha1" {
          rsa::pkcs1v15::Pkcs1v15Sign::new_unprefixed()
        } else {
          match_fixed_digest_with_oid!(
            digest_type,
            fn <D>() {
              rsa::pkcs1v15::Pkcs1v15Sign::new::<D>()
            },
            _ => {
              return Err(KeyObjectHandlePrehashedSignAndVerifyError::DigestNotAllowedForRsaSignature(digest_type.to_string()))
            }
          )
        };

        let signature = signer
          .sign(Some(&mut OsRng), key, digest)
          .map_err(|_| KeyObjectHandlePrehashedSignAndVerifyError::FailedToSignDigestWithRsa)?;
        Ok(signature.into())
      }
      AsymmetricPrivateKey::RsaPss(key) => {
        let mut hash_algorithm = None;
        let mut salt_length = None;
        if let Some(details) = &key.details {
          if details.hash_algorithm != details.mf1_hash_algorithm {
            return Err(KeyObjectHandlePrehashedSignAndVerifyError::RsaPssHashAlgorithmUnsupported);
          }
          hash_algorithm = Some(details.hash_algorithm);
          salt_length = Some(details.salt_length as usize);
        }
        if let Some(s) = pss_salt_length {
          salt_length = Some(s as usize);
        }
        let pss = match_fixed_digest_with_oid!(
          digest_type,
          fn <D>(algorithm: Option<RsaPssHashAlgorithm>) {
            if let Some(hash_algorithm) = hash_algorithm.take() {
              if Some(hash_algorithm) != algorithm {
                return Err(KeyObjectHandlePrehashedSignAndVerifyError::PrivateKeyDisallowsUsage {
                  actual: digest_type.to_string(),
                  expected: hash_algorithm.as_str().to_string(),
                });
              }
            }
            if let Some(salt_length) = salt_length {
              rsa::pss::Pss::new_with_salt::<D>(salt_length)
            } else {
              rsa::pss::Pss::new::<D>()
            }
          },
          _ => {
            return Err(KeyObjectHandlePrehashedSignAndVerifyError::DigestNotAllowedForRsaPssSignature(digest_type.to_string()));
          }
        );
        let signature = pss
          .sign(Some(&mut OsRng), &key.key, digest)
          .map_err(|_| KeyObjectHandlePrehashedSignAndVerifyError::FailedToSignDigestWithRsaPss)?;
        Ok(signature.into())
      }
      AsymmetricPrivateKey::Dsa(key) => {
        let res = match_fixed_digest!(
          digest_type,
          fn <D>() {
            key.sign_prehashed_rfc6979::<D>(digest)
          },
          _ => {
            return Err(KeyObjectHandlePrehashedSignAndVerifyError::DigestNotAllowedForRsaSignature(digest_type.to_string()))
          }
        );

        let signature =
          res.map_err(|_| KeyObjectHandlePrehashedSignAndVerifyError::FailedToSignDigestWithDsa)?;
        Ok(signature.into())
      }
      AsymmetricPrivateKey::Ec(key) => match key {
        EcPrivateKey::P224(key) => {
          let signing_key = p224::ecdsa::SigningKey::from(key);
          let signature: p224::ecdsa::Signature = signing_key
            .sign_prehash(digest)
            .map_err(|_| KeyObjectHandlePrehashedSignAndVerifyError::FailedToSignDigest)?;

          dsa_signature(dsa_signature_encoding, signature)
        }
        EcPrivateKey::P256(key) => {
          let signing_key = p256::ecdsa::SigningKey::from(key);
          let signature: p256::ecdsa::Signature = signing_key
            .sign_prehash(digest)
            .map_err(|_| KeyObjectHandlePrehashedSignAndVerifyError::FailedToSignDigest)?;

          dsa_signature(dsa_signature_encoding, signature)
        }
        EcPrivateKey::P384(key) => {
          let signing_key = p384::ecdsa::SigningKey::from(key);
          let signature: p384::ecdsa::Signature = signing_key
            .sign_prehash(digest)
            .map_err(|_| KeyObjectHandlePrehashedSignAndVerifyError::FailedToSignDigest)?;

          dsa_signature(dsa_signature_encoding, signature)
        }
      },
      AsymmetricPrivateKey::X25519(_) => {
        Err(KeyObjectHandlePrehashedSignAndVerifyError::X25519KeyCannotBeUsedForSigning)
      }
      AsymmetricPrivateKey::Ed25519(_) => Err(KeyObjectHandlePrehashedSignAndVerifyError::Ed25519KeyCannotBeUsedForPrehashedSigning),
      AsymmetricPrivateKey::Dh(_) => {
        Err(KeyObjectHandlePrehashedSignAndVerifyError::DhKeyCannotBeUsedForSigning)
      }
    }
  }

  pub fn verify_prehashed(
    &self,
    digest_type: &str,
    digest: &[u8],
    signature: &[u8],
    pss_salt_length: Option<u32>,
    dsa_signature_encoding: u32,
  ) -> Result<bool, KeyObjectHandlePrehashedSignAndVerifyError> {
    let public_key = self.as_public_key().ok_or(
      KeyObjectHandlePrehashedSignAndVerifyError::KeyIsNotPublicOrPrivate,
    )?;

    match &*public_key {
      AsymmetricPublicKey::Rsa(key) => {
        let signer = if digest_type == "md5-sha1" {
          rsa::pkcs1v15::Pkcs1v15Sign::new_unprefixed()
        } else {
          match_fixed_digest_with_oid!(
            digest_type,
            fn <D>() {
              rsa::pkcs1v15::Pkcs1v15Sign::new::<D>()
            },
            _ => {
              return Err(KeyObjectHandlePrehashedSignAndVerifyError::DigestNotAllowedForRsaSignature(digest_type.to_string()))
            }
          )
        };

        Ok(signer.verify(key, digest, signature).is_ok())
      }
      AsymmetricPublicKey::RsaPss(key) => {
        let mut hash_algorithm = None;
        let mut salt_length = None;
        if let Some(details) = &key.details {
          if details.hash_algorithm != details.mf1_hash_algorithm {
            return Err(KeyObjectHandlePrehashedSignAndVerifyError::RsaPssHashAlgorithmUnsupported);
          }
          hash_algorithm = Some(details.hash_algorithm);
          salt_length = Some(details.salt_length as usize);
        }
        if let Some(s) = pss_salt_length {
          salt_length = Some(s as usize);
        }
        let pss = match_fixed_digest_with_oid!(
          digest_type,
          fn <D>(algorithm: Option<RsaPssHashAlgorithm>) {
            if let Some(hash_algorithm) = hash_algorithm.take() {
              if Some(hash_algorithm) != algorithm {
                return Err(KeyObjectHandlePrehashedSignAndVerifyError::PrivateKeyDisallowsUsage {
                  actual: digest_type.to_string(),
                  expected: hash_algorithm.as_str().to_string(),
                });
              }
            }
            if let Some(salt_length) = salt_length {
              rsa::pss::Pss::new_with_salt::<D>(salt_length)
            } else {
              rsa::pss::Pss::new::<D>()
            }
          },
          _ => {
            return Err(KeyObjectHandlePrehashedSignAndVerifyError::DigestNotAllowedForRsaPssSignature(digest_type.to_string()));
          }
        );
        Ok(pss.verify(&key.key, digest, signature).is_ok())
      }
      AsymmetricPublicKey::Dsa(key) => {
        let signature = dsa::Signature::from_der(signature)
          .map_err(|_| KeyObjectHandlePrehashedSignAndVerifyError::InvalidDsaSignature)?;
        Ok(key.verify_prehash(digest, &signature).is_ok())
      }
      AsymmetricPublicKey::Ec(key) => match key {
        EcPublicKey::P224(key) => {
          let verifying_key = p224::ecdsa::VerifyingKey::from(key);
          let signature = if dsa_signature_encoding == 0 {
            p224::ecdsa::Signature::from_der(signature)
          } else {
            p224::ecdsa::Signature::from_bytes(signature.into())
          };
          let Ok(signature) = signature else {
            return Ok(false);
          };
          Ok(verifying_key.verify_prehash(digest, &signature).is_ok())
        }
        EcPublicKey::P256(key) => {
          let verifying_key = p256::ecdsa::VerifyingKey::from(key);
          let signature = if dsa_signature_encoding == 0 {
            p256::ecdsa::Signature::from_der(signature)
          } else {
            p256::ecdsa::Signature::from_bytes(signature.into())
          };
          let Ok(signature) = signature else {
            return Ok(false);
          };
          Ok(verifying_key.verify_prehash(digest, &signature).is_ok())
        }
        EcPublicKey::P384(key) => {
          let verifying_key = p384::ecdsa::VerifyingKey::from(key);
          let signature = if dsa_signature_encoding == 0 {
            p384::ecdsa::Signature::from_der(signature)
          } else {
            p384::ecdsa::Signature::from_bytes(signature.into())
          };
          let Ok(signature) = signature else {
            return Ok(false);
          };
          Ok(verifying_key.verify_prehash(digest, &signature).is_ok())
        }
      },
      AsymmetricPublicKey::X25519(_) => {
        Err(KeyObjectHandlePrehashedSignAndVerifyError::X25519KeyCannotBeUsedForVerification)
      }
      AsymmetricPublicKey::Ed25519(_) => Err(KeyObjectHandlePrehashedSignAndVerifyError::Ed25519KeyCannotBeUsedForPrehashedVerification),
      AsymmetricPublicKey::Dh(_) => {
        Err(KeyObjectHandlePrehashedSignAndVerifyError::DhKeyCannotBeUsedForVerification)
      }
    }
  }
}
