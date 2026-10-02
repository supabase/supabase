// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use std::borrow::Cow;
use std::cell::RefCell;

use base64::Engine;
use deno_core::error::type_error;
use deno_core::op2;
use deno_core::serde_v8::BigInt as V8BigInt;
use deno_core::unsync::spawn_blocking;
use deno_core::GarbageCollected;
use deno_core::ToJsBuffer;
use ed25519_dalek::pkcs8::BitStringRef;
use elliptic_curve::JwkEcKey;
use num_bigint::BigInt;
use num_traits::FromPrimitive as _;
use pkcs8::DecodePrivateKey as _;
use pkcs8::Document;
use pkcs8::EncodePrivateKey as _;
use pkcs8::EncryptedPrivateKeyInfo;
use pkcs8::PrivateKeyInfo;
use pkcs8::SecretDocument;
use rand::thread_rng;
use rand::RngCore as _;
use rsa::pkcs1::DecodeRsaPrivateKey as _;
use rsa::pkcs1::DecodeRsaPublicKey;
use rsa::pkcs1::EncodeRsaPrivateKey as _;
use rsa::pkcs1::EncodeRsaPublicKey;
use rsa::traits::PublicKeyParts;
use rsa::RsaPrivateKey;
use rsa::RsaPublicKey;
use sec1::der::Tag;
use sec1::der::Writer as _;
use sec1::pem::PemLabel as _;
use sec1::DecodeEcPrivateKey as _;
use sec1::LineEnding;
use spki::der::asn1;
use spki::der::asn1::OctetStringRef;
use spki::der::AnyRef;
use spki::der::Decode as _;
use spki::der::Encode as _;
use spki::der::PemWriter;
use spki::der::Reader as _;
use spki::DecodePublicKey as _;
use spki::EncodePublicKey as _;
use spki::SubjectPublicKeyInfoRef;
use x509_parser::error::X509Error;
use x509_parser::x509;

use super::dh;
use super::dh::DiffieHellmanGroup;
use super::digest::match_fixed_digest_with_oid;
use super::pkcs3;
use super::pkcs3::DhParameter;
use super::primes::Prime;

#[derive(Clone)]
pub enum KeyObjectHandle {
  AsymmetricPrivate(AsymmetricPrivateKey),
  AsymmetricPublic(AsymmetricPublicKey),
  Secret(Box<[u8]>),
}

impl GarbageCollected for KeyObjectHandle {}

#[derive(Clone)]
pub enum AsymmetricPrivateKey {
  Rsa(RsaPrivateKey),
  RsaPss(RsaPssPrivateKey),
  Dsa(dsa::SigningKey),
  Ec(EcPrivateKey),
  X25519(x25519_dalek::StaticSecret),
  Ed25519(ed25519_dalek::SigningKey),
  Dh(DhPrivateKey),
}

#[derive(Clone)]
pub struct RsaPssPrivateKey {
  pub key: RsaPrivateKey,
  pub details: Option<RsaPssDetails>,
}

#[derive(Clone, Copy)]
pub struct RsaPssDetails {
  pub hash_algorithm: RsaPssHashAlgorithm,
  pub mf1_hash_algorithm: RsaPssHashAlgorithm,
  pub salt_length: u32,
}

#[derive(Clone, Copy, PartialEq, Eq)]
pub enum RsaPssHashAlgorithm {
  Sha1,
  Sha224,
  Sha256,
  Sha384,
  Sha512,
  Sha512_224,
  Sha512_256,
}

impl RsaPssHashAlgorithm {
  pub fn as_str(&self) -> &'static str {
    match self {
      RsaPssHashAlgorithm::Sha1 => "sha1",
      RsaPssHashAlgorithm::Sha224 => "sha224",
      RsaPssHashAlgorithm::Sha256 => "sha256",
      RsaPssHashAlgorithm::Sha384 => "sha384",
      RsaPssHashAlgorithm::Sha512 => "sha512",
      RsaPssHashAlgorithm::Sha512_224 => "sha512-224",
      RsaPssHashAlgorithm::Sha512_256 => "sha512-256",
    }
  }

  pub fn salt_length(&self) -> u32 {
    match self {
      RsaPssHashAlgorithm::Sha1 => 20,
      RsaPssHashAlgorithm::Sha224 | RsaPssHashAlgorithm::Sha512_224 => 28,
      RsaPssHashAlgorithm::Sha256 | RsaPssHashAlgorithm::Sha512_256 => 32,
      RsaPssHashAlgorithm::Sha384 => 48,
      RsaPssHashAlgorithm::Sha512 => 64,
    }
  }
}

#[derive(Clone)]
pub enum EcPrivateKey {
  P224(p224::SecretKey),
  P256(p256::SecretKey),
  P384(p384::SecretKey),
}

#[derive(Clone)]
pub struct DhPrivateKey {
  pub key: dh::PrivateKey,
  pub params: DhParameter,
}

#[derive(Clone)]
pub enum AsymmetricPublicKey {
  Rsa(rsa::RsaPublicKey),
  RsaPss(RsaPssPublicKey),
  Dsa(dsa::VerifyingKey),
  Ec(EcPublicKey),
  X25519(x25519_dalek::PublicKey),
  Ed25519(ed25519_dalek::VerifyingKey),
  Dh(DhPublicKey),
}

#[derive(Clone)]
pub struct RsaPssPublicKey {
  pub key: rsa::RsaPublicKey,
  pub details: Option<RsaPssDetails>,
}

#[derive(Clone)]
pub enum EcPublicKey {
  P224(p224::PublicKey),
  P256(p256::PublicKey),
  P384(p384::PublicKey),
}

#[derive(Clone)]
pub struct DhPublicKey {
  pub key: dh::PublicKey,
  pub params: DhParameter,
}

impl KeyObjectHandle {
  /// Returns the private key if the handle is an asymmetric private key.
  pub fn as_private_key(&self) -> Option<&AsymmetricPrivateKey> {
    match self {
      KeyObjectHandle::AsymmetricPrivate(key) => Some(key),
      _ => None,
    }
  }

  /// Returns the public key if the handle is an asymmetric public key. If it is
  /// a private key, it derives the public key from it and returns that.
  pub fn as_public_key(&self) -> Option<Cow<'_, AsymmetricPublicKey>> {
    match self {
      KeyObjectHandle::AsymmetricPrivate(key) => {
        Some(Cow::Owned(key.to_public_key()))
      }
      KeyObjectHandle::AsymmetricPublic(key) => Some(Cow::Borrowed(key)),
      _ => None,
    }
  }

  /// Returns the secret key if the handle is a secret key.
  pub fn as_secret_key(&self) -> Option<&[u8]> {
    match self {
      KeyObjectHandle::Secret(key) => Some(key),
      _ => None,
    }
  }
}

impl AsymmetricPrivateKey {
  /// Derives the public key from the private key.
  pub fn to_public_key(&self) -> AsymmetricPublicKey {
    match self {
      AsymmetricPrivateKey::Rsa(key) => {
        AsymmetricPublicKey::Rsa(key.to_public_key())
      }
      AsymmetricPrivateKey::RsaPss(key) => {
        AsymmetricPublicKey::RsaPss(key.to_public_key())
      }
      AsymmetricPrivateKey::Dsa(key) => {
        AsymmetricPublicKey::Dsa(key.verifying_key().clone())
      }
      AsymmetricPrivateKey::Ec(key) => {
        AsymmetricPublicKey::Ec(key.to_public_key())
      }
      AsymmetricPrivateKey::X25519(key) => {
        AsymmetricPublicKey::X25519(x25519_dalek::PublicKey::from(key))
      }
      AsymmetricPrivateKey::Ed25519(key) => {
        AsymmetricPublicKey::Ed25519(key.verifying_key())
      }
      AsymmetricPrivateKey::Dh(_) => {
        panic!("cannot derive public key from DH private key")
      }
    }
  }
}

impl RsaPssPrivateKey {
  /// Derives the public key from the private key.
  pub fn to_public_key(&self) -> RsaPssPublicKey {
    RsaPssPublicKey {
      key: self.key.to_public_key(),
      details: self.details,
    }
  }
}

impl EcPublicKey {
  pub fn to_jwk(&self) -> Result<JwkEcKey, AsymmetricPublicKeyJwkError> {
    match self {
      EcPublicKey::P224(_) => {
        Err(AsymmetricPublicKeyJwkError::UnsupportedJwkEcCurveP224)
      }
      EcPublicKey::P256(key) => Ok(key.to_jwk()),
      EcPublicKey::P384(key) => Ok(key.to_jwk()),
    }
  }
}

impl EcPrivateKey {
  /// Derives the public key from the private key.
  pub fn to_public_key(&self) -> EcPublicKey {
    match self {
      EcPrivateKey::P224(key) => EcPublicKey::P224(key.public_key()),
      EcPrivateKey::P256(key) => EcPublicKey::P256(key.public_key()),
      EcPrivateKey::P384(key) => EcPublicKey::P384(key.public_key()),
    }
  }
}

// https://oidref.com/
const ID_SHA1_OID: rsa::pkcs8::ObjectIdentifier =
  rsa::pkcs8::ObjectIdentifier::new_unwrap("1.3.14.3.2.26");
const ID_SHA224_OID: rsa::pkcs8::ObjectIdentifier =
  rsa::pkcs8::ObjectIdentifier::new_unwrap("2.16.840.1.101.3.4.2.4");
const ID_SHA256_OID: rsa::pkcs8::ObjectIdentifier =
  rsa::pkcs8::ObjectIdentifier::new_unwrap("2.16.840.1.101.3.4.2.1");
const ID_SHA384_OID: rsa::pkcs8::ObjectIdentifier =
  rsa::pkcs8::ObjectIdentifier::new_unwrap("2.16.840.1.101.3.4.2.2");
const ID_SHA512_OID: rsa::pkcs8::ObjectIdentifier =
  rsa::pkcs8::ObjectIdentifier::new_unwrap("2.16.840.1.101.3.4.2.3");
const ID_SHA512_224_OID: rsa::pkcs8::ObjectIdentifier =
  rsa::pkcs8::ObjectIdentifier::new_unwrap("2.16.840.1.101.3.4.2.5");
const ID_SHA512_256_OID: rsa::pkcs8::ObjectIdentifier =
  rsa::pkcs8::ObjectIdentifier::new_unwrap("2.16.840.1.101.3.4.2.6");

const ID_MFG1: rsa::pkcs8::ObjectIdentifier =
  rsa::pkcs8::ObjectIdentifier::new_unwrap("1.2.840.113549.1.1.8");
pub const ID_SECP224R1_OID: const_oid::ObjectIdentifier =
  const_oid::ObjectIdentifier::new_unwrap("1.3.132.0.33");
pub const ID_SECP256R1_OID: const_oid::ObjectIdentifier =
  const_oid::ObjectIdentifier::new_unwrap("1.2.840.10045.3.1.7");
pub const ID_SECP384R1_OID: const_oid::ObjectIdentifier =
  const_oid::ObjectIdentifier::new_unwrap("1.3.132.0.34");

pub const RSA_ENCRYPTION_OID: const_oid::ObjectIdentifier =
  const_oid::ObjectIdentifier::new_unwrap("1.2.840.113549.1.1.1");
pub const RSASSA_PSS_OID: const_oid::ObjectIdentifier =
  const_oid::ObjectIdentifier::new_unwrap("1.2.840.113549.1.1.10");
