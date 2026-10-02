// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use curve25519_dalek::montgomery::MontgomeryPoint;
use deno_core::op2;
use deno_core::ToJsBuffer;
use elliptic_curve::pkcs8::PrivateKeyInfo;
use elliptic_curve::subtle::ConstantTimeEq;
use rand::rngs::OsRng;
use rand::RngCore;
use spki::der::asn1::BitString;
use spki::der::Decode;
use spki::der::Encode;

#[derive(Debug, thiserror::Error)]
pub enum X25519Error {
  #[error("Failed to export key")]
  FailedExport,
  #[error("Invalid key data")]
  InvalidKeyLength,
  #[error(transparent)]
  Der(#[from] spki::der::Error),
}

#[op2(fast)]
pub fn op_crypto_generate_x25519_keypair(
  #[buffer] pkey: &mut [u8],
  #[buffer] pubkey: &mut [u8],
) {
  // u-coordinate of the base point.
  const X25519_BASEPOINT_BYTES: [u8; 32] = [
    9, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
    0, 0, 0, 0, 0, 0, 0,
  ];
  let mut rng = OsRng;
  rng.fill_bytes(pkey);
  // https://www.rfc-editor.org/rfc/rfc7748#section-6.1
  // pubkey = x25519(a, 9) which is constant-time Montgomery ladder.
  //   https://eprint.iacr.org/2014/140.pdf page 4
  //   https://eprint.iacr.org/2017/212.pdf algorithm 8
  // pubkey is in LE order.
  let pkey: [u8; 32] = pkey.try_into().expect("Expected byteLength 32");
  pubkey.copy_from_slice(&x25519_dalek::x25519(pkey, X25519_BASEPOINT_BYTES));
}

const MONTGOMERY_IDENTITY: MontgomeryPoint = MontgomeryPoint([0; 32]);

#[op2(fast)]
pub fn op_crypto_derive_bits_x25519(
  #[buffer] k: &[u8],
  #[buffer] u: &[u8],
  #[buffer] secret: &mut [u8],
) -> Result<bool, X25519Error> {
  let k: [u8; 32] = k.try_into().map_err(|_| X25519Error::InvalidKeyLength)?;
  let u: [u8; 32] = u.try_into().map_err(|_| X25519Error::InvalidKeyLength)?;
  let sh_sec = x25519_dalek::x25519(k, u);
  let point = MontgomeryPoint(sh_sec);
  if point.ct_eq(&MONTGOMERY_IDENTITY).unwrap_u8() == 1 {
    return Ok(true);
  }
  secret.copy_from_slice(&sh_sec);
  Ok(false)
}

// id-X25519 OBJECT IDENTIFIER ::= { 1 3 101 110 }
pub const X25519_OID: const_oid::ObjectIdentifier =
  const_oid::ObjectIdentifier::new_unwrap("1.3.101.110");

#[op2(fast)]
pub fn op_crypto_import_spki_x25519(
  #[buffer] key_data: &[u8],
  #[buffer] out: &mut [u8],
) -> bool {
  // 2-3.
  let pk_info = match spki::SubjectPublicKeyInfoRef::try_from(key_data) {
    Ok(pk_info) => pk_info,
    Err(_) => return false,
  };
  // 4.
  let alg = pk_info.algorithm.oid;
  if alg != X25519_OID {
    return false;
  }
  // 5.
  if pk_info.algorithm.parameters.is_some() {
    return false;
  }
  out.copy_from_slice(pk_info.subject_public_key.raw_bytes());
  true
}

#[op2(fast)]
pub fn op_crypto_import_pkcs8_x25519(
  #[buffer] key_data: &[u8],
  #[buffer] out: &mut [u8],
) -> bool {
  // 2-3.
  // This should probably use OneAsymmetricKey instead
  let pk_info = match PrivateKeyInfo::from_der(key_data) {
    Ok(pk_info) => pk_info,
    Err(_) => return false,
  };
  // 4.
  let alg = pk_info.algorithm.oid;
  if alg != X25519_OID {
    return false;
  }
  // 5.
  if pk_info.algorithm.parameters.is_some() {
    return false;
  }
  // 6.
  // CurvePrivateKey ::= OCTET STRING
  if pk_info.private_key.len() != 34 {
    return false;
  }
  out.copy_from_slice(&pk_info.private_key[2..]);
  true
}

#[op2]
#[serde]
pub fn op_crypto_export_spki_x25519(
  #[buffer] pubkey: &[u8],
) -> Result<ToJsBuffer, X25519Error> {
  let key_info = spki::SubjectPublicKeyInfo {
    algorithm: spki::AlgorithmIdentifierRef {
      // id-X25519
      oid: X25519_OID,
      parameters: None,
    },
    subject_public_key: BitString::from_bytes(pubkey)?,
  };
  Ok(
    key_info
      .to_der()
      .map_err(|_| X25519Error::FailedExport)?
      .into(),
  )
}

#[op2]
#[serde]
pub fn op_crypto_export_pkcs8_x25519(
  #[buffer] pkey: &[u8],
) -> Result<ToJsBuffer, X25519Error> {
  use rsa::pkcs1::der::Encode;

  // This should probably use OneAsymmetricKey instead
  let pk_info = rsa::pkcs8::PrivateKeyInfo {
    public_key: None,
    algorithm: rsa::pkcs8::AlgorithmIdentifierRef {
      // id-X25519
      oid: X25519_OID,
      parameters: None,
    },
    private_key: pkey, // OCTET STRING
  };

  let mut buf = Vec::new();
  pk_info.encode_to_vec(&mut buf)?;
  Ok(buf.into())
}
