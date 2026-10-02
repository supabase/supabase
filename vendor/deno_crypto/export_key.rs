// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use base64::prelude::BASE64_URL_SAFE_NO_PAD;
use base64::Engine;
use const_oid::AssociatedOid;
use const_oid::ObjectIdentifier;
use deno_core::op2;
use deno_core::ToJsBuffer;
use elliptic_curve::sec1::ToEncodedPoint;
use p256::pkcs8::DecodePrivateKey;
use rsa::pkcs1::der::Decode;
use rsa::pkcs8::der::asn1::UintRef;
use rsa::pkcs8::der::Encode;
use serde::Deserialize;
use serde::Serialize;
use spki::der::asn1;
use spki::der::asn1::BitString;
use spki::AlgorithmIdentifier;
use spki::AlgorithmIdentifierOwned;

use crate::shared::*;

#[derive(Debug, thiserror::Error)]
pub enum ExportKeyError {
  #[error(transparent)]
  General(#[from] SharedError),
  #[error(transparent)]
  Der(#[from] spki::der::Error),
  #[error("Unsupported named curve")]
  UnsupportedNamedCurve,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ExportKeyOptions {
  format: ExportKeyFormat,
  #[serde(flatten)]
  algorithm: ExportKeyAlgorithm,
}

#[derive(Deserialize)]
#[serde(rename_all = "lowercase")]
pub enum ExportKeyFormat {
  Raw,
  Pkcs8,
  Spki,
  JwkPublic,
  JwkPrivate,
  JwkSecret,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", tag = "algorithm")]
pub enum ExportKeyAlgorithm {
  #[serde(rename = "RSASSA-PKCS1-v1_5")]
  RsassaPkcs1v15 {},
  #[serde(rename = "RSA-PSS")]
  RsaPss {},
  #[serde(rename = "RSA-OAEP")]
  RsaOaep {},
  #[serde(rename = "ECDSA", rename_all = "camelCase")]
  Ecdsa { named_curve: EcNamedCurve },
  #[serde(rename = "ECDH", rename_all = "camelCase")]
  Ecdh { named_curve: EcNamedCurve },
  #[serde(rename = "AES")]
  Aes {},
  #[serde(rename = "HMAC")]
  Hmac {},
}

#[derive(Serialize)]
#[serde(untagged)]
pub enum ExportKeyResult {
  Raw(ToJsBuffer),
  Pkcs8(ToJsBuffer),
  Spki(ToJsBuffer),
  JwkSecret {
    k: String,
  },
  JwkPublicRsa {
    n: String,
    e: String,
  },
  JwkPrivateRsa {
    n: String,
    e: String,
    d: String,
    p: String,
    q: String,
    dp: String,
    dq: String,
    qi: String,
  },
  JwkPublicEc {
    x: String,
    y: String,
  },
  JwkPrivateEc {
    x: String,
    y: String,
    d: String,
  },
}

#[op2]
#[serde]
pub fn op_crypto_export_key(
  #[serde] opts: ExportKeyOptions,
  #[serde] key_data: V8RawKeyData,
) -> Result<ExportKeyResult, ExportKeyError> {
  match opts.algorithm {
    ExportKeyAlgorithm::RsassaPkcs1v15 {}
    | ExportKeyAlgorithm::RsaPss {}
    | ExportKeyAlgorithm::RsaOaep {} => export_key_rsa(opts.format, key_data),
    ExportKeyAlgorithm::Ecdh { named_curve }
    | ExportKeyAlgorithm::Ecdsa { named_curve } => {
      export_key_ec(opts.format, key_data, opts.algorithm, named_curve)
    }
    ExportKeyAlgorithm::Aes {} | ExportKeyAlgorithm::Hmac {} => {
      export_key_symmetric(opts.format, key_data)
    }
  }
}

fn uint_to_b64(bytes: UintRef) -> String {
  BASE64_URL_SAFE_NO_PAD.encode(bytes.as_bytes())
}

fn bytes_to_b64(bytes: &[u8]) -> String {
  BASE64_URL_SAFE_NO_PAD.encode(bytes)
}

fn export_key_rsa(
  format: ExportKeyFormat,
  key_data: V8RawKeyData,
) -> Result<ExportKeyResult, ExportKeyError> {
  match format {
    ExportKeyFormat::Spki => {
      let subject_public_key = &key_data.as_rsa_public_key()?;

      // the SPKI structure
      let key_info = spki::SubjectPublicKeyInfo {
        algorithm: spki::AlgorithmIdentifier {
          // rsaEncryption(1)
          oid: const_oid::ObjectIdentifier::new_unwrap("1.2.840.113549.1.1.1"),
          // parameters field should not be omitted (None).
          // It MUST have ASN.1 type NULL.
          parameters: Some(asn1::AnyRef::from(asn1::Null)),
        },
        subject_public_key: BitString::from_bytes(subject_public_key).unwrap(),
      };

      // Infallible because we know the public key is valid.
      let spki_der = key_info.to_der().unwrap();
      Ok(ExportKeyResult::Spki(spki_der.into()))
    }
    ExportKeyFormat::Pkcs8 => {
      let private_key = key_data.as_rsa_private_key()?;

      // the PKCS#8 v1 structure
      // PrivateKeyInfo ::= SEQUENCE {
      //   version                   Version,
      //   privateKeyAlgorithm       PrivateKeyAlgorithmIdentifier,
      //   privateKey                PrivateKey,
      //   attributes           [0]  IMPLICIT Attributes OPTIONAL }

      // version is 0 when publickey is None

      let pk_info = rsa::pkcs8::PrivateKeyInfo {
        public_key: None,
        algorithm: rsa::pkcs8::AlgorithmIdentifierRef {
          // rsaEncryption(1)
          oid: rsa::pkcs8::ObjectIdentifier::new_unwrap("1.2.840.113549.1.1.1"),
          // parameters field should not be omitted (None).
          // It MUST have ASN.1 type NULL as per defined in RFC 3279 Section 2.3.1
          parameters: Some(rsa::pkcs8::der::asn1::AnyRef::from(
            rsa::pkcs8::der::asn1::Null,
          )),
        },
        private_key,
      };

      // Infallible because we know the private key is valid.
      let mut pkcs8_der = Vec::new();
      pk_info.encode_to_vec(&mut pkcs8_der)?;

      Ok(ExportKeyResult::Pkcs8(pkcs8_der.into()))
    }
    ExportKeyFormat::JwkPublic => {
      let public_key = key_data.as_rsa_public_key()?;
      let public_key = rsa::pkcs1::RsaPublicKey::from_der(&public_key)
        .map_err(|_| SharedError::FailedDecodePublicKey)?;

      Ok(ExportKeyResult::JwkPublicRsa {
        n: uint_to_b64(public_key.modulus),
        e: uint_to_b64(public_key.public_exponent),
      })
    }
    ExportKeyFormat::JwkPrivate => {
      let private_key = key_data.as_rsa_private_key()?;
      let private_key = rsa::pkcs1::RsaPrivateKey::from_der(private_key)
        .map_err(|_| SharedError::FailedDecodePrivateKey)?;

      Ok(ExportKeyResult::JwkPrivateRsa {
        n: uint_to_b64(private_key.modulus),
        e: uint_to_b64(private_key.public_exponent),
        d: uint_to_b64(private_key.private_exponent),
        p: uint_to_b64(private_key.prime1),
        q: uint_to_b64(private_key.prime2),
        dp: uint_to_b64(private_key.exponent1),
        dq: uint_to_b64(private_key.exponent2),
        qi: uint_to_b64(private_key.coefficient),
      })
    }
    _ => Err(SharedError::UnsupportedFormat.into()),
  }
}

fn export_key_symmetric(
  format: ExportKeyFormat,
  key_data: V8RawKeyData,
) -> Result<ExportKeyResult, ExportKeyError> {
  match format {
    ExportKeyFormat::JwkSecret => {
      let bytes = key_data.as_secret_key()?;

      Ok(ExportKeyResult::JwkSecret {
        k: bytes_to_b64(bytes),
      })
    }
    _ => Err(SharedError::UnsupportedFormat.into()),
  }
}

fn export_key_ec(
  format: ExportKeyFormat,
  key_data: V8RawKeyData,
  algorithm: ExportKeyAlgorithm,
  named_curve: EcNamedCurve,
) -> Result<ExportKeyResult, ExportKeyError> {
  match format {
    ExportKeyFormat::Raw => {
      let subject_public_key = match named_curve {
        EcNamedCurve::P256 => {
          let point = key_data.as_ec_public_key_p256()?;

          point.as_ref().to_vec()
        }
        EcNamedCurve::P384 => {
          let point = key_data.as_ec_public_key_p384()?;

          point.as_ref().to_vec()
        }
        EcNamedCurve::P521 => {
          let point = key_data.as_ec_public_key_p521()?;

          point.as_ref().to_vec()
        }
      };
      Ok(ExportKeyResult::Raw(subject_public_key.into()))
    }
    ExportKeyFormat::Spki => {
      let subject_public_key = match named_curve {
        EcNamedCurve::P256 => {
          let point = key_data.as_ec_public_key_p256()?;

          point.as_ref().to_vec()
        }
        EcNamedCurve::P384 => {
          let point = key_data.as_ec_public_key_p384()?;

          point.as_ref().to_vec()
        }
        EcNamedCurve::P521 => {
          let point = key_data.as_ec_public_key_p521()?;

          point.as_ref().to_vec()
        }
      };

      let alg_id = match named_curve {
        EcNamedCurve::P256 => AlgorithmIdentifierOwned {
          oid: elliptic_curve::ALGORITHM_OID,
          parameters: Some((&p256::NistP256::OID).into()),
        },
        EcNamedCurve::P384 => AlgorithmIdentifierOwned {
          oid: elliptic_curve::ALGORITHM_OID,
          parameters: Some((&p384::NistP384::OID).into()),
        },
        EcNamedCurve::P521 => AlgorithmIdentifierOwned {
          oid: elliptic_curve::ALGORITHM_OID,
          parameters: Some((&p521::NistP521::OID).into()),
        },
      };

      let alg_id = match algorithm {
        ExportKeyAlgorithm::Ecdh { .. } => AlgorithmIdentifier {
          oid: ObjectIdentifier::new_unwrap("1.2.840.10045.2.1"),
          parameters: alg_id.parameters,
        },
        _ => alg_id,
      };

      // the SPKI structure
      let key_info = spki::SubjectPublicKeyInfo {
        algorithm: alg_id,
        subject_public_key: BitString::from_bytes(&subject_public_key).unwrap(),
      };

      let spki_der = key_info.to_der().unwrap();

      Ok(ExportKeyResult::Spki(spki_der.into()))
    }
    ExportKeyFormat::Pkcs8 => {
      // private_key is a PKCS#8 DER-encoded private key
      let private_key = key_data.as_ec_private_key()?;

      Ok(ExportKeyResult::Pkcs8(private_key.to_vec().into()))
    }
    ExportKeyFormat::JwkPublic => match named_curve {
      EcNamedCurve::P256 => {
        let point = key_data.as_ec_public_key_p256()?;
        let coords = point.coordinates();

        if let p256::elliptic_curve::sec1::Coordinates::Uncompressed { x, y } =
          coords
        {
          Ok(ExportKeyResult::JwkPublicEc {
            x: bytes_to_b64(x),
            y: bytes_to_b64(y),
          })
        } else {
          Err(SharedError::FailedDecodePublicKey.into())
        }
      }
      EcNamedCurve::P384 => {
        let point = key_data.as_ec_public_key_p384()?;
        let coords = point.coordinates();

        if let p384::elliptic_curve::sec1::Coordinates::Uncompressed { x, y } =
          coords
        {
          Ok(ExportKeyResult::JwkPublicEc {
            x: bytes_to_b64(x),
            y: bytes_to_b64(y),
          })
        } else {
          Err(SharedError::FailedDecodePublicKey.into())
        }
      }
      EcNamedCurve::P521 => {
        let point = key_data.as_ec_public_key_p521()?;
        let coords = point.coordinates();

        if let p521::elliptic_curve::sec1::Coordinates::Uncompressed { x, y } =
          coords
        {
          Ok(ExportKeyResult::JwkPublicEc {
            x: bytes_to_b64(x),
            y: bytes_to_b64(y),
          })
        } else {
          Err(SharedError::FailedDecodePublicKey.into())
        }
      }
    },
    ExportKeyFormat::JwkPrivate => {
      let private_key = key_data.as_ec_private_key()?;

      match named_curve {
        EcNamedCurve::P256 => {
          let ec_key = p256::SecretKey::from_pkcs8_der(private_key)
            .map_err(|_| SharedError::FailedDecodePrivateKey)?;

          let point = ec_key.public_key().to_encoded_point(false);
          if let elliptic_curve::sec1::Coordinates::Uncompressed { x, y } =
            point.coordinates()
          {
            Ok(ExportKeyResult::JwkPrivateEc {
              x: bytes_to_b64(x),
              y: bytes_to_b64(y),
              d: bytes_to_b64(&ec_key.to_bytes()),
            })
          } else {
            Err(SharedError::ExpectedValidPublicECKey.into())
          }
        }

        EcNamedCurve::P384 => {
          let ec_key = p384::SecretKey::from_pkcs8_der(private_key)
            .map_err(|_| SharedError::FailedDecodePrivateKey)?;

          let point = ec_key.public_key().to_encoded_point(false);
          if let elliptic_curve::sec1::Coordinates::Uncompressed { x, y } =
            point.coordinates()
          {
            Ok(ExportKeyResult::JwkPrivateEc {
              x: bytes_to_b64(x),
              y: bytes_to_b64(y),
              d: bytes_to_b64(&ec_key.to_bytes()),
            })
          } else {
            Err(SharedError::ExpectedValidPublicECKey.into())
          }
        }
        _ => Err(ExportKeyError::UnsupportedNamedCurve),
      }
    }
    ExportKeyFormat::JwkSecret => Err(SharedError::UnsupportedFormat.into()),
  }
}
