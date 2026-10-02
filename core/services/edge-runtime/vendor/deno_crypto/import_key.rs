// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use base64::Engine;
use deno_core::op2;
use deno_core::JsBuffer;
use deno_core::ToJsBuffer;
use elliptic_curve::pkcs8::PrivateKeyInfo;
use p256::pkcs8::EncodePrivateKey;
use rsa::pkcs1::UintRef;
use rsa::pkcs8::der::Encode;
use serde::Deserialize;
use serde::Serialize;
use spki::der::Decode;

use crate::shared::*;

#[derive(Debug, thiserror::Error)]
pub enum ImportKeyError {
  #[error(transparent)]
  General(#[from] SharedError),
  #[error("invalid modulus")]
  InvalidModulus,
  #[error("invalid public exponent")]
  InvalidPublicExponent,
  #[error("invalid private exponent")]
  InvalidPrivateExponent,
  #[error("invalid first prime factor")]
  InvalidFirstPrimeFactor,
  #[error("invalid second prime factor")]
  InvalidSecondPrimeFactor,
  #[error("invalid first CRT exponent")]
  InvalidFirstCRTExponent,
  #[error("invalid second CRT exponent")]
  InvalidSecondCRTExponent,
  #[error("invalid CRT coefficient")]
  InvalidCRTCoefficient,
  #[error("invalid b64 coordinate")]
  InvalidB64Coordinate,
  #[error("invalid RSA public key")]
  InvalidRSAPublicKey,
  #[error("invalid RSA private key")]
  InvalidRSAPrivateKey,
  #[error("unsupported algorithm")]
  UnsupportedAlgorithm,
  #[error("public key is invalid (too long)")]
  PublicKeyTooLong,
  #[error("private key is invalid (too long)")]
  PrivateKeyTooLong,
  #[error("invalid P-256 elliptic curve point")]
  InvalidP256ECPoint,
  #[error("invalid P-384 elliptic curve point")]
  InvalidP384ECPoint,
  #[error("invalid P-521 elliptic curve point")]
  InvalidP521ECPoint,
  #[error("invalid P-256 elliptic curve SPKI data")]
  InvalidP256ECSPKIData,
  #[error("invalid P-384 elliptic curve SPKI data")]
  InvalidP384ECSPKIData,
  #[error("invalid P-521 elliptic curve SPKI data")]
  InvalidP521ECSPKIData,
  #[error("curve mismatch")]
  CurveMismatch,
  #[error("Unsupported named curve")]
  UnsupportedNamedCurve,
  #[error("invalid key data")]
  InvalidKeyData,
  #[error("invalid JWK private key")]
  InvalidJWKPrivateKey,
  #[error(transparent)]
  EllipticCurve(#[from] elliptic_curve::Error),
  #[error("expected valid PKCS#8 data")]
  ExpectedValidPkcs8Data,
  #[error("malformed parameters")]
  MalformedParameters,
  #[error(transparent)]
  Spki(#[from] spki::Error),
  #[error(transparent)]
  Der(#[from] rsa::pkcs1::der::Error),
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub enum KeyData {
  Spki(JsBuffer),
  Pkcs8(JsBuffer),
  Raw(JsBuffer),
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
    #[allow(dead_code)]
    x: String,
    #[allow(dead_code)]
    y: String,
    d: String,
  },
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", tag = "algorithm")]
pub enum ImportKeyOptions {
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
  #[serde(rename = "AES", rename_all = "camelCase")]
  Aes {},
  #[serde(rename = "HMAC", rename_all = "camelCase")]
  Hmac {},
}

#[derive(Serialize)]
#[serde(untagged)]
pub enum ImportKeyResult {
  #[serde(rename_all = "camelCase")]
  Rsa {
    raw_data: RustRawKeyData,
    modulus_length: usize,
    public_exponent: ToJsBuffer,
  },
  #[serde(rename_all = "camelCase")]
  Ec { raw_data: RustRawKeyData },
  #[serde(rename_all = "camelCase")]
  #[allow(dead_code)]
  Aes { raw_data: RustRawKeyData },
  #[serde(rename_all = "camelCase")]
  Hmac { raw_data: RustRawKeyData },
}

#[op2]
#[serde]
pub fn op_crypto_import_key(
  #[serde] opts: ImportKeyOptions,
  #[serde] key_data: KeyData,
) -> Result<ImportKeyResult, ImportKeyError> {
  match opts {
    ImportKeyOptions::RsassaPkcs1v15 {} => import_key_rsassa(key_data),
    ImportKeyOptions::RsaPss {} => import_key_rsapss(key_data),
    ImportKeyOptions::RsaOaep {} => import_key_rsaoaep(key_data),
    ImportKeyOptions::Ecdsa { named_curve }
    | ImportKeyOptions::Ecdh { named_curve } => {
      import_key_ec(key_data, named_curve)
    }
    ImportKeyOptions::Aes {} => import_key_aes(key_data),
    ImportKeyOptions::Hmac {} => import_key_hmac(key_data),
  }
}

const BASE64_URL_SAFE_FORGIVING:
  base64::engine::general_purpose::GeneralPurpose =
  base64::engine::general_purpose::GeneralPurpose::new(
    &base64::alphabet::URL_SAFE,
    base64::engine::general_purpose::GeneralPurposeConfig::new()
      .with_decode_allow_trailing_bits(true)
      .with_decode_padding_mode(base64::engine::DecodePaddingMode::Indifferent),
  );

macro_rules! jwt_b64_int_or_err {
  ($name:ident, $b64:expr, $err:tt) => {
    let bytes = BASE64_URL_SAFE_FORGIVING
      .decode($b64)
      .map_err(|_| ImportKeyError::$err)?;
    let $name = UintRef::new(&bytes).map_err(|_| ImportKeyError::$err)?;
  };
}

fn import_key_rsa_jwk(
  key_data: KeyData,
) -> Result<ImportKeyResult, ImportKeyError> {
  match key_data {
    KeyData::JwkPublicRsa { n, e } => {
      jwt_b64_int_or_err!(modulus, &n, InvalidModulus);
      jwt_b64_int_or_err!(public_exponent, &e, InvalidPublicExponent);

      let public_key = rsa::pkcs1::RsaPublicKey {
        modulus,
        public_exponent,
      };

      let mut data = Vec::new();
      public_key
        .encode_to_vec(&mut data)
        .map_err(|_| ImportKeyError::InvalidRSAPublicKey)?;

      let public_exponent =
        public_key.public_exponent.as_bytes().to_vec().into();
      let modulus_length = public_key.modulus.as_bytes().len() * 8;

      Ok(ImportKeyResult::Rsa {
        raw_data: RustRawKeyData::Public(data.into()),
        modulus_length,
        public_exponent,
      })
    }
    KeyData::JwkPrivateRsa {
      n,
      e,
      d,
      p,
      q,
      dp,
      dq,
      qi,
    } => {
      jwt_b64_int_or_err!(modulus, &n, InvalidModulus);
      jwt_b64_int_or_err!(public_exponent, &e, InvalidPublicExponent);
      jwt_b64_int_or_err!(private_exponent, &d, InvalidPrivateExponent);
      jwt_b64_int_or_err!(prime1, &p, InvalidFirstPrimeFactor);
      jwt_b64_int_or_err!(prime2, &q, InvalidSecondPrimeFactor);
      jwt_b64_int_or_err!(exponent1, &dp, InvalidFirstCRTExponent);
      jwt_b64_int_or_err!(exponent2, &dq, InvalidSecondCRTExponent);
      jwt_b64_int_or_err!(coefficient, &qi, InvalidCRTCoefficient);

      let private_key = rsa::pkcs1::RsaPrivateKey {
        modulus,
        public_exponent,
        private_exponent,
        prime1,
        prime2,
        exponent1,
        exponent2,
        coefficient,
        other_prime_infos: None,
      };

      let mut data = Vec::new();
      private_key
        .encode_to_vec(&mut data)
        .map_err(|_| ImportKeyError::InvalidRSAPrivateKey)?;

      let public_exponent =
        private_key.public_exponent.as_bytes().to_vec().into();
      let modulus_length = private_key.modulus.as_bytes().len() * 8;

      Ok(ImportKeyResult::Rsa {
        raw_data: RustRawKeyData::Private(data.into()),
        modulus_length,
        public_exponent,
      })
    }
    _ => unreachable!(),
  }
}

fn import_key_rsassa(
  key_data: KeyData,
) -> Result<ImportKeyResult, ImportKeyError> {
  match key_data {
    KeyData::Spki(data) => {
      // 2-3.
      let pk_info = spki::SubjectPublicKeyInfoRef::try_from(&*data)?;

      // 4-5.
      let alg = pk_info.algorithm.oid;

      // 6-7. (skipped, only support rsaEncryption for interoperability)
      if alg != RSA_ENCRYPTION_OID {
        return Err(ImportKeyError::UnsupportedAlgorithm);
      }

      // 8-9.
      let public_key = rsa::pkcs1::RsaPublicKey::from_der(
        pk_info.subject_public_key.raw_bytes(),
      )?;

      let bytes_consumed = public_key.encoded_len()?;

      if bytes_consumed
        != rsa::pkcs1::der::Length::new(
          pk_info.subject_public_key.raw_bytes().len() as u16,
        )
      {
        return Err(ImportKeyError::PublicKeyTooLong);
      }

      let data = pk_info.subject_public_key.raw_bytes().to_vec().into();
      let public_exponent =
        public_key.public_exponent.as_bytes().to_vec().into();
      let modulus_length = public_key.modulus.as_bytes().len() * 8;

      Ok(ImportKeyResult::Rsa {
        raw_data: RustRawKeyData::Public(data),
        modulus_length,
        public_exponent,
      })
    }
    KeyData::Pkcs8(data) => {
      // 2-3.
      let pk_info = PrivateKeyInfo::from_der(&data)?;

      // 4-5.
      let alg = pk_info.algorithm.oid;

      // 6-7. (skipped, only support rsaEncryption for interoperability)
      if alg != RSA_ENCRYPTION_OID {
        return Err(ImportKeyError::UnsupportedAlgorithm);
      }

      // 8-9.
      let private_key =
        rsa::pkcs1::RsaPrivateKey::from_der(pk_info.private_key)?;

      let bytes_consumed = private_key.encoded_len()?;

      if bytes_consumed
        != rsa::pkcs1::der::Length::new(pk_info.private_key.len() as u16)
      {
        return Err(ImportKeyError::PrivateKeyTooLong);
      }

      let data = pk_info.private_key.to_vec().into();
      let public_exponent =
        private_key.public_exponent.as_bytes().to_vec().into();
      let modulus_length = private_key.modulus.as_bytes().len() * 8;

      Ok(ImportKeyResult::Rsa {
        raw_data: RustRawKeyData::Private(data),
        modulus_length,
        public_exponent,
      })
    }
    KeyData::JwkPublicRsa { .. } | KeyData::JwkPrivateRsa { .. } => {
      import_key_rsa_jwk(key_data)
    }
    _ => Err(SharedError::UnsupportedFormat.into()),
  }
}

fn import_key_rsapss(
  key_data: KeyData,
) -> Result<ImportKeyResult, ImportKeyError> {
  match key_data {
    KeyData::Spki(data) => {
      // 2-3.
      let pk_info = spki::SubjectPublicKeyInfoRef::try_from(&*data)?;

      // 4-5.
      let alg = pk_info.algorithm.oid;

      // 6-7. (skipped, only support rsaEncryption for interoperability)
      if alg != RSA_ENCRYPTION_OID {
        return Err(ImportKeyError::UnsupportedAlgorithm);
      }

      // 8-9.
      let public_key = rsa::pkcs1::RsaPublicKey::from_der(
        pk_info.subject_public_key.raw_bytes(),
      )?;

      let bytes_consumed = public_key.encoded_len()?;

      if bytes_consumed
        != rsa::pkcs1::der::Length::new(
          pk_info.subject_public_key.raw_bytes().len() as u16,
        )
      {
        return Err(ImportKeyError::PublicKeyTooLong);
      }

      let data = pk_info.subject_public_key.raw_bytes().to_vec().into();
      let public_exponent =
        public_key.public_exponent.as_bytes().to_vec().into();
      let modulus_length = public_key.modulus.as_bytes().len() * 8;

      Ok(ImportKeyResult::Rsa {
        raw_data: RustRawKeyData::Public(data),
        modulus_length,
        public_exponent,
      })
    }
    KeyData::Pkcs8(data) => {
      // 2-3.
      let pk_info = PrivateKeyInfo::from_der(&data)?;

      // 4-5.
      let alg = pk_info.algorithm.oid;

      // 6-7. (skipped, only support rsaEncryption for interoperability)
      if alg != RSA_ENCRYPTION_OID {
        return Err(ImportKeyError::UnsupportedAlgorithm);
      }

      // 8-9.
      let private_key =
        rsa::pkcs1::RsaPrivateKey::from_der(pk_info.private_key)?;

      let bytes_consumed = private_key.encoded_len()?;

      if bytes_consumed
        != rsa::pkcs1::der::Length::new(pk_info.private_key.len() as u16)
      {
        return Err(ImportKeyError::PrivateKeyTooLong);
      }

      let data = pk_info.private_key.to_vec().into();
      let public_exponent =
        private_key.public_exponent.as_bytes().to_vec().into();
      let modulus_length = private_key.modulus.as_bytes().len() * 8;

      Ok(ImportKeyResult::Rsa {
        raw_data: RustRawKeyData::Private(data),
        modulus_length,
        public_exponent,
      })
    }
    KeyData::JwkPublicRsa { .. } | KeyData::JwkPrivateRsa { .. } => {
      import_key_rsa_jwk(key_data)
    }
    _ => Err(SharedError::UnsupportedFormat.into()),
  }
}

fn import_key_rsaoaep(
  key_data: KeyData,
) -> Result<ImportKeyResult, ImportKeyError> {
  match key_data {
    KeyData::Spki(data) => {
      // 2-3.
      let pk_info = spki::SubjectPublicKeyInfoRef::try_from(&*data)?;

      // 4-5.
      let alg = pk_info.algorithm.oid;

      // 6-7. (skipped, only support rsaEncryption for interoperability)
      if alg != RSA_ENCRYPTION_OID {
        return Err(ImportKeyError::UnsupportedAlgorithm);
      }

      // 8-9.
      let public_key = rsa::pkcs1::RsaPublicKey::from_der(
        pk_info.subject_public_key.raw_bytes(),
      )?;

      let bytes_consumed = public_key.encoded_len()?;

      if bytes_consumed
        != rsa::pkcs1::der::Length::new(
          pk_info.subject_public_key.raw_bytes().len() as u16,
        )
      {
        return Err(ImportKeyError::PublicKeyTooLong);
      }

      let data = pk_info.subject_public_key.raw_bytes().to_vec().into();
      let public_exponent =
        public_key.public_exponent.as_bytes().to_vec().into();
      let modulus_length = public_key.modulus.as_bytes().len() * 8;

      Ok(ImportKeyResult::Rsa {
        raw_data: RustRawKeyData::Public(data),
        modulus_length,
        public_exponent,
      })
    }
    KeyData::Pkcs8(data) => {
      // 2-3.
      let pk_info = PrivateKeyInfo::from_der(&data)?;

      // 4-5.
      let alg = pk_info.algorithm.oid;

      // 6-7. (skipped, only support rsaEncryption for interoperability)
      if alg != RSA_ENCRYPTION_OID {
        return Err(ImportKeyError::UnsupportedAlgorithm);
      }

      // 8-9.
      let private_key =
        rsa::pkcs1::RsaPrivateKey::from_der(pk_info.private_key)?;

      let bytes_consumed = private_key.encoded_len()?;

      if bytes_consumed
        != rsa::pkcs1::der::Length::new(pk_info.private_key.len() as u16)
      {
        return Err(ImportKeyError::PrivateKeyTooLong);
      }

      let data = pk_info.private_key.to_vec().into();
      let public_exponent =
        private_key.public_exponent.as_bytes().to_vec().into();
      let modulus_length = private_key.modulus.as_bytes().len() * 8;

      Ok(ImportKeyResult::Rsa {
        raw_data: RustRawKeyData::Private(data),
        modulus_length,
        public_exponent,
      })
    }
    KeyData::JwkPublicRsa { .. } | KeyData::JwkPrivateRsa { .. } => {
      import_key_rsa_jwk(key_data)
    }
    _ => Err(SharedError::UnsupportedFormat.into()),
  }
}

fn decode_b64url_to_field_bytes<C: elliptic_curve::Curve>(
  b64: &str,
) -> Result<elliptic_curve::FieldBytes<C>, ImportKeyError> {
  jwt_b64_int_or_err!(val, b64, InvalidB64Coordinate);

  let mut bytes = elliptic_curve::FieldBytes::<C>::default();
  let original_bytes = val.as_bytes();
  let mut new_bytes: Vec<u8> = vec![];
  if original_bytes.len() < bytes.len() {
    new_bytes = vec![0; bytes.len() - original_bytes.len()];
  }
  new_bytes.extend_from_slice(original_bytes);

  let val = new_bytes.as_slice();

  if val.len() != bytes.len() {
    return Err(ImportKeyError::InvalidB64Coordinate);
  }
  bytes.copy_from_slice(val);

  Ok(bytes)
}

fn import_key_ec_jwk_to_point(
  x: String,
  y: String,
  named_curve: EcNamedCurve,
) -> Result<Vec<u8>, ImportKeyError> {
  let point_bytes = match named_curve {
    EcNamedCurve::P256 => {
      let x = decode_b64url_to_field_bytes::<p256::NistP256>(&x)?;
      let y = decode_b64url_to_field_bytes::<p256::NistP256>(&y)?;

      p256::EncodedPoint::from_affine_coordinates(&x, &y, false).to_bytes()
    }
    EcNamedCurve::P384 => {
      let x = decode_b64url_to_field_bytes::<p384::NistP384>(&x)?;
      let y = decode_b64url_to_field_bytes::<p384::NistP384>(&y)?;

      p384::EncodedPoint::from_affine_coordinates(&x, &y, false).to_bytes()
    }
    EcNamedCurve::P521 => {
      let x = decode_b64url_to_field_bytes::<p521::NistP521>(&x)?;
      let y = decode_b64url_to_field_bytes::<p521::NistP521>(&y)?;

      p521::EncodedPoint::from_affine_coordinates(&x, &y, false).to_bytes()
    }
  };

  Ok(point_bytes.to_vec())
}

fn import_key_ec_jwk(
  key_data: KeyData,
  named_curve: EcNamedCurve,
) -> Result<ImportKeyResult, ImportKeyError> {
  match key_data {
    KeyData::JwkPublicEc { x, y } => {
      let point_bytes = import_key_ec_jwk_to_point(x, y, named_curve)?;

      Ok(ImportKeyResult::Ec {
        raw_data: RustRawKeyData::Public(point_bytes.into()),
      })
    }
    KeyData::JwkPrivateEc { d, .. } => {
      let pkcs8_der = match named_curve {
        EcNamedCurve::P256 => {
          let d = decode_b64url_to_field_bytes::<p256::NistP256>(&d)?;
          let pk = p256::SecretKey::from_bytes(&d)?;

          pk.to_pkcs8_der()
            .map_err(|_| ImportKeyError::InvalidJWKPrivateKey)?
        }
        EcNamedCurve::P384 => {
          let d = decode_b64url_to_field_bytes::<p384::NistP384>(&d)?;
          let pk = p384::SecretKey::from_bytes(&d)?;

          pk.to_pkcs8_der()
            .map_err(|_| ImportKeyError::InvalidJWKPrivateKey)?
        }
        EcNamedCurve::P521 => {
          let d = decode_b64url_to_field_bytes::<p521::NistP521>(&d)?;
          let pk = p521::SecretKey::from_bytes(&d)?;

          pk.to_pkcs8_der()
            .map_err(|_| ImportKeyError::InvalidJWKPrivateKey)?
        }
      };

      Ok(ImportKeyResult::Ec {
        raw_data: RustRawKeyData::Private(pkcs8_der.as_bytes().to_vec().into()),
      })
    }
    _ => unreachable!(),
  }
}

pub struct ECParametersSpki {
  pub named_curve_alg: spki::der::asn1::ObjectIdentifier,
}

impl<'a> TryFrom<spki::der::asn1::AnyRef<'a>> for ECParametersSpki {
  type Error = spki::der::Error;

  fn try_from(
    any: spki::der::asn1::AnyRef<'a>,
  ) -> spki::der::Result<ECParametersSpki> {
    let x = any.try_into()?;

    Ok(Self { named_curve_alg: x })
  }
}

fn import_key_ec(
  key_data: KeyData,
  named_curve: EcNamedCurve,
) -> Result<ImportKeyResult, ImportKeyError> {
  match key_data {
    KeyData::Raw(data) => {
      // The point is parsed and validated, ultimately the original data is
      // returned though.
      match named_curve {
        EcNamedCurve::P256 => {
          // 1-2.
          let point = p256::EncodedPoint::from_bytes(&data)
            .map_err(|_| ImportKeyError::InvalidP256ECPoint)?;
          // 3.
          if point.is_identity() {
            return Err(ImportKeyError::InvalidP256ECPoint);
          }
        }
        EcNamedCurve::P384 => {
          // 1-2.
          let point = p384::EncodedPoint::from_bytes(&data)
            .map_err(|_| ImportKeyError::InvalidP384ECPoint)?;
          // 3.
          if point.is_identity() {
            return Err(ImportKeyError::InvalidP384ECPoint);
          }
        }
        EcNamedCurve::P521 => {
          // 1-2.
          let point = p521::EncodedPoint::from_bytes(&data)
            .map_err(|_| ImportKeyError::InvalidP521ECPoint)?;
          // 3.
          if point.is_identity() {
            return Err(ImportKeyError::InvalidP521ECPoint);
          }
        }
      };
      Ok(ImportKeyResult::Ec {
        raw_data: RustRawKeyData::Public(data.to_vec().into()),
      })
    }
    KeyData::Pkcs8(data) => {
      let pk = PrivateKeyInfo::from_der(data.as_ref())
        .map_err(|_| ImportKeyError::ExpectedValidPkcs8Data)?;
      let named_curve_alg = pk
        .algorithm
        .parameters
        .ok_or(ImportKeyError::MalformedParameters)?
        .try_into()
        .map_err(|_| ImportKeyError::MalformedParameters)?;

      let pk_named_curve = match named_curve_alg {
        // id-secp256r1
        ID_SECP256R1_OID => Some(EcNamedCurve::P256),
        // id-secp384r1
        ID_SECP384R1_OID => Some(EcNamedCurve::P384),
        // id-secp521r1
        ID_SECP521R1_OID => Some(EcNamedCurve::P521),
        _ => None,
      };

      if pk_named_curve != Some(named_curve) {
        return Err(ImportKeyError::CurveMismatch);
      }

      Ok(ImportKeyResult::Ec {
        raw_data: RustRawKeyData::Private(data.to_vec().into()),
      })
    }
    KeyData::Spki(data) => {
      // 2-3.
      let pk_info = spki::SubjectPublicKeyInfoRef::try_from(&*data)?;

      // 4.
      let alg = pk_info.algorithm.oid;
      // id-ecPublicKey
      if alg != elliptic_curve::ALGORITHM_OID {
        return Err(ImportKeyError::UnsupportedAlgorithm);
      }

      // 5-7.
      let params = ECParametersSpki::try_from(
        pk_info
          .algorithm
          .parameters
          .ok_or(ImportKeyError::MalformedParameters)?,
      )
      .map_err(|_| ImportKeyError::MalformedParameters)?;

      // 8-9.
      let named_curve_alg = params.named_curve_alg;
      let pk_named_curve = match named_curve_alg {
        // id-secp256r1
        ID_SECP256R1_OID => Some(EcNamedCurve::P256),
        // id-secp384r1
        ID_SECP384R1_OID => Some(EcNamedCurve::P384),
        // id-secp521r1
        ID_SECP521R1_OID => Some(EcNamedCurve::P521),
        _ => None,
      };

      // 10.
      let encoded_key;

      if let Some(pk_named_curve) = pk_named_curve {
        let pk = pk_info.subject_public_key;

        encoded_key = pk.raw_bytes().to_vec();

        let bytes_consumed = match named_curve {
          EcNamedCurve::P256 => {
            let point = p256::EncodedPoint::from_bytes(&*encoded_key)
              .map_err(|_| ImportKeyError::InvalidP256ECSPKIData)?;
            if point.is_identity() {
              return Err(ImportKeyError::InvalidP256ECPoint);
            }

            point.as_bytes().len()
          }
          EcNamedCurve::P384 => {
            let point = p384::EncodedPoint::from_bytes(&*encoded_key)
              .map_err(|_| ImportKeyError::InvalidP384ECSPKIData)?;

            if point.is_identity() {
              return Err(ImportKeyError::InvalidP384ECPoint);
            }

            point.as_bytes().len()
          }
          EcNamedCurve::P521 => {
            let point = p521::EncodedPoint::from_bytes(&*encoded_key)
              .map_err(|_| ImportKeyError::InvalidP521ECSPKIData)?;

            if point.is_identity() {
              return Err(ImportKeyError::InvalidP521ECPoint);
            }

            point.as_bytes().len()
          }
        };

        if bytes_consumed != pk_info.subject_public_key.raw_bytes().len() {
          return Err(ImportKeyError::PublicKeyTooLong);
        }

        // 11.
        if named_curve != pk_named_curve {
          return Err(ImportKeyError::CurveMismatch);
        }
      } else {
        return Err(ImportKeyError::UnsupportedNamedCurve);
      }

      Ok(ImportKeyResult::Ec {
        raw_data: RustRawKeyData::Public(encoded_key.into()),
      })
    }
    KeyData::JwkPublicEc { .. } | KeyData::JwkPrivateEc { .. } => {
      import_key_ec_jwk(key_data, named_curve)
    }
    _ => Err(SharedError::UnsupportedFormat.into()),
  }
}

fn import_key_aes(
  key_data: KeyData,
) -> Result<ImportKeyResult, ImportKeyError> {
  Ok(match key_data {
    KeyData::JwkSecret { k } => {
      let data = BASE64_URL_SAFE_FORGIVING
        .decode(k)
        .map_err(|_| ImportKeyError::InvalidKeyData)?;
      ImportKeyResult::Hmac {
        raw_data: RustRawKeyData::Secret(data.into()),
      }
    }
    _ => return Err(SharedError::UnsupportedFormat.into()),
  })
}

fn import_key_hmac(
  key_data: KeyData,
) -> Result<ImportKeyResult, ImportKeyError> {
  Ok(match key_data {
    KeyData::JwkSecret { k } => {
      let data = BASE64_URL_SAFE_FORGIVING
        .decode(k)
        .map_err(|_| ImportKeyError::InvalidKeyData)?;
      ImportKeyResult::Hmac {
        raw_data: RustRawKeyData::Secret(data.into()),
      }
    }
    _ => return Err(SharedError::UnsupportedFormat.into()),
  })
}
