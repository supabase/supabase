// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use aes::cipher::block_padding::Pkcs7;
use aes::cipher::BlockEncryptMut;
use aes::cipher::KeyIvInit;
use aes::cipher::StreamCipher;
use aes_gcm::aead::generic_array::typenum::U12;
use aes_gcm::aead::generic_array::typenum::U16;
use aes_gcm::aead::generic_array::ArrayLength;
use aes_gcm::aes::Aes128;
use aes_gcm::aes::Aes192;
use aes_gcm::aes::Aes256;
use aes_gcm::AeadInPlace;
use aes_gcm::KeyInit;
use aes_gcm::Nonce;
use ctr::Ctr128BE;
use ctr::Ctr32BE;
use ctr::Ctr64BE;
use deno_core::op2;
use deno_core::unsync::spawn_blocking;
use deno_core::JsBuffer;
use deno_core::ToJsBuffer;
use rand::rngs::OsRng;
use rsa::pkcs1::DecodeRsaPublicKey;
use serde::Deserialize;
use sha1::Sha1;
use sha2::Sha256;
use sha2::Sha384;
use sha2::Sha512;

use crate::shared::*;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct EncryptOptions {
  key: V8RawKeyData,
  #[serde(flatten)]
  algorithm: EncryptAlgorithm,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", tag = "algorithm")]
pub enum EncryptAlgorithm {
  #[serde(rename = "RSA-OAEP")]
  RsaOaep {
    hash: ShaHash,
    #[serde(with = "serde_bytes")]
    label: Vec<u8>,
  },
  #[serde(rename = "AES-CBC", rename_all = "camelCase")]
  AesCbc {
    #[serde(with = "serde_bytes")]
    iv: Vec<u8>,
    length: usize,
  },
  #[serde(rename = "AES-GCM", rename_all = "camelCase")]
  AesGcm {
    #[serde(with = "serde_bytes")]
    iv: Vec<u8>,
    #[serde(with = "serde_bytes")]
    additional_data: Option<Vec<u8>>,
    length: usize,
    tag_length: usize,
  },
  #[serde(rename = "AES-CTR", rename_all = "camelCase")]
  AesCtr {
    #[serde(with = "serde_bytes")]
    counter: Vec<u8>,
    ctr_length: usize,
    key_length: usize,
  },
}

#[derive(Debug, thiserror::Error)]
pub enum EncryptError {
  #[error(transparent)]
  General(#[from] SharedError),
  #[error("invalid length")]
  InvalidLength,
  #[error("invalid key or iv")]
  InvalidKeyOrIv,
  #[error("iv length not equal to 12 or 16")]
  InvalidIvLength,
  #[error("invalid counter length. Currently supported 32/64/128 bits")]
  InvalidCounterLength,
  #[error("tried to encrypt too much data")]
  TooMuchData,
  #[error("Encryption failed")]
  Failed,
}

#[op2(async)]
#[serde]
pub async fn op_crypto_encrypt(
  #[serde] opts: EncryptOptions,
  #[buffer] data: JsBuffer,
) -> Result<ToJsBuffer, EncryptError> {
  let key = opts.key;
  let fun = move || match opts.algorithm {
    EncryptAlgorithm::RsaOaep { hash, label } => {
      encrypt_rsa_oaep(key, hash, label, &data)
    }
    EncryptAlgorithm::AesCbc { iv, length } => {
      encrypt_aes_cbc(key, length, iv, &data)
    }
    EncryptAlgorithm::AesGcm {
      iv,
      additional_data,
      length,
      tag_length,
    } => encrypt_aes_gcm(key, length, tag_length, iv, additional_data, &data),
    EncryptAlgorithm::AesCtr {
      counter,
      ctr_length,
      key_length,
    } => encrypt_aes_ctr(key, key_length, &counter, ctr_length, &data),
  };
  let buf = spawn_blocking(fun).await.unwrap()?;
  Ok(buf.into())
}

fn encrypt_rsa_oaep(
  key: V8RawKeyData,
  hash: ShaHash,
  label: Vec<u8>,
  data: &[u8],
) -> Result<Vec<u8>, EncryptError> {
  let label = String::from_utf8_lossy(&label).to_string();

  let public_key = key.as_rsa_public_key()?;
  let public_key = rsa::RsaPublicKey::from_pkcs1_der(&public_key)
    .map_err(|_| SharedError::FailedDecodePublicKey)?;
  let mut rng = OsRng;
  let padding = match hash {
    ShaHash::Sha1 => rsa::Oaep {
      digest: Box::<Sha1>::default(),
      mgf_digest: Box::<Sha1>::default(),
      label: Some(label),
    },
    ShaHash::Sha256 => rsa::Oaep {
      digest: Box::<Sha256>::default(),
      mgf_digest: Box::<Sha256>::default(),
      label: Some(label),
    },
    ShaHash::Sha384 => rsa::Oaep {
      digest: Box::<Sha384>::default(),
      mgf_digest: Box::<Sha384>::default(),
      label: Some(label),
    },
    ShaHash::Sha512 => rsa::Oaep {
      digest: Box::<Sha512>::default(),
      mgf_digest: Box::<Sha512>::default(),
      label: Some(label),
    },
  };
  let encrypted = public_key
    .encrypt(&mut rng, padding, data)
    .map_err(|_| EncryptError::Failed)?;
  Ok(encrypted)
}

fn encrypt_aes_cbc(
  key: V8RawKeyData,
  length: usize,
  iv: Vec<u8>,
  data: &[u8],
) -> Result<Vec<u8>, EncryptError> {
  let key = key.as_secret_key()?;
  let ciphertext = match length {
    128 => {
      // Section 10.3 Step 2 of RFC 2315 https://www.rfc-editor.org/rfc/rfc2315
      type Aes128CbcEnc = cbc::Encryptor<aes::Aes128>;

      let cipher = Aes128CbcEnc::new_from_slices(key, &iv)
        .map_err(|_| EncryptError::InvalidKeyOrIv)?;
      cipher.encrypt_padded_vec_mut::<Pkcs7>(data)
    }
    192 => {
      // Section 10.3 Step 2 of RFC 2315 https://www.rfc-editor.org/rfc/rfc2315
      type Aes192CbcEnc = cbc::Encryptor<aes::Aes192>;

      let cipher = Aes192CbcEnc::new_from_slices(key, &iv)
        .map_err(|_| EncryptError::InvalidKeyOrIv)?;
      cipher.encrypt_padded_vec_mut::<Pkcs7>(data)
    }
    256 => {
      // Section 10.3 Step 2 of RFC 2315 https://www.rfc-editor.org/rfc/rfc2315
      type Aes256CbcEnc = cbc::Encryptor<aes::Aes256>;

      let cipher = Aes256CbcEnc::new_from_slices(key, &iv)
        .map_err(|_| EncryptError::InvalidKeyOrIv)?;
      cipher.encrypt_padded_vec_mut::<Pkcs7>(data)
    }
    _ => return Err(EncryptError::InvalidLength),
  };
  Ok(ciphertext)
}

fn encrypt_aes_gcm_general<N: ArrayLength<u8>>(
  key: &[u8],
  iv: Vec<u8>,
  length: usize,
  ciphertext: &mut [u8],
  additional_data: Vec<u8>,
) -> Result<aes_gcm::Tag, EncryptError> {
  let nonce = Nonce::<N>::from_slice(&iv);
  let tag = match length {
    128 => {
      let cipher = aes_gcm::AesGcm::<Aes128, N>::new_from_slice(key)
        .map_err(|_| EncryptError::Failed)?;
      cipher
        .encrypt_in_place_detached(nonce, &additional_data, ciphertext)
        .map_err(|_| EncryptError::Failed)?
    }
    192 => {
      let cipher = aes_gcm::AesGcm::<Aes192, N>::new_from_slice(key)
        .map_err(|_| EncryptError::Failed)?;
      cipher
        .encrypt_in_place_detached(nonce, &additional_data, ciphertext)
        .map_err(|_| EncryptError::Failed)?
    }
    256 => {
      let cipher = aes_gcm::AesGcm::<Aes256, N>::new_from_slice(key)
        .map_err(|_| EncryptError::Failed)?;
      cipher
        .encrypt_in_place_detached(nonce, &additional_data, ciphertext)
        .map_err(|_| EncryptError::Failed)?
    }
    _ => return Err(EncryptError::InvalidLength),
  };

  Ok(tag)
}

fn encrypt_aes_gcm(
  key: V8RawKeyData,
  length: usize,
  tag_length: usize,
  iv: Vec<u8>,
  additional_data: Option<Vec<u8>>,
  data: &[u8],
) -> Result<Vec<u8>, EncryptError> {
  let key = key.as_secret_key()?;
  let additional_data = additional_data.unwrap_or_default();

  let mut ciphertext = data.to_vec();
  // Fixed 96-bit OR 128-bit nonce
  let tag = match iv.len() {
    12 => encrypt_aes_gcm_general::<U12>(
      key,
      iv,
      length,
      &mut ciphertext,
      additional_data,
    )?,
    16 => encrypt_aes_gcm_general::<U16>(
      key,
      iv,
      length,
      &mut ciphertext,
      additional_data,
    )?,
    _ => return Err(EncryptError::InvalidIvLength),
  };

  // Truncated tag to the specified tag length.
  // `tag` is fixed to be 16 bytes long and (tag_length / 8) is always <= 16
  let tag = &tag[..(tag_length / 8)];

  // C | T
  ciphertext.extend_from_slice(tag);

  Ok(ciphertext)
}

fn encrypt_aes_ctr_gen<B>(
  key: &[u8],
  counter: &[u8],
  data: &[u8],
) -> Result<Vec<u8>, EncryptError>
where
  B: KeyIvInit + StreamCipher,
{
  let mut cipher = B::new(key.into(), counter.into());

  let mut ciphertext = data.to_vec();
  cipher
    .try_apply_keystream(&mut ciphertext)
    .map_err(|_| EncryptError::TooMuchData)?;

  Ok(ciphertext)
}

fn encrypt_aes_ctr(
  key: V8RawKeyData,
  key_length: usize,
  counter: &[u8],
  ctr_length: usize,
  data: &[u8],
) -> Result<Vec<u8>, EncryptError> {
  let key = key.as_secret_key()?;

  match ctr_length {
    32 => match key_length {
      128 => encrypt_aes_ctr_gen::<Ctr32BE<aes::Aes128>>(key, counter, data),
      192 => encrypt_aes_ctr_gen::<Ctr32BE<aes::Aes192>>(key, counter, data),
      256 => encrypt_aes_ctr_gen::<Ctr32BE<aes::Aes256>>(key, counter, data),
      _ => Err(EncryptError::InvalidLength),
    },
    64 => match key_length {
      128 => encrypt_aes_ctr_gen::<Ctr64BE<aes::Aes128>>(key, counter, data),
      192 => encrypt_aes_ctr_gen::<Ctr64BE<aes::Aes192>>(key, counter, data),
      256 => encrypt_aes_ctr_gen::<Ctr64BE<aes::Aes256>>(key, counter, data),
      _ => Err(EncryptError::InvalidLength),
    },
    128 => match key_length {
      128 => encrypt_aes_ctr_gen::<Ctr128BE<aes::Aes128>>(key, counter, data),
      192 => encrypt_aes_ctr_gen::<Ctr128BE<aes::Aes192>>(key, counter, data),
      256 => encrypt_aes_ctr_gen::<Ctr128BE<aes::Aes256>>(key, counter, data),
      _ => Err(EncryptError::InvalidLength),
    },
    _ => Err(EncryptError::InvalidCounterLength),
  }
}
