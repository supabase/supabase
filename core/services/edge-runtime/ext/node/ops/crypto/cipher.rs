// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use aes::cipher::block_padding::Pkcs7;
use aes::cipher::BlockDecryptMut;
use aes::cipher::BlockEncryptMut;
use aes::cipher::KeyIvInit;
use aes::cipher::KeySizeUser;
use deno_core::Resource;
use digest::generic_array::GenericArray;
use digest::KeyInit;

use std::borrow::Cow;
use std::cell::RefCell;
use std::rc::Rc;

type Tag = Option<Vec<u8>>;

type Aes128Gcm = aead_gcm_stream::AesGcm<aes::Aes128>;
type Aes256Gcm = aead_gcm_stream::AesGcm<aes::Aes256>;

enum Cipher {
  Aes128Cbc(Box<cbc::Encryptor<aes::Aes128>>),
  Aes128Ecb(Box<ecb::Encryptor<aes::Aes128>>),
  Aes192Ecb(Box<ecb::Encryptor<aes::Aes192>>),
  Aes256Ecb(Box<ecb::Encryptor<aes::Aes256>>),
  Aes128Gcm(Box<Aes128Gcm>),
  Aes256Gcm(Box<Aes256Gcm>),
  Aes256Cbc(Box<cbc::Encryptor<aes::Aes256>>),
  // TODO(kt3k): add more algorithms Aes192Cbc, etc.
}

enum Decipher {
  Aes128Cbc(Box<cbc::Decryptor<aes::Aes128>>),
  Aes128Ecb(Box<ecb::Decryptor<aes::Aes128>>),
  Aes192Ecb(Box<ecb::Decryptor<aes::Aes192>>),
  Aes256Ecb(Box<ecb::Decryptor<aes::Aes256>>),
  Aes128Gcm(Box<Aes128Gcm>),
  Aes256Gcm(Box<Aes256Gcm>),
  Aes256Cbc(Box<cbc::Decryptor<aes::Aes256>>),
  // TODO(kt3k): add more algorithms Aes192Cbc, Aes128GCM, etc.
}

pub struct CipherContext {
  cipher: Rc<RefCell<Cipher>>,
}

pub struct DecipherContext {
  decipher: Rc<RefCell<Decipher>>,
}

#[derive(Debug, thiserror::Error)]
pub enum CipherContextError {
  #[error("Cipher context is already in use")]
  ContextInUse,
  #[error("{0}")]
  Resource(deno_core::error::AnyError),
  #[error(transparent)]
  Cipher(#[from] CipherError),
}

impl CipherContext {
  pub fn new(
    algorithm: &str,
    key: &[u8],
    iv: &[u8],
  ) -> Result<Self, CipherContextError> {
    Ok(Self {
      cipher: Rc::new(RefCell::new(Cipher::new(algorithm, key, iv)?)),
    })
  }

  pub fn set_aad(&self, aad: &[u8]) {
    self.cipher.borrow_mut().set_aad(aad);
  }

  pub fn encrypt(&self, input: &[u8], output: &mut [u8]) {
    self.cipher.borrow_mut().encrypt(input, output);
  }

  pub fn take_tag(self) -> Tag {
    Rc::try_unwrap(self.cipher).ok()?.into_inner().take_tag()
  }

  pub fn r#final(
    self,
    auto_pad: bool,
    input: &[u8],
    output: &mut [u8],
  ) -> Result<Tag, CipherContextError> {
    Rc::try_unwrap(self.cipher)
      .map_err(|_| CipherContextError::ContextInUse)?
      .into_inner()
      .r#final(auto_pad, input, output)
      .map_err(Into::into)
  }
}

#[derive(Debug, thiserror::Error)]
pub enum DecipherContextError {
  #[error("Decipher context is already in use")]
  ContextInUse,
  #[error("{0}")]
  Resource(deno_core::error::AnyError),
  #[error(transparent)]
  Decipher(#[from] DecipherError),
}

impl DecipherContext {
  pub fn new(
    algorithm: &str,
    key: &[u8],
    iv: &[u8],
  ) -> Result<Self, DecipherContextError> {
    Ok(Self {
      decipher: Rc::new(RefCell::new(Decipher::new(algorithm, key, iv)?)),
    })
  }

