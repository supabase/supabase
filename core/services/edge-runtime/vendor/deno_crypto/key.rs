// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use ring::agreement::Algorithm as RingAlgorithm;
use ring::digest;
use ring::hkdf;
use ring::hmac::Algorithm as HmacAlgorithm;
use ring::signature::EcdsaSigningAlgorithm;
use ring::signature::EcdsaVerificationAlgorithm;
use serde::Deserialize;
use serde::Serialize;

#[derive(Serialize, Deserialize, Copy, Clone)]
#[serde(rename_all = "camelCase")]
pub enum KeyType {
  Public,
  Private,
  Secret,
}

#[derive(Serialize, Deserialize, Copy, Clone, Eq, PartialEq)]
pub enum CryptoHash {
  #[serde(rename = "SHA-1")]
  Sha1,
  #[serde(rename = "SHA-256")]
  Sha256,
  #[serde(rename = "SHA-384")]
  Sha384,
  #[serde(rename = "SHA-512")]
  Sha512,
}

#[derive(Serialize, Deserialize, Copy, Clone)]
pub enum CryptoNamedCurve {
  #[serde(rename = "P-256")]
  P256,
  #[serde(rename = "P-384")]
  P384,
}

impl From<CryptoNamedCurve> for &RingAlgorithm {
  fn from(curve: CryptoNamedCurve) -> &'static RingAlgorithm {
    match curve {
      CryptoNamedCurve::P256 => &ring::agreement::ECDH_P256,
      CryptoNamedCurve::P384 => &ring::agreement::ECDH_P384,
    }
  }
}

impl From<CryptoNamedCurve> for &EcdsaSigningAlgorithm {
  fn from(curve: CryptoNamedCurve) -> &'static EcdsaSigningAlgorithm {
    match curve {
      CryptoNamedCurve::P256 => {
        &ring::signature::ECDSA_P256_SHA256_FIXED_SIGNING
      }
      CryptoNamedCurve::P384 => {
        &ring::signature::ECDSA_P384_SHA384_FIXED_SIGNING
      }
    }
  }
}

impl From<CryptoNamedCurve> for &EcdsaVerificationAlgorithm {
  fn from(curve: CryptoNamedCurve) -> &'static EcdsaVerificationAlgorithm {
    match curve {
      CryptoNamedCurve::P256 => &ring::signature::ECDSA_P256_SHA256_FIXED,
      CryptoNamedCurve::P384 => &ring::signature::ECDSA_P384_SHA384_FIXED,
    }
  }
}

impl From<CryptoHash> for HmacAlgorithm {
  fn from(hash: CryptoHash) -> HmacAlgorithm {
    match hash {
      CryptoHash::Sha1 => ring::hmac::HMAC_SHA1_FOR_LEGACY_USE_ONLY,
      CryptoHash::Sha256 => ring::hmac::HMAC_SHA256,
      CryptoHash::Sha384 => ring::hmac::HMAC_SHA384,
      CryptoHash::Sha512 => ring::hmac::HMAC_SHA512,
    }
  }
}

impl From<CryptoHash> for &'static digest::Algorithm {
  fn from(hash: CryptoHash) -> &'static digest::Algorithm {
    match hash {
      CryptoHash::Sha1 => &digest::SHA1_FOR_LEGACY_USE_ONLY,
      CryptoHash::Sha256 => &digest::SHA256,
      CryptoHash::Sha384 => &digest::SHA384,
      CryptoHash::Sha512 => &digest::SHA512,
    }
  }
}

pub struct HkdfOutput<T>(pub T);

impl hkdf::KeyType for HkdfOutput<usize> {
  fn len(&self) -> usize {
    self.0
  }
}

#[derive(Serialize, Deserialize, Copy, Clone, Debug, Eq, PartialEq)]
#[serde(rename_all = "camelCase")]
pub enum KeyUsage {
  Encrypt,
  Decrypt,
  Sign,
  Verify,
  DeriveKey,
  DeriveBits,
  WrapKey,
  UnwrapKey,
}

#[derive(Serialize, Deserialize, Clone, Copy)]
pub enum Algorithm {
  #[serde(rename = "RSASSA-PKCS1-v1_5")]
  RsassaPkcs1v15,
  #[serde(rename = "RSA-PSS")]
  RsaPss,
  #[serde(rename = "RSA-OAEP")]
  RsaOaep,
  #[serde(rename = "ECDSA")]
  Ecdsa,
  #[serde(rename = "ECDH")]
  Ecdh,
  #[serde(rename = "AES-CTR")]
  AesCtr,
  #[serde(rename = "AES-CBC")]
  AesCbc,
  #[serde(rename = "AES-GCM")]
  AesGcm,
  #[serde(rename = "AES-KW")]
  AesKw,
  #[serde(rename = "HMAC")]
  Hmac,
  #[serde(rename = "PBKDF2")]
  Pbkdf2,
  #[serde(rename = "HKDF")]
  Hkdf,
}
