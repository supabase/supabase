// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use std::borrow::Cow;

use deno_core::JsBuffer;
use deno_core::ToJsBuffer;
use elliptic_curve::sec1::ToEncodedPoint;
use p256::pkcs8::DecodePrivateKey;
use rsa::pkcs1::DecodeRsaPrivateKey;
use rsa::pkcs1::EncodeRsaPublicKey;
use rsa::RsaPrivateKey;
use serde::Deserialize;
use serde::Serialize;

pub const RSA_ENCRYPTION_OID: const_oid::ObjectIdentifier =
  const_oid::ObjectIdentifier::new_unwrap("1.2.840.113549.1.1.1");

pub const ID_SECP256R1_OID: const_oid::ObjectIdentifier =
  const_oid::ObjectIdentifier::new_unwrap("1.2.840.10045.3.1.7");
pub const ID_SECP384R1_OID: const_oid::ObjectIdentifier =
  const_oid::ObjectIdentifier::new_unwrap("1.3.132.0.34");
pub const ID_SECP521R1_OID: const_oid::ObjectIdentifier =
  const_oid::ObjectIdentifier::new_unwrap("1.3.132.0.35");

#[derive(Serialize, Deserialize, Copy, Clone, Eq, PartialEq)]
pub enum ShaHash {
  #[serde(rename = "SHA-1")]
  Sha1,
  #[serde(rename = "SHA-256")]
  Sha256,
  #[serde(rename = "SHA-384")]
  Sha384,
  #[serde(rename = "SHA-512")]
  Sha512,
}

#[derive(Serialize, Deserialize, Copy, Clone, Eq, PartialEq)]
pub enum EcNamedCurve {
  #[serde(rename = "P-256")]
  P256,
  #[serde(rename = "P-384")]
  P384,
  #[serde(rename = "P-521")]
  P521,
}

#[derive(Deserialize)]
#[serde(rename_all = "lowercase", tag = "type", content = "data")]
pub enum V8RawKeyData {
  Secret(JsBuffer),
  Private(JsBuffer),
  Public(JsBuffer),
}

#[derive(Serialize)]
#[serde(rename_all = "lowercase", tag = "type", content = "data")]
pub enum RustRawKeyData {
  Secret(ToJsBuffer),
  Private(ToJsBuffer),
  Public(ToJsBuffer),
}

#[derive(Debug, thiserror::Error)]
pub enum SharedError {
  #[error("expected valid private key")]
  ExpectedValidPrivateKey,
  #[error("expected valid public key")]
  ExpectedValidPublicKey,
  #[error("expected valid private EC key")]
  ExpectedValidPrivateECKey,
  #[error("expected valid public EC key")]
  ExpectedValidPublicECKey,
  #[error("expected private key")]
  ExpectedPrivateKey,
  #[error("expected public key")]
  ExpectedPublicKey,
  #[error("expected secret key")]
  ExpectedSecretKey,
  #[error("failed to decode private key")]
  FailedDecodePrivateKey,
  #[error("failed to decode public key")]
  FailedDecodePublicKey,
  #[error("unsupported format")]
  UnsupportedFormat,
}

impl V8RawKeyData {
  pub fn as_rsa_public_key(&self) -> Result<Cow<'_, [u8]>, SharedError> {
    match self {
      V8RawKeyData::Public(data) => Ok(Cow::Borrowed(data)),
      V8RawKeyData::Private(data) => {
        let private_key = RsaPrivateKey::from_pkcs1_der(data)
          .map_err(|_| SharedError::ExpectedValidPrivateKey)?;

        let public_key_doc = private_key
          .to_public_key()
          .to_pkcs1_der()
          .map_err(|_| SharedError::ExpectedValidPublicKey)?;

        Ok(Cow::Owned(public_key_doc.as_bytes().into()))
      }
      _ => Err(SharedError::ExpectedPublicKey),
    }
  }

  pub fn as_rsa_private_key(&self) -> Result<&[u8], SharedError> {
    match self {
      V8RawKeyData::Private(data) => Ok(data),
      _ => Err(SharedError::ExpectedPrivateKey),
    }
  }

  pub fn as_secret_key(&self) -> Result<&[u8], SharedError> {
    match self {
      V8RawKeyData::Secret(data) => Ok(data),
      _ => Err(SharedError::ExpectedSecretKey),
    }
  }

  pub fn as_ec_public_key_p256(
    &self,
  ) -> Result<p256::EncodedPoint, SharedError> {
    match self {
      V8RawKeyData::Public(data) => p256::PublicKey::from_sec1_bytes(data)
        .map(|p| p.to_encoded_point(false))
        .map_err(|_| SharedError::ExpectedValidPublicECKey),
      V8RawKeyData::Private(data) => {
        let signing_key = p256::SecretKey::from_pkcs8_der(data)
          .map_err(|_| SharedError::ExpectedValidPrivateECKey)?;
        Ok(signing_key.public_key().to_encoded_point(false))
      }
      // Should never reach here.
      V8RawKeyData::Secret(_) => unreachable!(),
    }
  }

  pub fn as_ec_public_key_p384(
    &self,
  ) -> Result<p384::EncodedPoint, SharedError> {
    match self {
      V8RawKeyData::Public(data) => p384::PublicKey::from_sec1_bytes(data)
        .map(|p| p.to_encoded_point(false))
        .map_err(|_| SharedError::ExpectedValidPublicECKey),
      V8RawKeyData::Private(data) => {
        let signing_key = p384::SecretKey::from_pkcs8_der(data)
          .map_err(|_| SharedError::ExpectedValidPrivateECKey)?;
        Ok(signing_key.public_key().to_encoded_point(false))
      }
      // Should never reach here.
      V8RawKeyData::Secret(_) => unreachable!(),
    }
  }

  pub fn as_ec_public_key_p521(
    &self,
  ) -> Result<p521::EncodedPoint, SharedError> {
    match self {
      V8RawKeyData::Public(data) => {
        // public_key is a serialized EncodedPoint
        p521::EncodedPoint::from_bytes(data)
          .map_err(|_| SharedError::ExpectedValidPublicECKey)
      }
      V8RawKeyData::Private(data) => {
        let signing_key = p521::SecretKey::from_pkcs8_der(data)
          .map_err(|_| SharedError::ExpectedValidPrivateECKey)?;
        Ok(signing_key.public_key().to_encoded_point(false))
      }
      // Should never reach here.
      V8RawKeyData::Secret(_) => unreachable!(),
    }
  }

  pub fn as_ec_private_key(&self) -> Result<&[u8], SharedError> {
    match self {
      V8RawKeyData::Private(data) => Ok(data),
      _ => Err(SharedError::ExpectedPrivateKey),
    }
  }
}