  pub fn set_aad(&self, aad: &[u8]) {
    self.decipher.borrow_mut().set_aad(aad);
  }

  pub fn decrypt(&self, input: &[u8], output: &mut [u8]) {
    self.decipher.borrow_mut().decrypt(input, output);
  }

  pub fn r#final(
    self,
    auto_pad: bool,
    input: &[u8],
    output: &mut [u8],
    auth_tag: &[u8],
  ) -> Result<(), DecipherContextError> {
    Rc::try_unwrap(self.decipher)
      .map_err(|_| DecipherContextError::ContextInUse)?
      .into_inner()
      .r#final(auto_pad, input, output, auth_tag)
      .map_err(Into::into)
  }
}

impl Resource for CipherContext {
  fn name(&self) -> Cow<'_, str> {
    "cryptoCipher".into()
  }
}

impl Resource for DecipherContext {
  fn name(&self) -> Cow<'_, str> {
    "cryptoDecipher".into()
  }
}

#[derive(Debug, thiserror::Error)]
pub enum CipherError {
  #[error("IV length must be 12 bytes")]
  InvalidIvLength,
  #[error("Invalid key length")]
  InvalidKeyLength,
  #[error("Invalid initialization vector")]
  InvalidInitializationVector,
  #[error("Cannot pad the input data")]
  CannotPadInputData,
  #[error("Unknown cipher {0}")]
  UnknownCipher(String),
}

impl Cipher {
  fn new(
    algorithm_name: &str,
    key: &[u8],
    iv: &[u8],
  ) -> Result<Self, CipherError> {
    use Cipher::*;
    Ok(match algorithm_name {
      "aes-128-cbc" => {
        Aes128Cbc(Box::new(cbc::Encryptor::new(key.into(), iv.into())))
      }
      "aes-128-ecb" => Aes128Ecb(Box::new(ecb::Encryptor::new(key.into()))),
      "aes-192-ecb" => Aes192Ecb(Box::new(ecb::Encryptor::new(key.into()))),
      "aes-256-ecb" => Aes256Ecb(Box::new(ecb::Encryptor::new(key.into()))),
      "aes-128-gcm" => {
        if key.len() != aes::Aes128::key_size() {
          return Err(CipherError::InvalidIvLength);
        }

        let cipher =
          aead_gcm_stream::AesGcm::<aes::Aes128>::new(key.into(), iv);

        Aes128Gcm(Box::new(cipher))
      }
      "aes-256-gcm" => {
        if key.len() != aes::Aes256::key_size() {
          return Err(CipherError::InvalidIvLength);
        }

        let cipher =
          aead_gcm_stream::AesGcm::<aes::Aes256>::new(key.into(), iv);

        Aes256Gcm(Box::new(cipher))
      }
      "aes256" | "aes-256-cbc" => {
        if key.len() != 32 {
          return Err(CipherError::InvalidKeyLength);
        }
        if iv.len() != 16 {
          return Err(CipherError::InvalidInitializationVector);
        }

        Aes256Cbc(Box::new(cbc::Encryptor::new(key.into(), iv.into())))
      }
      _ => return Err(CipherError::UnknownCipher(algorithm_name.to_string())),
    })
  }

  fn set_aad(&mut self, aad: &[u8]) {
    use Cipher::*;
    match self {
      Aes128Gcm(cipher) => {
        cipher.set_aad(aad);
      }
      Aes256Gcm(cipher) => {
        cipher.set_aad(aad);
      }
      _ => {}
    }
  }

