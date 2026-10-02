// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
use core::fmt;
use digest::core_api::AlgorithmName;
use digest::core_api::BlockSizeUser;
use digest::core_api::Buffer;
use digest::core_api::BufferKindUser;
use digest::core_api::CoreWrapper;
use digest::core_api::FixedOutputCore;
use digest::core_api::OutputSizeUser;
use digest::core_api::UpdateCore;
use digest::HashMarker;
use digest::Output;
use digest::Reset;

pub type Md5Sha1 = CoreWrapper<Md5Sha1Core>;

pub struct Md5Sha1Core {
  md5: md5::Md5Core,
  sha1: sha1::Sha1Core,
}

impl HashMarker for Md5Sha1Core {}

impl BlockSizeUser for Md5Sha1Core {
  type BlockSize = sec1::consts::U64;
}

impl BufferKindUser for Md5Sha1Core {
  type BufferKind = digest::block_buffer::Eager;
}

impl OutputSizeUser for Md5Sha1Core {
  type OutputSize = sec1::consts::U36;
}

impl UpdateCore for Md5Sha1Core {
  #[inline]
  fn update_blocks(&mut self, blocks: &[digest::core_api::Block<Self>]) {
    self.md5.update_blocks(blocks);
    self.sha1.update_blocks(blocks);
  }
}

impl FixedOutputCore for Md5Sha1Core {
  #[inline]
  fn finalize_fixed_core(
    &mut self,
    buffer: &mut Buffer<Self>,
    out: &mut Output<Self>,
  ) {
    let mut md5_output = Output::<md5::Md5Core>::default();
    self
      .md5
      .finalize_fixed_core(&mut buffer.clone(), &mut md5_output);
    let mut sha1_output = Output::<sha1::Sha1Core>::default();
    self.sha1.finalize_fixed_core(buffer, &mut sha1_output);
    out[..16].copy_from_slice(&md5_output);
    out[16..].copy_from_slice(&sha1_output);
  }
}

impl Default for Md5Sha1Core {
  #[inline]
  fn default() -> Self {
    Self {
      md5: Default::default(),
      sha1: Default::default(),
    }
  }
}

impl Clone for Md5Sha1Core {
  #[inline]
  fn clone(&self) -> Self {
    Self {
      md5: self.md5.clone(),
      sha1: self.sha1.clone(),
    }
  }
}

impl Reset for Md5Sha1Core {
  #[inline]
  fn reset(&mut self) {
    *self = Default::default();
  }
}

impl AlgorithmName for Md5Sha1Core {
  fn write_alg_name(f: &mut fmt::Formatter<'_>) -> fmt::Result {
    f.write_str("Md5Sha1")
  }
}

impl fmt::Debug for Md5Sha1Core {
  fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
    f.write_str("Md5Sha1Core { ... }")
  }
}
