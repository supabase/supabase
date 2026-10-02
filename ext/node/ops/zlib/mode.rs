// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

#[derive(Debug, thiserror::Error)]
#[error("bad argument")]
pub struct ModeError;

macro_rules! repr_i32 {
    ($(#[$meta:meta])* $vis:vis enum $name:ident {
      $($(#[$vmeta:meta])* $vname:ident $(= $val:expr)?,)*
    }) => {
      $(#[$meta])*
      $vis enum $name {
        $($(#[$vmeta])* $vname $(= $val)?,)*
      }

      impl core::convert::TryFrom<i32> for $name {
        type Error = ModeError;

        fn try_from(v: i32) -> Result<Self, Self::Error> {
          match v {
            $(x if x == $name::$vname as i32 => Ok($name::$vname),)*
            _ => Err(ModeError),
          }
        }
      }
    }
  }

repr_i32! {
  #[repr(i32)]
  #[derive(Clone, Copy, Debug, PartialEq, Default)]
  pub enum Mode {
    #[default]
    None,
    Deflate,
    Inflate,
    Gzip,
    Gunzip,
    DeflateRaw,
    InflateRaw,
    Unzip,
  }
}

repr_i32! {
  #[repr(i32)]
  #[derive(Clone, Copy, Debug, PartialEq, Default)]
  pub enum Flush {
    #[default]
    None = zlib::Z_NO_FLUSH,
    Partial = zlib::Z_PARTIAL_FLUSH,
    Sync = zlib::Z_SYNC_FLUSH,
    Full = zlib::Z_FULL_FLUSH,
    Finish = zlib::Z_FINISH,
    Block = zlib::Z_BLOCK,
    Trees = zlib::Z_TREES,
  }
}