  /// encrypt encrypts the data in the middle of the input.
  fn encrypt(&mut self, input: &[u8], output: &mut [u8]) {
    use Cipher::*;
    match self {
      Aes128Cbc(encryptor) => {
        assert!(input.len().is_multiple_of(16));
        for (input, output) in input.chunks(16).zip(output.chunks_mut(16)) {
          encryptor.encrypt_block_b2b_mut(input.into(), output.into());
        }
      }
      Aes128Ecb(encryptor) => {
        assert!(input.len().is_multiple_of(16));
        for (input, output) in input.chunks(16).zip(output.chunks_mut(16)) {
          encryptor.encrypt_block_b2b_mut(input.into(), output.into());
        }
      }
      Aes192Ecb(encryptor) => {
        assert!(input.len().is_multiple_of(16));
        for (input, output) in input.chunks(16).zip(output.chunks_mut(16)) {
          encryptor.encrypt_block_b2b_mut(input.into(), output.into());
        }
      }
      Aes256Ecb(encryptor) => {
        assert!(input.len().is_multiple_of(16));
        for (input, output) in input.chunks(16).zip(output.chunks_mut(16)) {
          encryptor.encrypt_block_b2b_mut(input.into(), output.into());
        }
      }
      Aes128Gcm(cipher) => {
        output[..input.len()].copy_from_slice(input);
        cipher.encrypt(output);
      }
      Aes256Gcm(cipher) => {
        output[..input.len()].copy_from_slice(input);
        cipher.encrypt(output);
      }
      Aes256Cbc(encryptor) => {
        assert!(input.len().is_multiple_of(16));
        for (input, output) in input.chunks(16).zip(output.chunks_mut(16)) {
          encryptor.encrypt_block_b2b_mut(input.into(), output.into());
        }
      }
    }
  }

  /// r#final encrypts the last block of the input data.
  fn r#final(
    self,
    auto_pad: bool,
    input: &[u8],
    output: &mut [u8],
  ) -> Result<Tag, CipherError> {
    assert!(input.len() < 16);
    use Cipher::*;
    match (self, auto_pad) {
      (Aes128Cbc(encryptor), true) => {
        let _ = (*encryptor)
          .encrypt_padded_b2b_mut::<Pkcs7>(input, output)
          .map_err(|_| CipherError::CannotPadInputData)?;
        Ok(None)
      }
      (Aes128Cbc(mut encryptor), false) => {
        encryptor.encrypt_block_b2b_mut(
          GenericArray::from_slice(input),
          GenericArray::from_mut_slice(output),
        );
        Ok(None)
      }
      (Aes128Ecb(encryptor), true) => {
        let _ = (*encryptor)
          .encrypt_padded_b2b_mut::<Pkcs7>(input, output)
          .map_err(|_| CipherError::CannotPadInputData)?;
        Ok(None)
      }
      (Aes128Ecb(mut encryptor), false) => {
        encryptor.encrypt_block_b2b_mut(
          GenericArray::from_slice(input),
          GenericArray::from_mut_slice(output),
        );
        Ok(None)
      }
      (Aes192Ecb(encryptor), true) => {
        let _ = (*encryptor)
          .encrypt_padded_b2b_mut::<Pkcs7>(input, output)
          .map_err(|_| CipherError::CannotPadInputData)?;
        Ok(None)
      }
      (Aes192Ecb(mut encryptor), false) => {
        encryptor.encrypt_block_b2b_mut(
          GenericArray::from_slice(input),
          GenericArray::from_mut_slice(output),
        );
        Ok(None)
      }
      (Aes256Ecb(encryptor), true) => {
        let _ = (*encryptor)
          .encrypt_padded_b2b_mut::<Pkcs7>(input, output)
          .map_err(|_| CipherError::CannotPadInputData)?;
        Ok(None)
      }
      (Aes256Ecb(mut encryptor), false) => {
        encryptor.encrypt_block_b2b_mut(
          GenericArray::from_slice(input),
          GenericArray::from_mut_slice(output),
        );
        Ok(None)
      }
      (Aes128Gcm(cipher), _) => Ok(Some(cipher.finish().to_vec())),
      (Aes256Gcm(cipher), _) => Ok(Some(cipher.finish().to_vec())),
      (Aes256Cbc(encryptor), true) => {
        let _ = (*encryptor)
          .encrypt_padded_b2b_mut::<Pkcs7>(input, output)
          .map_err(|_| CipherError::CannotPadInputData)?;
        Ok(None)
      }
      (Aes256Cbc(mut encryptor), false) => {
        encryptor.encrypt_block_b2b_mut(
          GenericArray::from_slice(input),
          GenericArray::from_mut_slice(output),
        );
        Ok(None)
      }
    }
  }

  fn take_tag(self) -> Tag {
    use Cipher::*;
    match self {
      Aes128Gcm(cipher) => Some(cipher.finish().to_vec()),
      Aes256Gcm(cipher) => Some(cipher.finish().to_vec()),
      _ => None,
    }
  }
}