pub const DSA_OID: const_oid::ObjectIdentifier =
  const_oid::ObjectIdentifier::new_unwrap("1.2.840.10040.4.1");
pub const EC_OID: const_oid::ObjectIdentifier =
  const_oid::ObjectIdentifier::new_unwrap("1.2.840.10045.2.1");
pub const X25519_OID: const_oid::ObjectIdentifier =
  const_oid::ObjectIdentifier::new_unwrap("1.3.101.110");
pub const ED25519_OID: const_oid::ObjectIdentifier =
  const_oid::ObjectIdentifier::new_unwrap("1.3.101.112");
pub const DH_KEY_AGREEMENT_OID: const_oid::ObjectIdentifier =
  const_oid::ObjectIdentifier::new_unwrap("1.2.840.113549.1.3.1");

// The parameters field associated with OID id-RSASSA-PSS
// Defined in RFC 3447, section A.2.3
//
// RSASSA-PSS-params ::= SEQUENCE {
//   hashAlgorithm      [0] HashAlgorithm    DEFAULT sha1,
//   maskGenAlgorithm   [1] MaskGenAlgorithm DEFAULT mgf1SHA1,
//   saltLength         [2] INTEGER          DEFAULT 20,
//   trailerField       [3] TrailerField     DEFAULT trailerFieldBC
// }
pub struct RsaPssParameters<'a> {
  pub hash_algorithm: Option<rsa::pkcs8::AlgorithmIdentifierRef<'a>>,
  pub mask_gen_algorithm: Option<rsa::pkcs8::AlgorithmIdentifierRef<'a>>,
  pub salt_length: Option<u32>,
}

// Context-specific tag number for hashAlgorithm.
const HASH_ALGORITHM_TAG: rsa::pkcs8::der::TagNumber =
  rsa::pkcs8::der::TagNumber::new(0);

// Context-specific tag number for maskGenAlgorithm.
const MASK_GEN_ALGORITHM_TAG: rsa::pkcs8::der::TagNumber =
  rsa::pkcs8::der::TagNumber::new(1);

// Context-specific tag number for saltLength.
const SALT_LENGTH_TAG: rsa::pkcs8::der::TagNumber =
  rsa::pkcs8::der::TagNumber::new(2);

impl<'a> TryFrom<rsa::pkcs8::der::asn1::AnyRef<'a>> for RsaPssParameters<'a> {
  type Error = rsa::pkcs8::der::Error;

  fn try_from(
    any: rsa::pkcs8::der::asn1::AnyRef<'a>,
  ) -> rsa::pkcs8::der::Result<RsaPssParameters<'a>> {
    any.sequence(|decoder| {
      let hash_algorithm = decoder
        .context_specific::<rsa::pkcs8::AlgorithmIdentifierRef>(
          HASH_ALGORITHM_TAG,
          pkcs8::der::TagMode::Explicit,
        )?
        .map(TryInto::try_into)
        .transpose()?;

      let mask_gen_algorithm = decoder
        .context_specific::<rsa::pkcs8::AlgorithmIdentifierRef>(
          MASK_GEN_ALGORITHM_TAG,
          pkcs8::der::TagMode::Explicit,
        )?
        .map(TryInto::try_into)
        .transpose()?;

      let salt_length = decoder
        .context_specific::<u32>(
          SALT_LENGTH_TAG,
          pkcs8::der::TagMode::Explicit,
        )?
        .map(TryInto::try_into)
        .transpose()?;

      Ok(Self {
        hash_algorithm,
        mask_gen_algorithm,
        salt_length,
      })
    })
  }
}

