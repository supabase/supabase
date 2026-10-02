// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use base64::prelude::BASE64_URL_SAFE_NO_PAD;
use base64::Engine;
use deno_core::op2;
use deno_core::ToJsBuffer;
use elliptic_curve::pkcs8::PrivateKeyInfo;
use rand::rngs::OsRng;
use rand::RngCore;
use ring::signature::Ed25519KeyPair;
use ring::signature::KeyPair;
use spki::der::asn1::BitString;
use spki::der::Decode;
use spki::der::Encode;

#[derive(Debug, thiserror::Error)]
pub enum Ed25519Error {
  #[error("Failed to export key")]
  FailedExport,
  #[error(transparent)]
  Der(#[from] rsa::pkcs1::der::Error),
  #[error(transparent)]
  KeyRejected(#[from] ring::error::KeyRejected),
}

#[op2(fast)]
pub fn op_crypto_generate_ed25519_keypair(
  #[buffer] pkey: &mut [u8],
  #[buffer] pubkey: &mut [u8],
) -> bool {
  let mut rng = OsRng;
  rng.fill_bytes(pkey);

  let pair = match Ed25519KeyPair::from_seed_unchecked(pkey) {
    Ok(p) => p,
    Err(_) => return false,
  };
  pubkey.copy_from_slice(pair.public_key().as_ref());
  true
}

#[op2(fast)]
pub fn op_crypto_sign_ed25519(
  #[buffer] key: &[u8],
  #[buffer] data: &[u8],
  #[buffer] signature: &mut [u8],
) -> bool {
  let pair = match Ed25519KeyPair::from_seed_unchecked(key) {
    Ok(p) => p,
    Err(_) => return false,
  };
  signature.copy_from_slice(pair.sign(data).as_ref());
  true
}

#[op2(fast)]
pub fn op_crypto_verify_ed25519(
  #[buffer] pubkey: &[u8],
  #[buffer] data: &[u8],
  #[buffer] signature: &[u8],
) -> bool {
  ring::signature::UnparsedPublicKey::new(&ring::signature::ED25519, pubkey)
    .verify(data, signature)
    .is_ok()
}

// id-Ed25519 OBJECT IDENTIFIER ::= { 1 3 101 112 }
pub const ED25519_OID: const_oid::ObjectIdentifier =
  const_oid::ObjectIdentifier::new_unwrap("1.3.101.112");

#[op2(fast)]
pub fn op_crypto_import_spki_ed25519(
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
  if alg != ED25519_OID {
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
pub fn op_crypto_import_pkcs8_ed25519(
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
  if alg != ED25519_OID {
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
pub fn op_crypto_export_spki_ed25519(
  #[buffer] pubkey: &[u8],
) -> Result<ToJsBuffer, Ed25519Error> {
  let key_info = spki::SubjectPublicKeyInfo {
    algorithm: spki::AlgorithmIdentifierOwned {
      // id-Ed25519
      oid: ED25519_OID,
      parameters: None,
    },
    subject_public_key: BitString::from_bytes(pubkey)?,
  };
  Ok(
    key_info
      .to_der()
      .map_err(|_| Ed25519Error::FailedExport)?
      .into(),
  )
}

#[op2]
#[serde]
pub fn op_crypto_export_pkcs8_ed25519(
  #[buffer] pkey: &[u8],
) -> Result<ToJsBuffer, Ed25519Error> {
  use rsa::pkcs1::der::Encode;

  // This should probably use OneAsymmetricKey instead
  let pk_info = rsa::pkcs8::PrivateKeyInfo {
    public_key: None,
    algorithm: rsa::pkcs8::AlgorithmIdentifierRef {
      // id-Ed25519
      oid: ED25519_OID,
      parameters: None,
    },
    private_key: pkey, // OCTET STRING
  };

  let mut buf = Vec::new();
  pk_info.encode_to_vec(&mut buf)?;
  Ok(buf.into())
}

// 'x' from Section 2 of RFC 8037
// https://www.rfc-editor.org/rfc/rfc8037#section-2
#[op2]
#[string]
pub fn op_crypto_jwk_x_ed25519(
  #[buffer] pkey: &[u8],
) -> Result<String, Ed25519Error> {
  let pair = Ed25519KeyPair::from_seed_unchecked(pkey)?;
  Ok(BASE64_URL_SAFE_NO_PAD.encode(pair.public_key().as_ref()))
}