#[derive(Debug, thiserror::Error)]
pub enum DecipherError {
  #[error("IV length must be 12 bytes")]
  InvalidIvLength,
  #[error("Invalid key length")]
  InvalidKeyLength,
  #[error("Invalid initialization vector")]
  InvalidInitializationVector,
  #[error("Cannot unpad the input data")]
  CannotUnpadInputData,
  #[error("Failed to authenticate data")]
  DataAuthenticationFailed,
  #[error("setAutoPadding(false) not supported for Aes128Gcm yet")]
  SetAutoPaddingFalseAes128GcmUnsupported,
  #[error("setAutoPadding(false) not supported for Aes256Gcm yet")]
  SetAutoPaddingFalseAes256GcmUnsupported,
  #[error("Unknown cipher {0}")]
  UnknownCipher(String),
}

impl Decipher {
  fn new(
    algorithm_name: &str,
    key: &[u8],
    iv: &[u8],
  ) -> Result<Self, DecipherError> {
    use Decipher::*;
    Ok(match algorithm_name {
      "aes-128-cbc" => {
        Aes128Cbc(Box::new(cbc::Decryptor::new(key.into(), iv.into())))
      }
      "aes-128-ecb" => Aes128Ecb(Box::new(ecb::Decryptor::new(key.into()))),
      "aes-192-ecb" => Aes192Ecb(Box::new(ecb::Decryptor::new(key.into()))),
      "aes-256-ecb" => Aes256Ecb(Box::new(ecb::Decryptor::new(key.into()))),
      "aes-128-gcm" => {
        if key.len() != aes::Aes128::key_size() {
          return Err(DecipherError::InvalidIvLength);
        }

        let decipher =
          aead_gcm_stream::AesGcm::<aes::Aes128>::new(key.into(), iv);

        Aes128Gcm(Box::new(decipher))
      }
      "aes-256-gcm" => {
        if key.len() != aes::Aes256::key_size() {
          return Err(DecipherError::InvalidIvLength);
        }

        let decipher =
          aead_gcm_stream::AesGcm::<aes::Aes256>::new(key.into(), iv);

        Aes256Gcm(Box::new(decipher))
      }
      "aes256" | "aes-256-cbc" => {
        if key.len() != 32 {
          return Err(DecipherError::InvalidKeyLength);
        }
        if iv.len() != 16 {
          return Err(DecipherError::InvalidInitializationVector);
        }

        Aes256Cbc(Box::new(cbc::Decryptor::new(key.into(), iv.into())))
      }
      _ => {
        return Err(DecipherError::UnknownCipher(algorithm_name.to_string()))
      }
    })
  }

  fn set_aad(&mut self, aad: &[u8]) {
    use Decipher::*;
    match self {
      Aes128Gcm(decipher) => {
        decipher.set_aad(aad);
      }
      Aes256Gcm(decipher) => {
        decipher.set_aad(aad);
      }
      _ => {}
    }
  }

  /// decrypt decrypts the data in the middle of the input.
  fn decrypt(&mut self, input: &[u8], output: &mut [u8]) {
    use Decipher::*;
    match self {
      Aes128Cbc(decryptor) => {
        assert!(input.len().is_multiple_of(16));
        for (input, output) in input.chunks(16).zip(output.chunks_mut(16)) {
          decryptor.decrypt_block_b2b_mut(input.into(), output.into());
        }
      }
      Aes128Ecb(decryptor) => {
        assert!(input.len().is_multiple_of(16));
        for (input, output) in input.chunks(16).zip(output.chunks_mut(16)) {
          decryptor.decrypt_block_b2b_mut(input.into(), output.into());
        }
      }
      Aes192Ecb(decryptor) => {
        assert!(input.len().is_multiple_of(16));
        for (input, output) in input.chunks(16).zip(output.chunks_mut(16)) {
          decryptor.decrypt_block_b2b_mut(input.into(), output.into());
        }
      }
      Aes256Ecb(decryptor) => {
        assert!(input.len().is_multiple_of(16));
        for (input, output) in input.chunks(16).zip(output.chunks_mut(16)) {
          decryptor.decrypt_block_b2b_mut(input.into(), output.into());
        }
      }
      Aes128Gcm(decipher) => {
        output[..input.len()].copy_from_slice(input);
        decipher.decrypt(output);
      }
      Aes256Gcm(decipher) => {
        output[..input.len()].copy_from_slice(input);
        decipher.decrypt(output);
      }
      Aes256Cbc(decryptor) => {
        assert!(input.len().is_multiple_of(16));
        for (input, output) in input.chunks(16).zip(output.chunks_mut(16)) {
          decryptor.decrypt_block_b2b_mut(input.into(), output.into());
        }
      }
    }
  }