#[derive(Debug, thiserror::Error)]
pub enum X509PublicKeyError {
  #[error(transparent)]
  X509(#[from] x509_parser::error::X509Error),
  #[error(transparent)]
  Rsa(#[from] rsa::Error),
  #[error(transparent)]
  Asn1(#[from] x509_parser::der_parser::asn1_rs::Error),
  #[error(transparent)]
  Ec(#[from] elliptic_curve::Error),
  #[error("unsupported ec named curve")]
  UnsupportedEcNamedCurve,
  #[error("missing ec parameters")]
  MissingEcParameters,
  #[error("malformed DSS public key")]
  MalformedDssPublicKey,
  #[error("unsupported x509 public key type")]
  UnsupportedX509KeyType,
}

#[derive(Debug, thiserror::Error)]
pub enum RsaJwkError {
  #[error(transparent)]
  Base64(#[from] base64::DecodeError),
  #[error(transparent)]
  Rsa(#[from] rsa::Error),
  #[error("missing RSA private component")]
  MissingRsaPrivateComponent,
}

#[derive(Debug, thiserror::Error)]
pub enum EcJwkError {
  #[error(transparent)]
  Ec(#[from] elliptic_curve::Error),
  #[error("unsupported curve: {0}")]
  UnsupportedCurve(String),
}

#[derive(Debug, thiserror::Error)]
pub enum EdRawError {
  #[error(transparent)]
  Ed25519Signature(#[from] ed25519_dalek::SignatureError),
  #[error("invalid Ed25519 key")]
  InvalidEd25519Key,
  #[error("unsupported curve")]
  UnsupportedCurve,
}

#[derive(Debug, thiserror::Error)]
pub enum AsymmetricPrivateKeyError {
  #[error("invalid PEM private key: not valid utf8 starting at byte {0}")]
  InvalidPemPrivateKeyInvalidUtf8(usize),
  #[error("invalid encrypted PEM private key")]
  InvalidEncryptedPemPrivateKey,
  #[error("invalid PEM private key")]
  InvalidPemPrivateKey,
  #[error("encrypted private key requires a passphrase to decrypt")]
  EncryptedPrivateKeyRequiresPassphraseToDecrypt,
  #[error("invalid PKCS#1 private key")]
  InvalidPkcs1PrivateKey,
  #[error("invalid SEC1 private key")]
  InvalidSec1PrivateKey,
  #[error("unsupported PEM label: {0}")]
  UnsupportedPemLabel(String),
  #[error(transparent)]
  RsaPssParamsParse(#[from] RsaPssParamsParseError),
  #[error("invalid encrypted PKCS#8 private key")]
  InvalidEncryptedPkcs8PrivateKey,
  #[error("invalid PKCS#8 private key")]
  InvalidPkcs8PrivateKey,
  #[error("PKCS#1 private key does not support encryption with passphrase")]
  Pkcs1PrivateKeyDoesNotSupportEncryptionWithPassphrase,
  #[error("SEC1 private key does not support encryption with passphrase")]
  Sec1PrivateKeyDoesNotSupportEncryptionWithPassphrase,
  #[error("unsupported ec named curve")]
  UnsupportedEcNamedCurve,
  #[error("invalid private key")]
  InvalidPrivateKey,
  #[error("invalid DSA private key")]
  InvalidDsaPrivateKey,
  #[error("malformed or missing named curve in ec parameters")]
  MalformedOrMissingNamedCurveInEcParameters,
  #[error("unsupported key type: {0}")]
  UnsupportedKeyType(String),
  #[error("unsupported key format: {0}")]
  UnsupportedKeyFormat(String),
  #[error("invalid x25519 private key")]
  InvalidX25519PrivateKey,
  #[error("x25519 private key is the wrong length")]
  X25519PrivateKeyIsWrongLength,
  #[error("invalid Ed25519 private key")]
  InvalidEd25519PrivateKey,
  #[error("missing dh parameters")]
  MissingDhParameters,
  #[error("unsupported private key oid")]
  UnsupportedPrivateKeyOid,
}

#[derive(Debug, thiserror::Error)]
pub enum AsymmetricPublicKeyError {
  #[error("invalid PEM private key: not valid utf8 starting at byte {0}")]
  InvalidPemPrivateKeyInvalidUtf8(usize),
  #[error("invalid PEM public key")]
  InvalidPemPublicKey,
  #[error("invalid PKCS#1 public key")]
  InvalidPkcs1PublicKey,
  #[error(transparent)]
  AsymmetricPrivateKey(#[from] AsymmetricPrivateKeyError),
  #[error("invalid x509 certificate")]
  InvalidX509Certificate,
  #[error(transparent)]
  X509(#[from] x509_parser::nom::Err<X509Error>),
  #[error(transparent)]
  X509PublicKey(#[from] X509PublicKeyError),
  #[error("unsupported PEM label: {0}")]
  UnsupportedPemLabel(String),
  #[error("invalid SPKI public key")]
  InvalidSpkiPublicKey,
  #[error("unsupported key type: {0}")]
  UnsupportedKeyType(String),
  #[error("unsupported key format: {0}")]
  UnsupportedKeyFormat(String),
  #[error(transparent)]
  Spki(#[from] spki::Error),
  #[error(transparent)]
  Pkcs1(#[from] rsa::pkcs1::Error),
  #[error(transparent)]
  RsaPssParamsParse(#[from] RsaPssParamsParseError),
  #[error("malformed DSS public key")]
  MalformedDssPublicKey,
  #[error("malformed or missing named curve in ec parameters")]
  MalformedOrMissingNamedCurveInEcParameters,
  #[error("malformed or missing public key in ec spki")]
  MalformedOrMissingPublicKeyInEcSpki,
  #[error(transparent)]
  Ec(#[from] elliptic_curve::Error),
  #[error("unsupported ec named curve")]
  UnsupportedEcNamedCurve,
  #[error("malformed or missing public key in x25519 spki")]
  MalformedOrMissingPublicKeyInX25519Spki,
  #[error("x25519 public key is too short")]
  X25519PublicKeyIsTooShort,
  #[error("invalid Ed25519 public key")]
  InvalidEd25519PublicKey,
  #[error("missing dh parameters")]
  MissingDhParameters,
  #[error("malformed dh parameters")]
  MalformedDhParameters,
  #[error("malformed or missing public key in dh spki")]
  MalformedOrMissingPublicKeyInDhSpki,
  #[error("unsupported private key oid")]
  UnsupportedPrivateKeyOid,
}

impl KeyObjectHandle {
  pub fn new_asymmetric_private_key_from_js(
    key: &[u8],
    format: &str,
    typ: &str,
    passphrase: Option<&[u8]>,
  ) -> Result<KeyObjectHandle, AsymmetricPrivateKeyError> {
    let document = match format {
      "pem" => {
        let pem = std::str::from_utf8(key).map_err(|err| {
          AsymmetricPrivateKeyError::InvalidPemPrivateKeyInvalidUtf8(
            err.valid_up_to(),
          )
        })?;

        if let Some(passphrase) = passphrase {
          SecretDocument::from_pkcs8_encrypted_pem(pem, passphrase).map_err(
            |_| AsymmetricPrivateKeyError::InvalidEncryptedPemPrivateKey,
          )?
        } else {
          let (label, doc) = SecretDocument::from_pem(pem)
            .map_err(|_| AsymmetricPrivateKeyError::InvalidPemPrivateKey)?;

          match label {
            EncryptedPrivateKeyInfo::PEM_LABEL => {
              return Err(AsymmetricPrivateKeyError::EncryptedPrivateKeyRequiresPassphraseToDecrypt);
            }
            PrivateKeyInfo::PEM_LABEL => doc,
            rsa::pkcs1::RsaPrivateKey::PEM_LABEL => {
              SecretDocument::from_pkcs1_der(doc.as_bytes()).map_err(|_| {
                AsymmetricPrivateKeyError::InvalidPkcs1PrivateKey
              })?
            }
            sec1::EcPrivateKey::PEM_LABEL => {
              SecretDocument::from_sec1_der(doc.as_bytes())
                .map_err(|_| AsymmetricPrivateKeyError::InvalidSec1PrivateKey)?
            }
            _ => {
              return Err(AsymmetricPrivateKeyError::UnsupportedPemLabel(
                label.to_string(),
              ))
            }
          }
        }
      }
      "der" => match typ {
        "pkcs8" => {
          if let Some(passphrase) = passphrase {
            SecretDocument::from_pkcs8_encrypted_der(key, passphrase).map_err(
              |_| AsymmetricPrivateKeyError::InvalidEncryptedPkcs8PrivateKey,
            )?
          } else {
            SecretDocument::from_pkcs8_der(key)
              .map_err(|_| AsymmetricPrivateKeyError::InvalidPkcs8PrivateKey)?
          }
        }
        "pkcs1" => {
          if passphrase.is_some() {
            return Err(AsymmetricPrivateKeyError::Pkcs1PrivateKeyDoesNotSupportEncryptionWithPassphrase);
          }
          SecretDocument::from_pkcs1_der(key)
            .map_err(|_| AsymmetricPrivateKeyError::InvalidPkcs1PrivateKey)?
        }
        "sec1" => {
          if passphrase.is_some() {
            return Err(AsymmetricPrivateKeyError::Sec1PrivateKeyDoesNotSupportEncryptionWithPassphrase);
          }
          SecretDocument::from_sec1_der(key)
            .map_err(|_| AsymmetricPrivateKeyError::InvalidSec1PrivateKey)?
        }
        _ => {
          return Err(AsymmetricPrivateKeyError::UnsupportedKeyType(
            typ.to_string(),
          ))
        }
      },
      _ => {
        return Err(AsymmetricPrivateKeyError::UnsupportedKeyFormat(
          format.to_string(),
        ))
      }
    };

    let pk_info = PrivateKeyInfo::try_from(document.as_bytes())
      .map_err(|_| AsymmetricPrivateKeyError::InvalidPrivateKey)?;

    let alg = pk_info.algorithm.oid;
    let private_key = match alg {
      RSA_ENCRYPTION_OID => {
        let private_key =
          rsa::RsaPrivateKey::from_pkcs1_der(pk_info.private_key)
            .map_err(|_| AsymmetricPrivateKeyError::InvalidPkcs1PrivateKey)?;
        AsymmetricPrivateKey::Rsa(private_key)
      }
      RSASSA_PSS_OID => {
        let details = parse_rsa_pss_params(pk_info.algorithm.parameters)?;
        let private_key =
          rsa::RsaPrivateKey::from_pkcs1_der(pk_info.private_key)
            .map_err(|_| AsymmetricPrivateKeyError::InvalidPkcs1PrivateKey)?;
        AsymmetricPrivateKey::RsaPss(RsaPssPrivateKey {
          key: private_key,
          details,
        })
      }
      DSA_OID => {
        let private_key = dsa::SigningKey::try_from(pk_info)
          .map_err(|_| AsymmetricPrivateKeyError::InvalidDsaPrivateKey)?;
        AsymmetricPrivateKey::Dsa(private_key)
      }
      EC_OID => {
        let named_curve = pk_info.algorithm.parameters_oid().map_err(|_| {
          AsymmetricPrivateKeyError::MalformedOrMissingNamedCurveInEcParameters
        })?;
        match named_curve {
          ID_SECP224R1_OID => {
            let secret_key = p224::SecretKey::from_sec1_der(
              pk_info.private_key,
            )
            .map_err(|_| AsymmetricPrivateKeyError::InvalidSec1PrivateKey)?;
            AsymmetricPrivateKey::Ec(EcPrivateKey::P224(secret_key))
          }
          ID_SECP256R1_OID => {
            let secret_key = p256::SecretKey::from_sec1_der(
              pk_info.private_key,
            )
            .map_err(|_| AsymmetricPrivateKeyError::InvalidSec1PrivateKey)?;
            AsymmetricPrivateKey::Ec(EcPrivateKey::P256(secret_key))
          }
          ID_SECP384R1_OID => {
            let secret_key = p384::SecretKey::from_sec1_der(
              pk_info.private_key,
            )
            .map_err(|_| AsymmetricPrivateKeyError::InvalidSec1PrivateKey)?;
            AsymmetricPrivateKey::Ec(EcPrivateKey::P384(secret_key))
          }
          _ => return Err(AsymmetricPrivateKeyError::UnsupportedEcNamedCurve),
        }
      }
      X25519_OID => {
        let string_ref = OctetStringRef::from_der(pk_info.private_key)
          .map_err(|_| AsymmetricPrivateKeyError::InvalidX25519PrivateKey)?;
        if string_ref.as_bytes().len() != 32 {
          return Err(AsymmetricPrivateKeyError::X25519PrivateKeyIsWrongLength);
        }
        let mut bytes = [0; 32];
        bytes.copy_from_slice(string_ref.as_bytes());
        AsymmetricPrivateKey::X25519(x25519_dalek::StaticSecret::from(bytes))
      }
      ED25519_OID => {
        let signing_key = ed25519_dalek::SigningKey::try_from(pk_info)
          .map_err(|_| AsymmetricPrivateKeyError::InvalidEd25519PrivateKey)?;
        AsymmetricPrivateKey::Ed25519(signing_key)
      }
      DH_KEY_AGREEMENT_OID => {
        let params = pk_info
          .algorithm
          .parameters
          .ok_or(AsymmetricPrivateKeyError::MissingDhParameters)?;
        let params = pkcs3::DhParameter::from_der(&params.to_der().unwrap())
          .map_err(|_| AsymmetricPrivateKeyError::MissingDhParameters)?;
        AsymmetricPrivateKey::Dh(DhPrivateKey {
          key: dh::PrivateKey::from_bytes(pk_info.private_key),
          params,
        })
      }
      _ => return Err(AsymmetricPrivateKeyError::UnsupportedPrivateKeyOid),
    };

    Ok(KeyObjectHandle::AsymmetricPrivate(private_key))
  }

  pub fn new_x509_public_key(
    spki: &x509::SubjectPublicKeyInfo,
  ) -> Result<KeyObjectHandle, X509PublicKeyError> {
    use x509_parser::der_parser::asn1_rs::oid;
    use x509_parser::public_key::PublicKey;

    let key = match spki.parsed()? {
      PublicKey::RSA(key) => {
        let public_key = RsaPublicKey::new(
          rsa::BigUint::from_bytes_be(key.modulus),
          rsa::BigUint::from_bytes_be(key.exponent),
        )?;
        AsymmetricPublicKey::Rsa(public_key)
      }
      PublicKey::EC(point) => {
        let data = point.data();
        if let Some(params) = &spki.algorithm.parameters {
          let curve_oid = params.as_oid()?;
          const ID_SECP224R1: &[u8] = &oid!(raw 1.3.132.0.33);
          const ID_SECP256R1: &[u8] = &oid!(raw 1.2.840.10045.3.1.7);
          const ID_SECP384R1: &[u8] = &oid!(raw 1.3.132.0.34);

          match curve_oid.as_bytes() {
            ID_SECP224R1 => {
              let public_key = p224::PublicKey::from_sec1_bytes(data)?;
              AsymmetricPublicKey::Ec(EcPublicKey::P224(public_key))
            }
            ID_SECP256R1 => {
              let public_key = p256::PublicKey::from_sec1_bytes(data)?;
              AsymmetricPublicKey::Ec(EcPublicKey::P256(public_key))
            }
            ID_SECP384R1 => {
              let public_key = p384::PublicKey::from_sec1_bytes(data)?;
              AsymmetricPublicKey::Ec(EcPublicKey::P384(public_key))
            }
            _ => return Err(X509PublicKeyError::UnsupportedEcNamedCurve),
          }
        } else {
          return Err(X509PublicKeyError::MissingEcParameters);
        }
      }
      PublicKey::DSA(_) => {
        let verifying_key = dsa::VerifyingKey::from_public_key_der(spki.raw)
          .map_err(|_| X509PublicKeyError::MalformedDssPublicKey)?;
        AsymmetricPublicKey::Dsa(verifying_key)
      }
      _ => return Err(X509PublicKeyError::UnsupportedX509KeyType),
    };

    Ok(KeyObjectHandle::AsymmetricPublic(key))
  }

  pub fn new_rsa_jwk(
    jwk: RsaJwkKey,
    is_public: bool,
  ) -> Result<KeyObjectHandle, RsaJwkError> {
    use base64::prelude::BASE64_URL_SAFE_NO_PAD;

    let n = BASE64_URL_SAFE_NO_PAD.decode(jwk.n.as_bytes())?;
    let e = BASE64_URL_SAFE_NO_PAD.decode(jwk.e.as_bytes())?;

    if is_public {
      let public_key = RsaPublicKey::new(
        rsa::BigUint::from_bytes_be(&n),
        rsa::BigUint::from_bytes_be(&e),
      )?;

      Ok(KeyObjectHandle::AsymmetricPublic(AsymmetricPublicKey::Rsa(
        public_key,
      )))
    } else {
      let d = BASE64_URL_SAFE_NO_PAD.decode(
        jwk
          .d
          .ok_or(RsaJwkError::MissingRsaPrivateComponent)?
          .as_bytes(),
      )?;
      let p = BASE64_URL_SAFE_NO_PAD.decode(
        jwk
          .p
          .ok_or(RsaJwkError::MissingRsaPrivateComponent)?
          .as_bytes(),
      )?;
      let q = BASE64_URL_SAFE_NO_PAD.decode(
        jwk
          .q
          .ok_or(RsaJwkError::MissingRsaPrivateComponent)?
          .as_bytes(),
      )?;

      let mut private_key = RsaPrivateKey::from_components(
        rsa::BigUint::from_bytes_be(&n),
        rsa::BigUint::from_bytes_be(&e),
        rsa::BigUint::from_bytes_be(&d),
        vec![
          rsa::BigUint::from_bytes_be(&p),
          rsa::BigUint::from_bytes_be(&q),
        ],
      )?;
      private_key.precompute()?; // precompute CRT params

      Ok(KeyObjectHandle::AsymmetricPrivate(
        AsymmetricPrivateKey::Rsa(private_key),
      ))
    }
  }

  pub fn new_ec_jwk(
    jwk: &JwkEcKey,
    is_public: bool,
  ) -> Result<KeyObjectHandle, EcJwkError> {
    //  https://datatracker.ietf.org/doc/html/rfc7518#section-6.2.1.1
    let handle = match jwk.crv() {
      "P-256" if is_public => {
        KeyObjectHandle::AsymmetricPublic(AsymmetricPublicKey::Ec(
          EcPublicKey::P256(p256::PublicKey::from_jwk(jwk)?),
        ))
      }
      "P-256" => KeyObjectHandle::AsymmetricPrivate(AsymmetricPrivateKey::Ec(
        EcPrivateKey::P256(p256::SecretKey::from_jwk(jwk)?),
      )),
      "P-384" if is_public => {
        KeyObjectHandle::AsymmetricPublic(AsymmetricPublicKey::Ec(
          EcPublicKey::P384(p384::PublicKey::from_jwk(jwk)?),
        ))
      }
      "P-384" => KeyObjectHandle::AsymmetricPrivate(AsymmetricPrivateKey::Ec(
        EcPrivateKey::P384(p384::SecretKey::from_jwk(jwk)?),
      )),
      _ => {
        return Err(EcJwkError::UnsupportedCurve(jwk.crv().to_string()));
      }
    };

    Ok(handle)
  }

  pub fn new_ed_raw(
    curve: &str,
    data: &[u8],
    is_public: bool,
  ) -> Result<KeyObjectHandle, EdRawError> {
    match curve {
      "Ed25519" => {
        let data =
          data.try_into().map_err(|_| EdRawError::InvalidEd25519Key)?;
        if !is_public {
          Ok(KeyObjectHandle::AsymmetricPrivate(
            AsymmetricPrivateKey::Ed25519(
              ed25519_dalek::SigningKey::from_bytes(data),
            ),
          ))
        } else {
          Ok(KeyObjectHandle::AsymmetricPublic(
            AsymmetricPublicKey::Ed25519(
              ed25519_dalek::VerifyingKey::from_bytes(data)?,
            ),
          ))
        }
      }
      "X25519" => {
        let data: [u8; 32] =
          data.try_into().map_err(|_| EdRawError::InvalidEd25519Key)?;
        if !is_public {
          Ok(KeyObjectHandle::AsymmetricPrivate(
            AsymmetricPrivateKey::X25519(x25519_dalek::StaticSecret::from(
              data,
            )),
          ))
        } else {
          Ok(KeyObjectHandle::AsymmetricPublic(
            AsymmetricPublicKey::X25519(x25519_dalek::PublicKey::from(data)),
          ))
        }
      }
      _ => Err(EdRawError::UnsupportedCurve),
    }
  }

  pub fn new_asymmetric_public_key_from_js(
    key: &[u8],
    format: &str,
    typ: &str,
    passphrase: Option<&[u8]>,
  ) -> Result<KeyObjectHandle, AsymmetricPublicKeyError> {
    let document = match format {
      "pem" => {
        let pem = std::str::from_utf8(key).map_err(|err| {
          AsymmetricPublicKeyError::InvalidPemPrivateKeyInvalidUtf8(
            err.valid_up_to(),
          )
        })?;

        let (label, document) = Document::from_pem(pem)
          .map_err(|_| AsymmetricPublicKeyError::InvalidPemPublicKey)?;

        match label {
          SubjectPublicKeyInfoRef::PEM_LABEL => document,
          rsa::pkcs1::RsaPublicKey::PEM_LABEL => {
            Document::from_pkcs1_der(document.as_bytes())
              .map_err(|_| AsymmetricPublicKeyError::InvalidPkcs1PublicKey)?
          }
          EncryptedPrivateKeyInfo::PEM_LABEL
          | PrivateKeyInfo::PEM_LABEL
          | sec1::EcPrivateKey::PEM_LABEL
          | rsa::pkcs1::RsaPrivateKey::PEM_LABEL => {
            let handle = KeyObjectHandle::new_asymmetric_private_key_from_js(
              key, format, typ, passphrase,
            )?;
            match handle {
              KeyObjectHandle::AsymmetricPrivate(private) => {
                return Ok(KeyObjectHandle::AsymmetricPublic(
                  private.to_public_key(),
                ))
              }
              KeyObjectHandle::AsymmetricPublic(_)
              | KeyObjectHandle::Secret(_) => unreachable!(),
            }
          }
          "CERTIFICATE" => {
            let (_, pem) = x509_parser::pem::parse_x509_pem(pem.as_bytes())
              .map_err(|_| AsymmetricPublicKeyError::InvalidX509Certificate)?;

            let cert = pem.parse_x509()?;
            let public_key = cert.tbs_certificate.subject_pki;

            return KeyObjectHandle::new_x509_public_key(&public_key)
              .map_err(Into::into);
          }
          _ => {
            return Err(AsymmetricPublicKeyError::UnsupportedPemLabel(
              label.to_string(),
            ))
          }
        }
      }
      "der" => match typ {
        "pkcs1" => Document::from_pkcs1_der(key)
          .map_err(|_| AsymmetricPublicKeyError::InvalidPkcs1PublicKey)?,
        "spki" => Document::from_public_key_der(key)
          .map_err(|_| AsymmetricPublicKeyError::InvalidSpkiPublicKey)?,
        _ => {
          return Err(AsymmetricPublicKeyError::UnsupportedKeyType(
            typ.to_string(),
          ))
        }
      },
      _ => {
        return Err(AsymmetricPublicKeyError::UnsupportedKeyType(
          format.to_string(),
        ))
      }
    };

    let spki = SubjectPublicKeyInfoRef::try_from(document.as_bytes())?;

    let public_key = match spki.algorithm.oid {
      RSA_ENCRYPTION_OID => {
        let public_key = RsaPublicKey::from_pkcs1_der(
          spki.subject_public_key.as_bytes().unwrap(),
        )?;
        AsymmetricPublicKey::Rsa(public_key)
      }
      RSASSA_PSS_OID => {
        let details = parse_rsa_pss_params(spki.algorithm.parameters)?;
        let public_key = RsaPublicKey::from_pkcs1_der(
          spki.subject_public_key.as_bytes().unwrap(),
        )?;
        AsymmetricPublicKey::RsaPss(RsaPssPublicKey {
          key: public_key,
          details,
        })
      }
      DSA_OID => {
        let verifying_key = dsa::VerifyingKey::try_from(spki)
          .map_err(|_| AsymmetricPublicKeyError::MalformedDssPublicKey)?;
        AsymmetricPublicKey::Dsa(verifying_key)
      }
      EC_OID => {
        let named_curve = spki.algorithm.parameters_oid().map_err(|_| {
          AsymmetricPublicKeyError::MalformedOrMissingNamedCurveInEcParameters
        })?;
        let data = spki.subject_public_key.as_bytes().ok_or(
          AsymmetricPublicKeyError::MalformedOrMissingPublicKeyInEcSpki,
        )?;

        match named_curve {
          ID_SECP224R1_OID => {
            let public_key = p224::PublicKey::from_sec1_bytes(data)?;
            AsymmetricPublicKey::Ec(EcPublicKey::P224(public_key))
          }
          ID_SECP256R1_OID => {
            let public_key = p256::PublicKey::from_sec1_bytes(data)?;
            AsymmetricPublicKey::Ec(EcPublicKey::P256(public_key))
          }
          ID_SECP384R1_OID => {
            let public_key = p384::PublicKey::from_sec1_bytes(data)?;
            AsymmetricPublicKey::Ec(EcPublicKey::P384(public_key))
          }
          _ => return Err(AsymmetricPublicKeyError::UnsupportedEcNamedCurve),
        }
      }
      X25519_OID => {
        let mut bytes = [0; 32];
        let data = spki.subject_public_key.as_bytes().ok_or(
          AsymmetricPublicKeyError::MalformedOrMissingPublicKeyInX25519Spki,
        )?;
        if data.len() < 32 {
          return Err(AsymmetricPublicKeyError::X25519PublicKeyIsTooShort);
        }
        bytes.copy_from_slice(&data[0..32]);
        AsymmetricPublicKey::X25519(x25519_dalek::PublicKey::from(bytes))
      }
      ED25519_OID => {
        let verifying_key = ed25519_dalek::VerifyingKey::try_from(spki)
          .map_err(|_| AsymmetricPublicKeyError::InvalidEd25519PublicKey)?;
        AsymmetricPublicKey::Ed25519(verifying_key)
      }
      DH_KEY_AGREEMENT_OID => {
        let params = spki
          .algorithm
          .parameters
          .ok_or(AsymmetricPublicKeyError::MissingDhParameters)?;
        let params = pkcs3::DhParameter::from_der(&params.to_der().unwrap())
          .map_err(|_| AsymmetricPublicKeyError::MalformedDhParameters)?;
        let Some(subject_public_key) = spki.subject_public_key.as_bytes()
        else {
          return Err(
            AsymmetricPublicKeyError::MalformedOrMissingPublicKeyInDhSpki,
          );
        };
        AsymmetricPublicKey::Dh(DhPublicKey {
          key: dh::PublicKey::from_bytes(subject_public_key),
          params,
        })
      }
      _ => return Err(AsymmetricPublicKeyError::UnsupportedPrivateKeyOid),
    };

    Ok(KeyObjectHandle::AsymmetricPublic(public_key))
  }
}

#[derive(Debug, thiserror::Error)]
pub enum RsaPssParamsParseError {
  #[error("malformed pss private key parameters")]
  MalformedPssPrivateKeyParameters,
  #[error("unsupported pss hash algorithm")]
  UnsupportedPssHashAlgorithm,
  #[error("unsupported pss mask gen algorithm")]
  UnsupportedPssMaskGenAlgorithm,
  #[error("malformed or missing pss mask gen algorithm parameters")]
  MalformedOrMissingPssMaskGenAlgorithm,
}

fn parse_rsa_pss_params(
  parameters: Option<AnyRef<'_>>,
) -> Result<Option<RsaPssDetails>, RsaPssParamsParseError> {
  let details = if let Some(parameters) = parameters {
    let params = RsaPssParameters::try_from(parameters)
      .map_err(|_| RsaPssParamsParseError::MalformedPssPrivateKeyParameters)?;

    let hash_algorithm = match params.hash_algorithm.map(|k| k.oid) {
      Some(ID_SHA1_OID) => RsaPssHashAlgorithm::Sha1,
      Some(ID_SHA224_OID) => RsaPssHashAlgorithm::Sha224,
      Some(ID_SHA256_OID) => RsaPssHashAlgorithm::Sha256,
      Some(ID_SHA384_OID) => RsaPssHashAlgorithm::Sha384,
      Some(ID_SHA512_OID) => RsaPssHashAlgorithm::Sha512,
      Some(ID_SHA512_224_OID) => RsaPssHashAlgorithm::Sha512_224,
      Some(ID_SHA512_256_OID) => RsaPssHashAlgorithm::Sha512_256,
      None => RsaPssHashAlgorithm::Sha1,
      _ => return Err(RsaPssParamsParseError::UnsupportedPssHashAlgorithm),
    };

    let mf1_hash_algorithm = match params.mask_gen_algorithm {
      Some(alg) => {
        if alg.oid != ID_MFG1 {
          return Err(RsaPssParamsParseError::UnsupportedPssMaskGenAlgorithm);
        }
        let params = alg.parameters_oid().map_err(|_| {
          RsaPssParamsParseError::MalformedOrMissingPssMaskGenAlgorithm
        })?;
        match params {
          ID_SHA1_OID => RsaPssHashAlgorithm::Sha1,
          ID_SHA224_OID => RsaPssHashAlgorithm::Sha224,
          ID_SHA256_OID => RsaPssHashAlgorithm::Sha256,
          ID_SHA384_OID => RsaPssHashAlgorithm::Sha384,
          ID_SHA512_OID => RsaPssHashAlgorithm::Sha512,
          ID_SHA512_224_OID => RsaPssHashAlgorithm::Sha512_224,
          ID_SHA512_256_OID => RsaPssHashAlgorithm::Sha512_256,
          _ => {
            return Err(RsaPssParamsParseError::UnsupportedPssMaskGenAlgorithm)
          }
        }
      }
      None => hash_algorithm,
    };

    let salt_length = params
      .salt_length
      .unwrap_or_else(|| hash_algorithm.salt_length());

    Some(RsaPssDetails {
      hash_algorithm,
      mf1_hash_algorithm,
      salt_length,
    })
  } else {
    None
  };
  Ok(details)
}

fn bytes_to_b64(bytes: &[u8]) -> String {
  use base64::prelude::BASE64_URL_SAFE_NO_PAD;
  BASE64_URL_SAFE_NO_PAD.encode(bytes)
}

#[derive(Debug, thiserror::Error)]
pub enum AsymmetricPublicKeyJwkError {
  #[error("key is not an asymmetric public key")]
  KeyIsNotAsymmetricPublicKey,
  #[error("Unsupported JWK EC curve: P224")]
  UnsupportedJwkEcCurveP224,
  #[error("jwk export not implemented for this key type")]
  JwkExportNotImplementedForKeyType,
}

#[derive(Debug, thiserror::Error)]
pub enum AsymmetricPublicKeyDerError {
  #[error("key is not an asymmetric public key")]
  KeyIsNotAsymmetricPublicKey,
  #[error("invalid RSA public key")]
  InvalidRsaPublicKey,
  #[error("exporting non-RSA public key as PKCS#1 is not supported")]
  ExportingNonRsaPublicKeyAsPkcs1Unsupported,
  #[error("invalid EC public key")]
  InvalidEcPublicKey,
  #[error("exporting RSA-PSS public key as SPKI is not supported yet")]
  ExportingNonRsaPssPublicKeyAsSpkiUnsupported,
  #[error("invalid DSA public key")]
  InvalidDsaPublicKey,
  #[error("invalid X25519 public key")]
  InvalidX25519PublicKey,
  #[error("invalid Ed25519 public key")]
  InvalidEd25519PublicKey,
  #[error("invalid DH public key")]
  InvalidDhPublicKey,
  #[error("unsupported key type: {0}")]
  UnsupportedKeyType(String),
}

impl AsymmetricPublicKey {
  fn export_jwk(
    &self,
  ) -> Result<deno_core::serde_json::Value, AsymmetricPublicKeyJwkError> {
    match self {
      AsymmetricPublicKey::Ec(key) => {
        let jwk = key.to_jwk()?;
        Ok(deno_core::serde_json::json!(jwk))
      }
      AsymmetricPublicKey::X25519(key) => {
        let bytes = key.as_bytes();
        let jwk = deno_core::serde_json::json!({
            "kty": "OKP",
            "crv": "X25519",
            "x": bytes_to_b64(bytes),
        });
        Ok(jwk)
      }
      AsymmetricPublicKey::Ed25519(key) => {
        let bytes = key.to_bytes();
        let jwk = deno_core::serde_json::json!({
            "kty": "OKP",
            "crv": "Ed25519",
            "x": bytes_to_b64(&bytes),
        });
        Ok(jwk)
      }
      AsymmetricPublicKey::Rsa(key) => {
        let n = key.n();
        let e = key.e();

        let jwk = deno_core::serde_json::json!({
            "kty": "RSA",
            "n": bytes_to_b64(&n.to_bytes_be()),
            "e": bytes_to_b64(&e.to_bytes_be()),
        });
        Ok(jwk)
      }
      AsymmetricPublicKey::RsaPss(key) => {
        let n = key.key.n();
        let e = key.key.e();

        let jwk = deno_core::serde_json::json!({
            "kty": "RSA",
            "n": bytes_to_b64(&n.to_bytes_be()),
            "e": bytes_to_b64(&e.to_bytes_be()),
        });
        Ok(jwk)
      }
      _ => Err(AsymmetricPublicKeyJwkError::JwkExportNotImplementedForKeyType),
    }
  }

  fn export_der(
    &self,
    typ: &str,
  ) -> Result<Box<[u8]>, AsymmetricPublicKeyDerError> {
    match typ {
      "pkcs1" => match self {
        AsymmetricPublicKey::Rsa(key) => {
          let der = key
            .to_pkcs1_der()
            .map_err(|_| AsymmetricPublicKeyDerError::InvalidRsaPublicKey)?
            .into_vec()
            .into_boxed_slice();
          Ok(der)
        }
        _ => Err(AsymmetricPublicKeyDerError::ExportingNonRsaPublicKeyAsPkcs1Unsupported),
      },
      "spki" => {
        let der = match self {
          AsymmetricPublicKey::Rsa(key) => key
            .to_public_key_der()
            .map_err(|_| AsymmetricPublicKeyDerError::InvalidRsaPublicKey)?
            .into_vec()
            .into_boxed_slice(),
          AsymmetricPublicKey::RsaPss(_key) => {
            return Err(AsymmetricPublicKeyDerError::ExportingNonRsaPssPublicKeyAsSpkiUnsupported)
          }
          AsymmetricPublicKey::Dsa(key) => key
            .to_public_key_der()
            .map_err(|_| AsymmetricPublicKeyDerError::InvalidDsaPublicKey)?
            .into_vec()
            .into_boxed_slice(),
          AsymmetricPublicKey::Ec(key) => {
            let (sec1, oid) = match key {
              EcPublicKey::P224(key) => (key.to_sec1_bytes(), ID_SECP224R1_OID),
              EcPublicKey::P256(key) => (key.to_sec1_bytes(), ID_SECP256R1_OID),
              EcPublicKey::P384(key) => (key.to_sec1_bytes(), ID_SECP384R1_OID),
            };

            let spki = SubjectPublicKeyInfoRef {
              algorithm: rsa::pkcs8::AlgorithmIdentifierRef {
                oid: EC_OID,
                parameters: Some(asn1::AnyRef::from(&oid)),
              },
              subject_public_key: BitStringRef::from_bytes(&sec1)
                .map_err(|_| AsymmetricPublicKeyDerError::InvalidEcPublicKey)?,
            };

            spki
              .to_der()
              .map_err(|_| AsymmetricPublicKeyDerError::InvalidEcPublicKey)?
              .into_boxed_slice()
          }
          AsymmetricPublicKey::X25519(key) => {
            let spki = SubjectPublicKeyInfoRef {
              algorithm: rsa::pkcs8::AlgorithmIdentifierRef {
                oid: X25519_OID,
                parameters: None,
              },
              subject_public_key: BitStringRef::from_bytes(key.as_bytes())
                .map_err(|_| AsymmetricPublicKeyDerError::InvalidX25519PublicKey)?,
            };

            spki
              .to_der()
              .map_err(|_| AsymmetricPublicKeyDerError::InvalidX25519PublicKey)?
              .into_boxed_slice()
          }
          AsymmetricPublicKey::Ed25519(key) => {
            let spki = SubjectPublicKeyInfoRef {
              algorithm: rsa::pkcs8::AlgorithmIdentifierRef {
                oid: ED25519_OID,
                parameters: None,
              },
              subject_public_key: BitStringRef::from_bytes(key.as_bytes())
                .map_err(|_| AsymmetricPublicKeyDerError::InvalidEd25519PublicKey)?,
            };

            spki
              .to_der()
              .map_err(|_| AsymmetricPublicKeyDerError::InvalidEd25519PublicKey)?
              .into_boxed_slice()
          }
          AsymmetricPublicKey::Dh(key) => {
            let public_key_bytes = key.key.clone().into_vec();
            let params = key.params.to_der().unwrap();
            let spki = SubjectPublicKeyInfoRef {
              algorithm: rsa::pkcs8::AlgorithmIdentifierRef {
                oid: DH_KEY_AGREEMENT_OID,
                parameters: Some(AnyRef::new(Tag::Sequence, &params).unwrap()),
              },
              subject_public_key: BitStringRef::from_bytes(&public_key_bytes)
                .map_err(|_| {
                  AsymmetricPublicKeyDerError::InvalidDhPublicKey
              })?,
            };
            spki
              .to_der()
              .map_err(|_| AsymmetricPublicKeyDerError::InvalidDhPublicKey)?
              .into_boxed_slice()
          }
        };
        Ok(der)
      }
      _ => Err(AsymmetricPublicKeyDerError::UnsupportedKeyType(typ.to_string())),
    }
  }
}

#[derive(Debug, thiserror::Error)]
pub enum AsymmetricPrivateKeyDerError {
  #[error("key is not an asymmetric private key")]
  KeyIsNotAsymmetricPrivateKey,
  #[error("invalid RSA private key")]
  InvalidRsaPrivateKey,
  #[error("exporting non-RSA private key as PKCS#1 is not supported")]
  ExportingNonRsaPrivateKeyAsPkcs1Unsupported,
  #[error("invalid EC private key")]
  InvalidEcPrivateKey,
  #[error("exporting non-EC private key as SEC1 is not supported")]
  ExportingNonEcPrivateKeyAsSec1Unsupported,
  #[error("exporting RSA-PSS private key as PKCS#8 is not supported yet")]
  ExportingNonRsaPssPrivateKeyAsPkcs8Unsupported,
  #[error("invalid DSA private key")]
  InvalidDsaPrivateKey,
  #[error("invalid X25519 private key")]
  InvalidX25519PrivateKey,
  #[error("invalid Ed25519 private key")]
  InvalidEd25519PrivateKey,
  #[error("invalid DH private key")]
  InvalidDhPrivateKey,
  #[error("unsupported key type: {0}")]
  UnsupportedKeyType(String),
}

impl AsymmetricPrivateKey {
  fn export_der(
    &self,
    typ: &str,
    // cipher: Option<&str>,
    // passphrase: Option<&str>,
  ) -> Result<Box<[u8]>, AsymmetricPrivateKeyDerError> {
    match typ {
      "pkcs1" => match self {
        AsymmetricPrivateKey::Rsa(key) => {
          let der = key
            .to_pkcs1_der()
            .map_err(|_| AsymmetricPrivateKeyDerError::InvalidRsaPrivateKey)?
            .to_bytes()
            .to_vec()
            .into_boxed_slice();
          Ok(der)
        }
        _ => Err(AsymmetricPrivateKeyDerError::ExportingNonRsaPrivateKeyAsPkcs1Unsupported),
      },
      "sec1" => match self {
        AsymmetricPrivateKey::Ec(key) => {
          let sec1 = match key {
            EcPrivateKey::P224(key) => key.to_sec1_der(),
            EcPrivateKey::P256(key) => key.to_sec1_der(),
            EcPrivateKey::P384(key) => key.to_sec1_der(),
          }
          .map_err(|_| AsymmetricPrivateKeyDerError::InvalidEcPrivateKey)?;
          Ok(sec1.to_vec().into_boxed_slice())
        }
        _ => Err(AsymmetricPrivateKeyDerError::ExportingNonEcPrivateKeyAsSec1Unsupported),
      },
      "pkcs8" => {
        let der = match self {
          AsymmetricPrivateKey::Rsa(key) => {
            let document = key
              .to_pkcs8_der()
              .map_err(|_| AsymmetricPrivateKeyDerError::InvalidRsaPrivateKey)?;
            document.to_bytes().to_vec().into_boxed_slice()
          }
          AsymmetricPrivateKey::RsaPss(_key) => {
            return Err(AsymmetricPrivateKeyDerError::ExportingNonRsaPssPrivateKeyAsPkcs8Unsupported)
          }
          AsymmetricPrivateKey::Dsa(key) => {
            let document = key
              .to_pkcs8_der()
              .map_err(|_| AsymmetricPrivateKeyDerError::InvalidDsaPrivateKey)?;
            document.to_bytes().to_vec().into_boxed_slice()
          }
          AsymmetricPrivateKey::Ec(key) => {
            let document = match key {
              EcPrivateKey::P224(key) => key.to_pkcs8_der(),
              EcPrivateKey::P256(key) => key.to_pkcs8_der(),
              EcPrivateKey::P384(key) => key.to_pkcs8_der(),
            }
            .map_err(|_| AsymmetricPrivateKeyDerError::InvalidEcPrivateKey)?;
            document.to_bytes().to_vec().into_boxed_slice()
          }
          AsymmetricPrivateKey::X25519(key) => {
            let private_key = OctetStringRef::new(key.as_bytes())
              .map_err(|_| AsymmetricPrivateKeyDerError::InvalidX25519PrivateKey)?
              .to_der()
              .map_err(|_| AsymmetricPrivateKeyDerError::InvalidX25519PrivateKey)?;

            let private_key = PrivateKeyInfo {
              algorithm: rsa::pkcs8::AlgorithmIdentifierRef {
                oid: X25519_OID,
                parameters: None,
              },
              private_key: &private_key,
              public_key: None,
            };

            let der = private_key
              .to_der()
              .map_err(|_| AsymmetricPrivateKeyDerError::InvalidX25519PrivateKey)?
              .into_boxed_slice();
            return Ok(der);
          }
          AsymmetricPrivateKey::Ed25519(key) => {
            let private_key = OctetStringRef::new(key.as_bytes())
              .map_err(|_| AsymmetricPrivateKeyDerError::InvalidEd25519PrivateKey)?
              .to_der()
              .map_err(|_| AsymmetricPrivateKeyDerError::InvalidEd25519PrivateKey)?;

            let private_key = PrivateKeyInfo {
              algorithm: rsa::pkcs8::AlgorithmIdentifierRef {
                oid: ED25519_OID,
                parameters: None,
              },
              private_key: &private_key,
              public_key: None,
            };

            private_key
              .to_der()
              .map_err(|_| AsymmetricPrivateKeyDerError::InvalidEd25519PrivateKey)?
              .into_boxed_slice()
          }
          AsymmetricPrivateKey::Dh(key) => {
            let private_key = key.key.clone().into_vec();
            let params = key.params.to_der().unwrap();
            let private_key = PrivateKeyInfo {
              algorithm: rsa::pkcs8::AlgorithmIdentifierRef {
                oid: DH_KEY_AGREEMENT_OID,
                parameters: Some(AnyRef::new(Tag::Sequence, &params).unwrap()),
              },
              private_key: &private_key,
              public_key: None,
            };

            private_key
              .to_der()
              .map_err(|_| AsymmetricPrivateKeyDerError::InvalidDhPrivateKey)?
              .into_boxed_slice()
          }
        };

        Ok(der)
      }
      _ => Err(AsymmetricPrivateKeyDerError::UnsupportedKeyType(typ.to_string())),
    }
  }
}

#[op2]
#[cppgc]
pub fn op_node_create_private_key(
  #[buffer] key: &[u8],
  #[string] format: &str,
  #[string] typ: &str,
  #[buffer] passphrase: Option<&[u8]>,
) -> Result<KeyObjectHandle, AsymmetricPrivateKeyError> {
  KeyObjectHandle::new_asymmetric_private_key_from_js(
    key, format, typ, passphrase,
  )
}

#[op2]
#[cppgc]
pub fn op_node_create_ed_raw(
  #[string] curve: &str,
  #[buffer] key: &[u8],
  is_public: bool,
) -> Result<KeyObjectHandle, EdRawError> {
  KeyObjectHandle::new_ed_raw(curve, key, is_public)
}

#[derive(serde::Deserialize)]
pub struct RsaJwkKey {
  n: String,
  e: String,
  d: Option<String>,
  p: Option<String>,
  q: Option<String>,
}

#[op2]
#[cppgc]
pub fn op_node_create_rsa_jwk(
  #[serde] jwk: RsaJwkKey,
  is_public: bool,
) -> Result<KeyObjectHandle, RsaJwkError> {
  KeyObjectHandle::new_rsa_jwk(jwk, is_public)
}

#[op2]
#[cppgc]
pub fn op_node_create_ec_jwk(
  #[serde] jwk: JwkEcKey,
  is_public: bool,
) -> Result<KeyObjectHandle, EcJwkError> {
  KeyObjectHandle::new_ec_jwk(&jwk, is_public)
}

#[op2]
#[cppgc]
pub fn op_node_create_public_key(
  #[buffer] key: &[u8],
  #[string] format: &str,
  #[string] typ: &str,
  #[buffer] passphrase: Option<&[u8]>,
) -> Result<KeyObjectHandle, AsymmetricPublicKeyError> {
  KeyObjectHandle::new_asymmetric_public_key_from_js(
    key, format, typ, passphrase,
  )
}

#[op2]
#[cppgc]
pub fn op_node_create_secret_key(
  #[buffer(copy)] key: Box<[u8]>,
) -> KeyObjectHandle {
  KeyObjectHandle::Secret(key)
}

#[op2]
#[string]
pub fn op_node_get_asymmetric_key_type(
  #[cppgc] handle: &KeyObjectHandle,
) -> Result<&'static str, deno_core::error::AnyError> {
  match handle {
    KeyObjectHandle::AsymmetricPrivate(AsymmetricPrivateKey::Rsa(_))
    | KeyObjectHandle::AsymmetricPublic(AsymmetricPublicKey::Rsa(_)) => {
      Ok("rsa")
    }
    KeyObjectHandle::AsymmetricPrivate(AsymmetricPrivateKey::RsaPss(_))
    | KeyObjectHandle::AsymmetricPublic(AsymmetricPublicKey::RsaPss(_)) => {
      Ok("rsa-pss")
    }
    KeyObjectHandle::AsymmetricPrivate(AsymmetricPrivateKey::Dsa(_))
    | KeyObjectHandle::AsymmetricPublic(AsymmetricPublicKey::Dsa(_)) => {
      Ok("dsa")
    }
    KeyObjectHandle::AsymmetricPrivate(AsymmetricPrivateKey::Ec(_))
    | KeyObjectHandle::AsymmetricPublic(AsymmetricPublicKey::Ec(_)) => Ok("ec"),
    KeyObjectHandle::AsymmetricPrivate(AsymmetricPrivateKey::X25519(_))
    | KeyObjectHandle::AsymmetricPublic(AsymmetricPublicKey::X25519(_)) => {
      Ok("x25519")
    }
    KeyObjectHandle::AsymmetricPrivate(AsymmetricPrivateKey::Ed25519(_))
    | KeyObjectHandle::AsymmetricPublic(AsymmetricPublicKey::Ed25519(_)) => {
      Ok("ed25519")
    }
    KeyObjectHandle::AsymmetricPrivate(AsymmetricPrivateKey::Dh(_))
    | KeyObjectHandle::AsymmetricPublic(AsymmetricPublicKey::Dh(_)) => Ok("dh"),
    KeyObjectHandle::Secret(_) => {
      Err(type_error("symmetric key is not an asymmetric key"))
    }
  }
}

#[derive(serde::Serialize)]
#[serde(untagged)]
pub enum AsymmetricKeyDetails {
  #[serde(rename_all = "camelCase")]
  Rsa {
    modulus_length: usize,
    public_exponent: V8BigInt,
  },
  #[serde(rename_all = "camelCase")]
  RsaPss {
    modulus_length: usize,
    public_exponent: V8BigInt,
    hash_algorithm: &'static str,
    mgf1_hash_algorithm: &'static str,
    salt_length: u32,
  },
  #[serde(rename = "rsaPss")]
  RsaPssBasic {
    modulus_length: usize,
    public_exponent: V8BigInt,
  },
  #[serde(rename_all = "camelCase")]
  Dsa {
    modulus_length: usize,
    divisor_length: usize,
  },
  #[serde(rename_all = "camelCase")]
  Ec {
    named_curve: &'static str,
  },
  X25519,
  Ed25519,
  Dh,
}

#[op2]
#[serde]
pub fn op_node_get_asymmetric_key_details(
  #[cppgc] handle: &KeyObjectHandle,
) -> Result<AsymmetricKeyDetails, deno_core::error::AnyError> {
  match handle {
    KeyObjectHandle::AsymmetricPrivate(private_key) => match private_key {
      AsymmetricPrivateKey::Rsa(key) => {
        let modulus_length = key.n().bits();
        let public_exponent =
          BigInt::from_bytes_be(num_bigint::Sign::Plus, &key.e().to_bytes_be());
        Ok(AsymmetricKeyDetails::Rsa {
          modulus_length,
          public_exponent: V8BigInt::from(public_exponent),
        })
      }
      AsymmetricPrivateKey::RsaPss(key) => {
        let modulus_length = key.key.n().bits();
        let public_exponent = BigInt::from_bytes_be(
          num_bigint::Sign::Plus,
          &key.key.e().to_bytes_be(),
        );
        let public_exponent = V8BigInt::from(public_exponent);
        let details = match key.details {
          Some(details) => AsymmetricKeyDetails::RsaPss {
            modulus_length,
            public_exponent,
            hash_algorithm: details.hash_algorithm.as_str(),
            mgf1_hash_algorithm: details.mf1_hash_algorithm.as_str(),
            salt_length: details.salt_length,
          },
          None => AsymmetricKeyDetails::RsaPssBasic {
            modulus_length,
            public_exponent,
          },
        };
        Ok(details)
      }
      AsymmetricPrivateKey::Dsa(key) => {
        let components = key.verifying_key().components();
        let modulus_length = components.p().bits();
        let divisor_length = components.q().bits();
        Ok(AsymmetricKeyDetails::Dsa {
          modulus_length,
          divisor_length,
        })
      }
      AsymmetricPrivateKey::Ec(key) => {
        let named_curve = match key {
          EcPrivateKey::P224(_) => "p224",
          EcPrivateKey::P256(_) => "p256",
          EcPrivateKey::P384(_) => "p384",
        };
        Ok(AsymmetricKeyDetails::Ec { named_curve })
      }
      AsymmetricPrivateKey::X25519(_) => Ok(AsymmetricKeyDetails::X25519),
      AsymmetricPrivateKey::Ed25519(_) => Ok(AsymmetricKeyDetails::Ed25519),
      AsymmetricPrivateKey::Dh(_) => Ok(AsymmetricKeyDetails::Dh),
    },
    KeyObjectHandle::AsymmetricPublic(public_key) => match public_key {
      AsymmetricPublicKey::Rsa(key) => {
        let modulus_length = key.n().bits();
        let public_exponent =
          BigInt::from_bytes_be(num_bigint::Sign::Plus, &key.e().to_bytes_be());
        Ok(AsymmetricKeyDetails::Rsa {
          modulus_length,
          public_exponent: V8BigInt::from(public_exponent),
        })
      }
      AsymmetricPublicKey::RsaPss(key) => {
        let modulus_length = key.key.n().bits();
        let public_exponent = BigInt::from_bytes_be(
          num_bigint::Sign::Plus,
          &key.key.e().to_bytes_be(),
        );
        let public_exponent = V8BigInt::from(public_exponent);
        let details = match key.details {
          Some(details) => AsymmetricKeyDetails::RsaPss {
            modulus_length,
            public_exponent,
            hash_algorithm: details.hash_algorithm.as_str(),
            mgf1_hash_algorithm: details.mf1_hash_algorithm.as_str(),
            salt_length: details.salt_length,
          },
          None => AsymmetricKeyDetails::RsaPssBasic {
            modulus_length,
            public_exponent,
          },
        };
        Ok(details)
      }
      AsymmetricPublicKey::Dsa(key) => {
        let components = key.components();
        let modulus_length = components.p().bits();
        let divisor_length = components.q().bits();
        Ok(AsymmetricKeyDetails::Dsa {
          modulus_length,
          divisor_length,
        })
      }
      AsymmetricPublicKey::Ec(key) => {
        let named_curve = match key {
          EcPublicKey::P224(_) => "p224",
          EcPublicKey::P256(_) => "p256",
          EcPublicKey::P384(_) => "p384",
        };
        Ok(AsymmetricKeyDetails::Ec { named_curve })
      }
      AsymmetricPublicKey::X25519(_) => Ok(AsymmetricKeyDetails::X25519),
      AsymmetricPublicKey::Ed25519(_) => Ok(AsymmetricKeyDetails::Ed25519),
      AsymmetricPublicKey::Dh(_) => Ok(AsymmetricKeyDetails::Dh),
    },
    KeyObjectHandle::Secret(_) => {
      Err(type_error("symmetric key is not an asymmetric key"))
    }
  }
}

#[op2(fast)]
#[smi]
pub fn op_node_get_symmetric_key_size(
  #[cppgc] handle: &KeyObjectHandle,
) -> Result<usize, deno_core::error::AnyError> {
  match handle {
    KeyObjectHandle::AsymmetricPrivate(_)
    | KeyObjectHandle::AsymmetricPublic(_) => {
      Err(type_error("asymmetric key is not a symmetric key"))
    }
    KeyObjectHandle::Secret(key) => Ok(key.len() * 8),
  }
}

#[op2]
#[cppgc]
pub fn op_node_generate_secret_key(#[smi] len: usize) -> KeyObjectHandle {
  let mut key = vec![0u8; len];
  thread_rng().fill_bytes(&mut key);
  KeyObjectHandle::Secret(key.into_boxed_slice())
}

#[op2(async)]
#[cppgc]
pub async fn op_node_generate_secret_key_async(
  #[smi] len: usize,
) -> KeyObjectHandle {
  spawn_blocking(move || {
    let mut key = vec![0u8; len];
    thread_rng().fill_bytes(&mut key);
    KeyObjectHandle::Secret(key.into_boxed_slice())
  })
  .await
  .unwrap()
}

struct KeyObjectHandlePair {
  private_key: RefCell<Option<KeyObjectHandle>>,
  public_key: RefCell<Option<KeyObjectHandle>>,
}

impl GarbageCollected for KeyObjectHandlePair {}

impl KeyObjectHandlePair {
  pub fn new(
    private_key: AsymmetricPrivateKey,
    public_key: AsymmetricPublicKey,
  ) -> Self {
    Self {
      private_key: RefCell::new(Some(KeyObjectHandle::AsymmetricPrivate(
        private_key,
      ))),
      public_key: RefCell::new(Some(KeyObjectHandle::AsymmetricPublic(
        public_key,
      ))),
    }
  }
}

#[op2]
#[cppgc]
pub fn op_node_get_public_key_from_pair(
  #[cppgc] pair: &KeyObjectHandlePair,
) -> Option<KeyObjectHandle> {
  pair.public_key.borrow_mut().take()
}

#[op2]
#[cppgc]
pub fn op_node_get_private_key_from_pair(
  #[cppgc] pair: &KeyObjectHandlePair,
) -> Option<KeyObjectHandle> {
  pair.private_key.borrow_mut().take()
}

fn generate_rsa(
  modulus_length: usize,
  public_exponent: usize,
) -> KeyObjectHandlePair {
  let private_key = RsaPrivateKey::new_with_exp(
    &mut thread_rng(),
    modulus_length,
    &rsa::BigUint::from_usize(public_exponent).unwrap(),
  )
  .unwrap();

  let private_key = AsymmetricPrivateKey::Rsa(private_key);
  let public_key = private_key.to_public_key();

  KeyObjectHandlePair::new(private_key, public_key)
}

#[op2]
#[cppgc]
pub fn op_node_generate_rsa_key(
  #[smi] modulus_length: usize,
  #[smi] public_exponent: usize,
) -> KeyObjectHandlePair {
  generate_rsa(modulus_length, public_exponent)
}

#[op2(async)]
#[cppgc]
pub async fn op_node_generate_rsa_key_async(
  #[smi] modulus_length: usize,
  #[smi] public_exponent: usize,
) -> KeyObjectHandlePair {
  spawn_blocking(move || generate_rsa(modulus_length, public_exponent))
    .await
    .unwrap()
}

#[derive(Debug, thiserror::Error)]
#[error("digest not allowed for RSA-PSS keys{}", .0.as_ref().map(|digest| format!(": {digest}")).unwrap_or_default())]
pub struct GenerateRsaPssError(Option<String>);

fn generate_rsa_pss(
  modulus_length: usize,
  public_exponent: usize,
  hash_algorithm: Option<&str>,
  mf1_hash_algorithm: Option<&str>,
  salt_length: Option<u32>,
) -> Result<KeyObjectHandlePair, GenerateRsaPssError> {
  let key = RsaPrivateKey::new_with_exp(
    &mut thread_rng(),
    modulus_length,
    &rsa::BigUint::from_usize(public_exponent).unwrap(),
  )
  .unwrap();

  let details = if hash_algorithm.is_none()
    && mf1_hash_algorithm.is_none()
    && salt_length.is_none()
  {
    None
  } else {
    let hash_algorithm = hash_algorithm.unwrap_or("sha1");
    let mf1_hash_algorithm = mf1_hash_algorithm.unwrap_or(hash_algorithm);
    let hash_algorithm = match_fixed_digest_with_oid!(
      hash_algorithm,
      fn (algorithm: Option<RsaPssHashAlgorithm>) {
        algorithm.ok_or(GenerateRsaPssError(None))?
      },
      _ => {
        return Err(GenerateRsaPssError(Some(hash_algorithm.to_string())))
      }
    );
    let mf1_hash_algorithm = match_fixed_digest_with_oid!(
      mf1_hash_algorithm,
      fn (algorithm: Option<RsaPssHashAlgorithm>) {
        algorithm.ok_or(GenerateRsaPssError(None))?
      },
      _ => {
        return Err(GenerateRsaPssError(Some(mf1_hash_algorithm.to_string())))
      }
    );
    let salt_length =
      salt_length.unwrap_or_else(|| hash_algorithm.salt_length());

    Some(RsaPssDetails {
      hash_algorithm,
      mf1_hash_algorithm,
      salt_length,
    })
  };

  let private_key =
    AsymmetricPrivateKey::RsaPss(RsaPssPrivateKey { key, details });
  let public_key = private_key.to_public_key();

  Ok(KeyObjectHandlePair::new(private_key, public_key))
}

#[op2]
#[cppgc]
pub fn op_node_generate_rsa_pss_key(
  #[smi] modulus_length: usize,
  #[smi] public_exponent: usize,
  #[string] hash_algorithm: Option<String>, // todo: Option<&str> not supproted in ops yet
  #[string] mf1_hash_algorithm: Option<String>, // todo: Option<&str> not supproted in ops yet
  #[smi] salt_length: Option<u32>,
) -> Result<KeyObjectHandlePair, GenerateRsaPssError> {
  generate_rsa_pss(
    modulus_length,
    public_exponent,
    hash_algorithm.as_deref(),
    mf1_hash_algorithm.as_deref(),
    salt_length,
  )
}

#[op2(async)]
#[cppgc]
pub async fn op_node_generate_rsa_pss_key_async(
  #[smi] modulus_length: usize,
  #[smi] public_exponent: usize,
  #[string] hash_algorithm: Option<String>, // todo: Option<&str> not supproted in ops yet
  #[string] mf1_hash_algorithm: Option<String>, // todo: Option<&str> not supproted in ops yet
  #[smi] salt_length: Option<u32>,
) -> Result<KeyObjectHandlePair, GenerateRsaPssError> {
  spawn_blocking(move || {
    generate_rsa_pss(
      modulus_length,
      public_exponent,
      hash_algorithm.as_deref(),
      mf1_hash_algorithm.as_deref(),
      salt_length,
    )
  })
  .await
  .unwrap()
}

fn dsa_generate(
  modulus_length: usize,
  divisor_length: usize,
) -> Result<KeyObjectHandlePair, deno_core::error::AnyError> {
  let mut rng = rand::thread_rng();
  use dsa::Components;
  use dsa::KeySize;
  use dsa::SigningKey;

  let key_size = match (modulus_length, divisor_length) {
    #[allow(deprecated)]
    (1024, 160) => KeySize::DSA_1024_160,
    (2048, 224) => KeySize::DSA_2048_224,
    (2048, 256) => KeySize::DSA_2048_256,
    (3072, 256) => KeySize::DSA_3072_256,
    _ => {
      return Err(type_error(
        "Invalid modulusLength+divisorLength combination",
      ))
    }
  };
  let components = Components::generate(&mut rng, key_size);
  let signing_key = SigningKey::generate(&mut rng, components);
  let private_key = AsymmetricPrivateKey::Dsa(signing_key);
  let public_key = private_key.to_public_key();

  Ok(KeyObjectHandlePair::new(private_key, public_key))
}

#[op2]
#[cppgc]
pub fn op_node_generate_dsa_key(
  #[smi] modulus_length: usize,
  #[smi] divisor_length: usize,
) -> Result<KeyObjectHandlePair, deno_core::error::AnyError> {
  dsa_generate(modulus_length, divisor_length)
}

#[op2(async)]
#[cppgc]
pub async fn op_node_generate_dsa_key_async(
  #[smi] modulus_length: usize,
  #[smi] divisor_length: usize,
) -> Result<KeyObjectHandlePair, deno_core::error::AnyError> {
  spawn_blocking(move || dsa_generate(modulus_length, divisor_length))
    .await
    .unwrap()
}

fn ec_generate(
  named_curve: &str,
) -> Result<KeyObjectHandlePair, deno_core::error::AnyError> {
  let mut rng = rand::thread_rng();
  // TODO(@littledivy): Support public key point encoding.
  // Default is uncompressed.
  let private_key = match named_curve {
    "P-224" | "prime224v1" | "secp224r1" => {
      let key = p224::SecretKey::random(&mut rng);
      AsymmetricPrivateKey::Ec(EcPrivateKey::P224(key))
    }
    "P-256" | "prime256v1" | "secp256r1" => {
      let key = p256::SecretKey::random(&mut rng);
      AsymmetricPrivateKey::Ec(EcPrivateKey::P256(key))
    }
    "P-384" | "prime384v1" | "secp384r1" => {
      let key = p384::SecretKey::random(&mut rng);
      AsymmetricPrivateKey::Ec(EcPrivateKey::P384(key))
    }
    _ => {
      return Err(type_error(format!(
        "unsupported named curve: {}",
        named_curve
      )))
    }
  };
  let public_key = private_key.to_public_key();
  Ok(KeyObjectHandlePair::new(private_key, public_key))
}

#[op2]
#[cppgc]
pub fn op_node_generate_ec_key(
  #[string] named_curve: &str,
) -> Result<KeyObjectHandlePair, deno_core::error::AnyError> {
  ec_generate(named_curve)
}

#[op2(async)]
#[cppgc]
pub async fn op_node_generate_ec_key_async(
  #[string] named_curve: String,
) -> Result<KeyObjectHandlePair, deno_core::error::AnyError> {
  spawn_blocking(move || ec_generate(&named_curve))
    .await
    .unwrap()
}

fn x25519_generate() -> KeyObjectHandlePair {
  let keypair = x25519_dalek::StaticSecret::random_from_rng(thread_rng());
  let private_key = AsymmetricPrivateKey::X25519(keypair);
  let public_key = private_key.to_public_key();
  KeyObjectHandlePair::new(private_key, public_key)
}

#[op2]
#[cppgc]
pub fn op_node_generate_x25519_key() -> KeyObjectHandlePair {
  x25519_generate()
}

#[op2(async)]
#[cppgc]
pub async fn op_node_generate_x25519_key_async() -> KeyObjectHandlePair {
  spawn_blocking(x25519_generate).await.unwrap()
}

fn ed25519_generate() -> KeyObjectHandlePair {
  let keypair = ed25519_dalek::SigningKey::generate(&mut thread_rng());
  let private_key = AsymmetricPrivateKey::Ed25519(keypair);
  let public_key = private_key.to_public_key();
  KeyObjectHandlePair::new(private_key, public_key)
}

#[op2]
#[cppgc]
pub fn op_node_generate_ed25519_key() -> KeyObjectHandlePair {
  ed25519_generate()
}

#[op2(async)]
#[cppgc]
pub async fn op_node_generate_ed25519_key_async() -> KeyObjectHandlePair {
  spawn_blocking(ed25519_generate).await.unwrap()
}

fn u32_slice_to_u8_slice(slice: &[u32]) -> &[u8] {
  // SAFETY: just reinterpreting the slice as u8
  unsafe {
    std::slice::from_raw_parts(
      slice.as_ptr() as *const u8,
      std::mem::size_of_val(slice),
    )
  }
}

fn dh_group_generate(
  group_name: &str,
) -> Result<KeyObjectHandlePair, deno_core::error::AnyError> {
  let (dh, prime, generator) = match group_name {
    "modp5" => (
      dh::DiffieHellman::group::<dh::Modp1536>(),
      dh::Modp1536::MODULUS,
      dh::Modp1536::GENERATOR,
    ),
    "modp14" => (
      dh::DiffieHellman::group::<dh::Modp2048>(),
      dh::Modp2048::MODULUS,
      dh::Modp2048::GENERATOR,
    ),
    "modp15" => (
      dh::DiffieHellman::group::<dh::Modp3072>(),
      dh::Modp3072::MODULUS,
      dh::Modp3072::GENERATOR,
    ),
    "modp16" => (
      dh::DiffieHellman::group::<dh::Modp4096>(),
      dh::Modp4096::MODULUS,
      dh::Modp4096::GENERATOR,
    ),
    "modp17" => (
      dh::DiffieHellman::group::<dh::Modp6144>(),
      dh::Modp6144::MODULUS,
      dh::Modp6144::GENERATOR,
    ),
    "modp18" => (
      dh::DiffieHellman::group::<dh::Modp8192>(),
      dh::Modp8192::MODULUS,
      dh::Modp8192::GENERATOR,
    ),
    _ => return Err(type_error("Unsupported group name")),
  };
  let params = DhParameter {
    prime: asn1::Int::new(u32_slice_to_u8_slice(prime)).unwrap(),
    base: asn1::Int::new(generator.to_be_bytes().as_slice()).unwrap(),
    private_value_length: None,
  };
  Ok(KeyObjectHandlePair::new(
    AsymmetricPrivateKey::Dh(DhPrivateKey {
      key: dh.private_key,
      params: params.clone(),
    }),
    AsymmetricPublicKey::Dh(DhPublicKey {
      key: dh.public_key,
      params,
    }),
  ))
}

#[op2]
#[cppgc]
pub fn op_node_generate_dh_group_key(
  #[string] group_name: &str,
) -> Result<KeyObjectHandlePair, deno_core::error::AnyError> {
  dh_group_generate(group_name)
}

#[op2(async)]
#[cppgc]
pub async fn op_node_generate_dh_group_key_async(
  #[string] group_name: String,
) -> Result<KeyObjectHandlePair, deno_core::error::AnyError> {
  spawn_blocking(move || dh_group_generate(&group_name))
    .await
    .unwrap()
}

fn dh_generate(
  prime: Option<&[u8]>,
  prime_len: usize,
  generator: usize,
) -> KeyObjectHandlePair {
  let prime = prime
    .map(|p| p.into())
    .unwrap_or_else(|| Prime::generate(prime_len));
  let dh = dh::DiffieHellman::new(prime.clone(), generator);
  let params = DhParameter {
    prime: asn1::Int::new(&prime.0.to_bytes_be()).unwrap(),
    base: asn1::Int::new(generator.to_be_bytes().as_slice()).unwrap(),
    private_value_length: None,
  };
  KeyObjectHandlePair::new(
    AsymmetricPrivateKey::Dh(DhPrivateKey {
      key: dh.private_key,
      params: params.clone(),
    }),
    AsymmetricPublicKey::Dh(DhPublicKey {
      key: dh.public_key,
      params,
    }),
  )
}

#[op2]
#[cppgc]
pub fn op_node_generate_dh_key(
  #[buffer] prime: Option<&[u8]>,
  #[smi] prime_len: usize,
  #[smi] generator: usize,
) -> KeyObjectHandlePair {
  dh_generate(prime, prime_len, generator)
}

#[op2(async)]
#[cppgc]
pub async fn op_node_generate_dh_key_async(
  #[buffer(copy)] prime: Option<Box<[u8]>>,
  #[smi] prime_len: usize,
  #[smi] generator: usize,
) -> KeyObjectHandlePair {
  spawn_blocking(move || dh_generate(prime.as_deref(), prime_len, generator))
    .await
    .unwrap()
}

#[op2]
#[serde]
pub fn op_node_dh_keys_generate_and_export(
  #[buffer] prime: Option<&[u8]>,
  #[smi] prime_len: usize,
  #[smi] generator: usize,
) -> (ToJsBuffer, ToJsBuffer) {
  let prime = prime
    .map(|p| p.into())
    .unwrap_or_else(|| Prime::generate(prime_len));
  let dh = dh::DiffieHellman::new(prime, generator);
  let private_key = dh.private_key.into_vec().into_boxed_slice();
  let public_key = dh.public_key.into_vec().into_boxed_slice();
  (private_key.into(), public_key.into())
}

#[op2]
#[buffer]
pub fn op_node_export_secret_key(
  #[cppgc] handle: &KeyObjectHandle,
) -> Result<Box<[u8]>, deno_core::error::AnyError> {
  let key = handle
    .as_secret_key()
    .ok_or_else(|| type_error("key is not a secret key"))?;
  Ok(key.to_vec().into_boxed_slice())
}

#[op2]
#[string]
pub fn op_node_export_secret_key_b64url(
  #[cppgc] handle: &KeyObjectHandle,
) -> Result<String, deno_core::error::AnyError> {
  let key = handle
    .as_secret_key()
    .ok_or_else(|| type_error("key is not a secret key"))?;
  Ok(base64::engine::general_purpose::URL_SAFE_NO_PAD.encode(key))
}

#[op2]
#[serde]
pub fn op_node_export_public_key_jwk(
  #[cppgc] handle: &KeyObjectHandle,
) -> Result<deno_core::serde_json::Value, AsymmetricPublicKeyJwkError> {
  let public_key = handle
    .as_public_key()
    .ok_or(AsymmetricPublicKeyJwkError::KeyIsNotAsymmetricPublicKey)?;

  public_key.export_jwk()
}

#[derive(Debug, thiserror::Error)]
pub enum ExportPublicKeyPemError {
  #[error(transparent)]
  AsymmetricPublicKeyDer(#[from] AsymmetricPublicKeyDerError),
  #[error("very large data")]
  VeryLargeData,
  #[error(transparent)]
  Der(#[from] der::Error),
}

#[op2]
#[string]
pub fn op_node_export_public_key_pem(
  #[cppgc] handle: &KeyObjectHandle,
  #[string] typ: &str,
) -> Result<String, ExportPublicKeyPemError> {
  let public_key = handle
    .as_public_key()
    .ok_or(AsymmetricPublicKeyDerError::KeyIsNotAsymmetricPublicKey)?;
  let data = public_key.export_der(typ)?;

  let label = match typ {
    "pkcs1" => "RSA PUBLIC KEY",
    "spki" => "PUBLIC KEY",
    _ => unreachable!("export_der would have errored"),
  };

  let pem_len = der::pem::encapsulated_len(label, LineEnding::LF, data.len())
    .map_err(|_| ExportPublicKeyPemError::VeryLargeData)?;
  let mut out = vec![0; pem_len];
  let mut writer = PemWriter::new(label, LineEnding::LF, &mut out)?;
  writer.write(&data)?;
  let len = writer.finish()?;
  out.truncate(len);

  Ok(String::from_utf8(out).expect("invalid pem is not possible"))
}

#[op2]
#[buffer]
pub fn op_node_export_public_key_der(
  #[cppgc] handle: &KeyObjectHandle,
  #[string] typ: &str,
) -> Result<Box<[u8]>, AsymmetricPublicKeyDerError> {
  let public_key = handle
    .as_public_key()
    .ok_or(AsymmetricPublicKeyDerError::KeyIsNotAsymmetricPublicKey)?;
  public_key.export_der(typ)
}

#[derive(Debug, thiserror::Error)]
pub enum ExportPrivateKeyPemError {
  #[error(transparent)]
  AsymmetricPublicKeyDer(#[from] AsymmetricPrivateKeyDerError),
  #[error("very large data")]
  VeryLargeData,
  #[error(transparent)]
  Der(#[from] der::Error),
}

#[op2]
#[string]
pub fn op_node_export_private_key_pem(
  #[cppgc] handle: &KeyObjectHandle,
  #[string] typ: &str,
) -> Result<String, ExportPrivateKeyPemError> {
  let private_key = handle
    .as_private_key()
    .ok_or(AsymmetricPrivateKeyDerError::KeyIsNotAsymmetricPrivateKey)?;
  let data = private_key.export_der(typ)?;

  let label = match typ {
    "pkcs1" => "RSA PRIVATE KEY",
    "pkcs8" => "PRIVATE KEY",
    "sec1" => "EC PRIVATE KEY",
    _ => unreachable!("export_der would have errored"),
  };

  let pem_len = der::pem::encapsulated_len(label, LineEnding::LF, data.len())
    .map_err(|_| ExportPrivateKeyPemError::VeryLargeData)?;
  let mut out = vec![0; pem_len];
  let mut writer = PemWriter::new(label, LineEnding::LF, &mut out)?;
  writer.write(&data)?;
  let len = writer.finish()?;
  out.truncate(len);

  Ok(String::from_utf8(out).expect("invalid pem is not possible"))
}

#[op2]
#[buffer]
pub fn op_node_export_private_key_der(
  #[cppgc] handle: &KeyObjectHandle,
  #[string] typ: &str,
) -> Result<Box<[u8]>, AsymmetricPrivateKeyDerError> {
  let private_key = handle
    .as_private_key()
    .ok_or(AsymmetricPrivateKeyDerError::KeyIsNotAsymmetricPrivateKey)?;
  private_key.export_der(typ)
}

#[op2]
#[string]
pub fn op_node_key_type(#[cppgc] handle: &KeyObjectHandle) -> &'static str {
  match handle {
    KeyObjectHandle::AsymmetricPrivate(_) => "private",
    KeyObjectHandle::AsymmetricPublic(_) => "public",
    KeyObjectHandle::Secret(_) => "secret",
  }
}

#[op2]
#[cppgc]
pub fn op_node_derive_public_key_from_private_key(
  #[cppgc] handle: &KeyObjectHandle,
) -> Result<KeyObjectHandle, deno_core::error::AnyError> {
  let Some(private_key) = handle.as_private_key() else {
    return Err(type_error("expected private key"));
  };

  Ok(KeyObjectHandle::AsymmetricPublic(
    private_key.to_public_key(),
  ))
}
