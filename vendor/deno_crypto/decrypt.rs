// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use aes::cipher::block_padding::Pkcs7;
use aes::cipher::BlockDecryptMut;
use aes::cipher::KeyIvInit;
use aes_gcm::aead::generic_array::typenum::U12;
use aes_gcm::aead::generic_array::typenum::U16;
use aes_gcm::aead::generic_array::ArrayLength;
use aes_gcm::aes::Aes128;
use aes_gcm::aes::Aes192;
use aes_gcm::aes::Aes256;
use aes_gcm::AeadInPlace;
use aes_gcm::KeyInit;
use aes_gcm::Nonce;
use ctr::cipher::StreamCipher;
use ctr::Ctr128BE;
use ctr::Ctr32BE;
use ctr::Ctr64BE;
use deno_core::op2;
use deno_core::unsync::spawn_blocking;
use deno_core::JsBuffer;
use deno_core::ToJsBuffer;
use rsa::pkcs1::DecodeRsaPrivateKey;
use serde::Deserialize;
use sha1::Sha1;
use sha2::Sha256;
use sha2::Sha384;
use sha2::Sha512;

use crate::shared::*;

#[derive(Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct DecryptOptions {
  key: V8RawKeyData,
  #[serde(flatten)]
  algorithm: DecryptAlgorithm,
}