  /// r#final decrypts the last block of the input data.
  fn r#final(
    self,
    auto_pad: bool,
    input: &[u8],
    output: &mut [u8],
    auth_tag: &[u8],
  ) -> Result<(), DecipherError> {
    use Decipher::*;
    match (self, auto_pad) {
      (Aes128Cbc(decryptor), true) => {
        assert!(input.len() == 16);
        let _ = (*decryptor)
          .decrypt_padded_b2b_mut::<Pkcs7>(input, output)
          .map_err(|_| DecipherError::CannotUnpadInputData)?;
        Ok(())
      }
      (Aes128Cbc(mut decryptor), false) => {
        decryptor.decrypt_block_b2b_mut(
          GenericArray::from_slice(input),
          GenericArray::from_mut_slice(output),
        );
        Ok(())
      }
      (Aes128Ecb(decryptor), true) => {
        assert!(input.len() == 16);
        let _ = (*decryptor)
          .decrypt_padded_b2b_mut::<Pkcs7>(input, output)
          .map_err(|_| DecipherError::CannotUnpadInputData)?;
        Ok(())
      }
      (Aes128Ecb(mut decryptor), false) => {
        decryptor.decrypt_block_b2b_mut(
          GenericArray::from_slice(input),
          GenericArray::from_mut_slice(output),
        );
        Ok(())
      }
      (Aes192Ecb(decryptor), true) => {
        assert!(input.len() == 16);
        let _ = (*decryptor)
          .decrypt_padded_b2b_mut::<Pkcs7>(input, output)
          .map_err(|_| DecipherError::CannotUnpadInputData)?;
        Ok(())
      }
      (Aes192Ecb(mut decryptor), false) => {
        decryptor.decrypt_block_b2b_mut(
          GenericArray::from_slice(input),
          GenericArray::from_mut_slice(output),
        );
        Ok(())
      }
      (Aes256Ecb(decryptor), true) => {
        assert!(input.len() == 16);
        let _ = (*decryptor)
          .decrypt_padded_b2b_mut::<Pkcs7>(input, output)
          .map_err(|_| DecipherError::CannotUnpadInputData)?;
        Ok(())
      }
      (Aes256Ecb(mut decryptor), false) => {
        decryptor.decrypt_block_b2b_mut(
          GenericArray::from_slice(input),
          GenericArray::from_mut_slice(output),
        );
        Ok(())
      }
      (Aes128Gcm(decipher), true) => {
        let tag = decipher.finish();
        if tag.as_slice() == auth_tag {
          Ok(())
        } else {
          Err(DecipherError::DataAuthenticationFailed)
        }
      }
      (Aes128Gcm(_), false) => {
        Err(DecipherError::SetAutoPaddingFalseAes128GcmUnsupported)
      }
      (Aes256Gcm(decipher), true) => {
        let tag = decipher.finish();
        if tag.as_slice() == auth_tag {
          Ok(())
        } else {
          Err(DecipherError::DataAuthenticationFailed)
        }
      }
      (Aes256Gcm(_), false) => {
        Err(DecipherError::SetAutoPaddingFalseAes256GcmUnsupported)
      }
      (Aes256Cbc(decryptor), true) => {
        assert!(input.len() == 16);
        let _ = (*decryptor)
          .decrypt_padded_b2b_mut::<Pkcs7>(input, output)
          .map_err(|_| DecipherError::CannotUnpadInputData)?;
        Ok(())
      }
      (Aes256Cbc(mut decryptor), false) => {
        decryptor.decrypt_block_b2b_mut(
          GenericArray::from_slice(input),
          GenericArray::from_mut_slice(output),
        );
        Ok(())
      }
    }
  }
}