#[derive(Deserialize)]
#[serde(rename_all = "camelCase", tag = "algorithm")]
pub enum DecryptAlgorithm {
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
  #[serde(rename = "AES-CTR", rename_all = "camelCase")]
  AesCtr {
    #[serde(with = "serde_bytes")]
    counter: Vec<u8>,
    ctr_length: usize,
    key_length: usize,
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
}

#[derive(Debug, thiserror::Error)]
pub enum DecryptError {
  #[error(transparent)]
  General(#[from] SharedError),
  #[error(transparent)]
  Pkcs1(#[from] rsa::pkcs1::Error),
  #[error("Decryption failed")]
  Failed,
  #[error("invalid length")]
  InvalidLength,
  #[error("invalid counter length. Currently supported 32/64/128 bits")]
  InvalidCounterLength,
  #[error("tag length not equal to 128")]
  InvalidTagLength,
  #[error("invalid key or iv")]
  InvalidKeyOrIv,
  #[error("tried to decrypt too much data")]
  TooMuchData,
  #[error("iv length not equal to 12 or 16")]
  InvalidIvLength,
  #[error("{0}")]
  Rsa(rsa::Error),
}

#[op2(async)]
#[serde]
pub async fn op_crypto_decrypt(
  #[serde] opts: DecryptOptions,
  #[buffer] data: JsBuffer,
) -> Result<ToJsBuffer, DecryptError> {
  let key = opts.key;
  let fun = move || match opts.algorithm {
    DecryptAlgorithm::RsaOaep { hash, label } => {
      decrypt_rsa_oaep(key, hash, label, &data)
    }
    DecryptAlgorithm::AesCbc { iv, length } => {
      decrypt_aes_cbc(key, length, iv, &data)
    }
    DecryptAlgorithm::AesCtr {
      counter,
      ctr_length,
      key_length,
    } => decrypt_aes_ctr(key, key_length, &counter, ctr_length, &data),
    DecryptAlgorithm::AesGcm {
      iv,
      additional_data,
      length,
      tag_length,
    } => decrypt_aes_gcm(key, length, tag_length, iv, additional_data, &data),
  };
  let buf = spawn_blocking(fun).await.unwrap()?;
  Ok(buf.into())
}

fn decrypt_rsa_oaep(
  key: V8RawKeyData,
  hash: ShaHash,
  label: Vec<u8>,
  data: &[u8],
) -> Result<Vec<u8>, DecryptError> {
  let key = key.as_rsa_private_key()?;

  let private_key = rsa::RsaPrivateKey::from_pkcs1_der(key)?;
  let label = Some(String::from_utf8_lossy(&label).to_string());

  let padding = match hash {
    ShaHash::Sha1 => rsa::Oaep {
      digest: Box::<Sha1>::default(),
      mgf_digest: Box::<Sha1>::default(),
      label,
    },
    ShaHash::Sha256 => rsa::Oaep {
      digest: Box::<Sha256>::default(),
      mgf_digest: Box::<Sha256>::default(),
      label,
    },
    ShaHash::Sha384 => rsa::Oaep {
      digest: Box::<Sha384>::default(),
      mgf_digest: Box::<Sha384>::default(),
      label,
    },
    ShaHash::Sha512 => rsa::Oaep {
      digest: Box::<Sha512>::default(),
      mgf_digest: Box::<Sha512>::default(),
      label,
    },
  };

  private_key
    .decrypt(padding, data)
    .map_err(DecryptError::Rsa)
}

fn decrypt_aes_cbc(
  key: V8RawKeyData,
  length: usize,
  iv: Vec<u8>,
  data: &[u8],
) -> Result<Vec<u8>, DecryptError> {
  let key = key.as_secret_key()?;

  // 2.
  let plaintext = match length {
    128 => {
      // Section 10.3 Step 2 of RFC 2315 https://www.rfc-editor.org/rfc/rfc2315
      type Aes128CbcDec = cbc::Decryptor<aes::Aes128>;
      let cipher = Aes128CbcDec::new_from_slices(key, &iv)
        .map_err(|_| DecryptError::InvalidKeyOrIv)?;

      cipher
        .decrypt_padded_vec_mut::<Pkcs7>(data)
        .map_err(|_| DecryptError::Failed)?
    }
    192 => {
      // Section 10.3 Step 2 of RFC 2315 https://www.rfc-editor.org/rfc/rfc2315
      type Aes192CbcDec = cbc::Decryptor<aes::Aes192>;
      let cipher = Aes192CbcDec::new_from_slices(key, &iv)
        .map_err(|_| DecryptError::InvalidKeyOrIv)?;

      cipher
        .decrypt_padded_vec_mut::<Pkcs7>(data)
        .map_err(|_| DecryptError::Failed)?
    }
    256 => {
      // Section 10.3 Step 2 of RFC 2315 https://www.rfc-editor.org/rfc/rfc2315
      type Aes256CbcDec = cbc::Decryptor<aes::Aes256>;
      let cipher = Aes256CbcDec::new_from_slices(key, &iv)
        .map_err(|_| DecryptError::InvalidKeyOrIv)?;

      cipher
        .decrypt_padded_vec_mut::<Pkcs7>(data)
        .map_err(|_| DecryptError::Failed)?
    }
    _ => unreachable!(),
  };

  // 6.
  Ok(plaintext)
}

fn decrypt_aes_ctr_gen<B>(
  key: &[u8],
  counter: &[u8],
  data: &[u8],
) -> Result<Vec<u8>, DecryptError>
where
  B: KeyIvInit + StreamCipher,
{
  let mut cipher = B::new(key.into(), counter.into());

  let mut plaintext = data.to_vec();
  cipher
    .try_apply_keystream(&mut plaintext)
    .map_err(|_| DecryptError::TooMuchData)?;

  Ok(plaintext)
}

fn decrypt_aes_gcm_gen<N: ArrayLength<u8>>(
  key: &[u8],
  tag: &aes_gcm::Tag,
  nonce: &[u8],
  length: usize,
  additional_data: Vec<u8>,
  plaintext: &mut [u8],
) -> Result<(), DecryptError> {
  let nonce = Nonce::from_slice(nonce);
  match length {
    128 => {
      let cipher = aes_gcm::AesGcm::<Aes128, N>::new_from_slice(key)
        .map_err(|_| DecryptError::Failed)?;
      cipher
        .decrypt_in_place_detached(
          nonce,
          additional_data.as_slice(),
          plaintext,
          tag,
        )
        .map_err(|_| DecryptError::Failed)?
    }
    192 => {
      let cipher = aes_gcm::AesGcm::<Aes192, N>::new_from_slice(key)
        .map_err(|_| DecryptError::Failed)?;
      cipher
        .decrypt_in_place_detached(
          nonce,
          additional_data.as_slice(),
          plaintext,
          tag,
        )
        .map_err(|_| DecryptError::Failed)?
    }
    256 => {
      let cipher = aes_gcm::AesGcm::<Aes256, N>::new_from_slice(key)
        .map_err(|_| DecryptError::Failed)?;
      cipher
        .decrypt_in_place_detached(
          nonce,
          additional_data.as_slice(),
          plaintext,
          tag,
        )
        .map_err(|_| DecryptError::Failed)?
    }
    _ => return Err(DecryptError::InvalidLength),
  };

  Ok(())
}

fn decrypt_aes_ctr(
  key: V8RawKeyData,
  key_length: usize,
  counter: &[u8],
  ctr_length: usize,
  data: &[u8],
) -> Result<Vec<u8>, DecryptError> {
  let key = key.as_secret_key()?;

  match ctr_length {
    32 => match key_length {
      128 => decrypt_aes_ctr_gen::<Ctr32BE<aes::Aes128>>(key, counter, data),
      192 => decrypt_aes_ctr_gen::<Ctr32BE<aes::Aes192>>(key, counter, data),
      256 => decrypt_aes_ctr_gen::<Ctr32BE<aes::Aes256>>(key, counter, data),
      _ => Err(DecryptError::InvalidLength),
    },
    64 => match key_length {
      128 => decrypt_aes_ctr_gen::<Ctr64BE<aes::Aes128>>(key, counter, data),
      192 => decrypt_aes_ctr_gen::<Ctr64BE<aes::Aes192>>(key, counter, data),
      256 => decrypt_aes_ctr_gen::<Ctr64BE<aes::Aes256>>(key, counter, data),
      _ => Err(DecryptError::InvalidLength),
    },
    128 => match key_length {
      128 => decrypt_aes_ctr_gen::<Ctr128BE<aes::Aes128>>(key, counter, data),
      192 => decrypt_aes_ctr_gen::<Ctr128BE<aes::Aes192>>(key, counter, data),
      256 => decrypt_aes_ctr_gen::<Ctr128BE<aes::Aes256>>(key, counter, data),
      _ => Err(DecryptError::InvalidLength),
    },
    _ => Err(DecryptError::InvalidCounterLength),
  }
}

fn decrypt_aes_gcm(
  key: V8RawKeyData,
  length: usize,
  tag_length: usize,
  iv: Vec<u8>,
  additional_data: Option<Vec<u8>>,
  data: &[u8],
) -> Result<Vec<u8>, DecryptError> {
  let key = key.as_secret_key()?;
  let additional_data = additional_data.unwrap_or_default();

  // The `aes_gcm` crate only supports 128 bits tag length.
  //
  // Note that encryption won't fail, it instead truncates the tag
  // to the specified tag length as specified in the spec.
  if tag_length != 128 {
    return Err(DecryptError::InvalidTagLength);
  }

  let sep = data.len() - (tag_length / 8);
  let tag = &data[sep..];

  // The actual ciphertext, called plaintext because it is reused in place.
  let mut plaintext = data[..sep].to_vec();

  // Fixed 96-bit or 128-bit nonce
  match iv.len() {
    12 => decrypt_aes_gcm_gen::<U12>(
      key,
      tag.into(),
      &iv,
      length,
      additional_data,
      &mut plaintext,
    )?,
    16 => decrypt_aes_gcm_gen::<U16>(
      key,
      tag.into(),
      &iv,
      length,
      additional_data,
      &mut plaintext,
    )?,
    _ => return Err(DecryptError::InvalidIvLength),
  }

  Ok(plaintext)
}
