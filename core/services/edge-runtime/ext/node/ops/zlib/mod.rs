// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use deno_core::op2;
use libc::c_ulong;
use std::borrow::Cow;
use std::cell::RefCell;
use zlib::*;

mod alloc;
pub mod brotli;
pub mod mode;
mod stream;

use mode::Flush;
use mode::Mode;

use self::stream::StreamWrapper;

#[inline]
fn check(condition: bool, msg: &str) -> Result<(), deno_core::error::AnyError> {
  if condition {
    Ok(())
  } else {
    Err(deno_core::error::type_error(msg.to_string()))
  }
}

#[derive(Default)]
struct ZlibInner {
  dictionary: Option<Vec<u8>>,
  err: i32,
  flush: Flush,
  init_done: bool,
  level: i32,
  mem_level: i32,
  mode: Mode,
  strategy: i32,
  window_bits: i32,
  write_in_progress: bool,
  pending_close: bool,
  gzib_id_bytes_read: u32,
  strm: StreamWrapper,
}

const GZIP_HEADER_ID1: u8 = 0x1f;
const GZIP_HEADER_ID2: u8 = 0x8b;

impl ZlibInner {
  #[allow(clippy::too_many_arguments)]
  fn start_write(
    &mut self,
    input: &[u8],
    in_off: u32,
    in_len: u32,
    out: &mut [u8],
    out_off: u32,
    out_len: u32,
    flush: Flush,
  ) -> Result<(), deno_core::error::AnyError> {
    check(self.init_done, "write before init")?;
    check(!self.write_in_progress, "write already in progress")?;
    check(!self.pending_close, "close already in progress")?;

    self.write_in_progress = true;

    let next_in = input
      .get(in_off as usize..in_off as usize + in_len as usize)
      .ok_or_else(|| deno_core::error::type_error("invalid input range"))?
      .as_ptr() as *mut _;
    let next_out = out
      .get_mut(out_off as usize..out_off as usize + out_len as usize)
      .ok_or_else(|| deno_core::error::type_error("invalid output range"))?
      .as_mut_ptr();

    self.strm.avail_in = in_len;
    self.strm.next_in = next_in;
    self.strm.avail_out = out_len;
    self.strm.next_out = next_out;

    self.flush = flush;
    Ok(())
  }

  fn do_write(
    &mut self,
    flush: Flush,
  ) -> Result<(), deno_core::error::AnyError> {
    self.flush = flush;
    match self.mode {
      Mode::Deflate | Mode::Gzip | Mode::DeflateRaw => {
        self.err = self.strm.deflate(flush);
      }
      // Auto-detect mode.
      Mode::Unzip if self.strm.avail_in > 0 => 'blck: {
        let mut next_expected_header_byte = Some(0);
        // SAFETY: `self.strm.next_in` is valid pointer to the input buffer.
        // `self.strm.avail_in` is the length of the input buffer that is only set by
        // `start_write`.
        let strm = unsafe {
          std::slice::from_raw_parts(
            self.strm.next_in,
            self.strm.avail_in as usize,
          )
        };

        if self.gzib_id_bytes_read == 0 {
          if strm[0] == GZIP_HEADER_ID1 {
            self.gzib_id_bytes_read = 1;
            next_expected_header_byte = Some(1);

            // Not enough.
            if self.strm.avail_in == 1 {
              break 'blck;
            }
          } else {
            self.mode = Mode::Inflate;
            next_expected_header_byte = None;
          }
        }

        if self.gzib_id_bytes_read == 1 {
          let byte = match next_expected_header_byte {
            Some(i) => strm[i],
            None => break 'blck,
          };
          if byte == GZIP_HEADER_ID2 {
            self.gzib_id_bytes_read = 2;
            self.mode = Mode::Gunzip;
          } else {
            self.mode = Mode::Inflate;
          }
        } else if next_expected_header_byte.is_some() {
          return Err(deno_core::error::type_error(
            "invalid number of gzip magic number bytes read",
          ));
        }
      }
      _ => {}
    }

    match self.mode {
      Mode::Inflate
        | Mode::Gunzip
        | Mode::InflateRaw
        // We're still reading the header.
        | Mode::Unzip => {
        self.err = self.strm.inflate(self.flush);
        // TODO(@littledivy): Use if let chain when it is stable.
        // https://github.com/rust-lang/rust/issues/53667
        //
        // Data was encoded with dictionary
        if let (Z_NEED_DICT, Some(dictionary)) = (self.err, &self.dictionary) {
          self.err = self.strm.inflate_set_dictionary(dictionary);

          if self.err == Z_OK {
            self.err = self.strm.inflate(flush);
          } else if self.err == Z_DATA_ERROR {
            self.err = Z_NEED_DICT;
          }
        }

        while self.strm.avail_in > 0
          && self.mode == Mode::Gunzip
          && self.err == Z_STREAM_END
          // SAFETY: `strm` is a valid pointer to zlib strm.
          // `strm.next_in` is initialized to the input buffer.
          && unsafe { *self.strm.next_in } != 0x00
        {
          self.err = self.strm.reset(self.mode);
          self.err = self.strm.inflate(flush);
        }
      }
      _ => {}
    }

    let done = self.strm.avail_out != 0 && self.flush == Flush::Finish;
    // We're are not done yet, but output buffer is full
    if self.err == Z_BUF_ERROR && !done {
      // Set to Z_OK to avoid reporting the error in JS.
      self.err = Z_OK;
    }

    self.write_in_progress = false;
    Ok(())
  }

  fn init_stream(&mut self) -> Result<(), deno_core::error::AnyError> {
    match self.mode {
      Mode::Gzip | Mode::Gunzip => self.window_bits += 16,
      Mode::Unzip => self.window_bits += 32,
      Mode::DeflateRaw | Mode::InflateRaw => self.window_bits *= -1,
      _ => {}
    }

    self.err = match self.mode {
      Mode::Deflate | Mode::Gzip | Mode::DeflateRaw => self.strm.deflate_init(
        self.level,
        self.window_bits,
        self.mem_level,
        self.strategy,
      ),
      Mode::Inflate | Mode::Gunzip | Mode::InflateRaw | Mode::Unzip => {
        self.strm.inflate_init(self.window_bits)
      }
      Mode::None => return Err(deno_core::error::type_error("Unknown mode")),
    };

    self.write_in_progress = false;
    self.init_done = true;

    Ok(())
  }

  fn close(&mut self) -> Result<bool, deno_core::error::AnyError> {
    if self.write_in_progress {
      self.pending_close = true;
      return Ok(false);
    }

    self.pending_close = false;
    check(self.init_done, "close before init")?;

    self.strm.end(self.mode);
    self.mode = Mode::None;
    Ok(true)
  }

  fn reset_stream(&mut self) {
    self.err = self.strm.reset(self.mode);
  }
}

struct Zlib {
  inner: RefCell<Option<ZlibInner>>,
}

impl deno_core::GarbageCollected for Zlib {}

impl deno_core::Resource for Zlib {
  fn name(&self) -> Cow<'_, str> {
    "zlib".into()
  }
}

#[op2]
#[cppgc]
pub fn op_zlib_new(#[smi] mode: i32) -> Result<Zlib, mode::ModeError> {
  let mode = Mode::try_from(mode)?;

  let inner = ZlibInner {
    mode,
    ..Default::default()
  };

  Ok(Zlib {
    inner: RefCell::new(Some(inner)),
  })
}

#[derive(Debug, thiserror::Error)]
pub enum ZlibError {
  #[error("zlib not initialized")]
  NotInitialized,
  #[error(transparent)]
  Mode(#[from] mode::ModeError),
  #[error(transparent)]
  Other(#[from] deno_core::error::AnyError),
}

#[op2(fast)]
pub fn op_zlib_close(#[cppgc] resource: &Zlib) -> Result<(), ZlibError> {
  let mut resource = resource.inner.borrow_mut();
  let zlib = resource.as_mut().ok_or(ZlibError::NotInitialized)?;

  // If there is a pending write, defer the close until the write is done.
  zlib.close()?;

  Ok(())
}

#[allow(clippy::too_many_arguments)]
#[op2(fast)]
#[smi]
pub fn op_zlib_write(
  #[cppgc] resource: &Zlib,
  #[smi] flush: i32,
  #[buffer] input: &[u8],
  #[smi] in_off: u32,
  #[smi] in_len: u32,
  #[buffer] out: &mut [u8],
  #[smi] out_off: u32,
  #[smi] out_len: u32,
  #[buffer] result: &mut [u32],
) -> Result<i32, ZlibError> {
  let mut zlib = resource.inner.borrow_mut();
  let zlib = zlib.as_mut().ok_or(ZlibError::NotInitialized)?;

  let flush = Flush::try_from(flush)?;
  zlib.start_write(input, in_off, in_len, out, out_off, out_len, flush)?;
  zlib.do_write(flush)?;

  result[0] = zlib.strm.avail_out;
  result[1] = zlib.strm.avail_in;

  Ok(zlib.err)
}

#[op2(fast)]
#[smi]
pub fn op_zlib_init(
  #[cppgc] resource: &Zlib,
  #[smi] level: i32,
  #[smi] window_bits: i32,
  #[smi] mem_level: i32,
  #[smi] strategy: i32,
  #[buffer] dictionary: &[u8],
) -> Result<i32, ZlibError> {
  let mut zlib = resource.inner.borrow_mut();
  let zlib = zlib.as_mut().ok_or(ZlibError::NotInitialized)?;

  check((8..=15).contains(&window_bits), "invalid windowBits")?;
  check((-1..=9).contains(&level), "invalid level")?;

  check((1..=9).contains(&mem_level), "invalid memLevel")?;

  check(
    strategy == Z_DEFAULT_STRATEGY
      || strategy == Z_FILTERED
      || strategy == Z_HUFFMAN_ONLY
      || strategy == Z_RLE
      || strategy == Z_FIXED,
    "invalid strategy",
  )?;

  zlib.level = level;
  zlib.window_bits = window_bits;
  zlib.mem_level = mem_level;
  zlib.strategy = strategy;

  zlib.flush = Flush::None;
  zlib.err = Z_OK;

  zlib.init_stream()?;

  zlib.dictionary = if !dictionary.is_empty() {
    Some(dictionary.to_vec())
  } else {
    None
  };

  Ok(zlib.err)
}

#[op2(fast)]
#[smi]
pub fn op_zlib_reset(#[cppgc] resource: &Zlib) -> Result<i32, ZlibError> {
  let mut zlib = resource.inner.borrow_mut();
  let zlib = zlib.as_mut().ok_or(ZlibError::NotInitialized)?;

  zlib.reset_stream();

  Ok(zlib.err)
}

#[op2(fast)]
pub fn op_zlib_close_if_pending(
  #[cppgc] resource: &Zlib,
) -> Result<(), ZlibError> {
  let pending_close = {
    let mut zlib = resource.inner.borrow_mut();
    let zlib = zlib.as_mut().ok_or(ZlibError::NotInitialized)?;

    zlib.write_in_progress = false;
    zlib.pending_close
  };
  if pending_close {
    if let Some(mut res) = resource.inner.borrow_mut().take() {
      let _ = res.close();
    }
  }

  Ok(())
}

#[op2(fast)]
#[smi]
pub fn op_zlib_crc32(#[buffer] data: &[u8], #[smi] value: u32) -> u32 {
  // SAFETY: `data` is a valid buffer.
  unsafe {
    zlib::crc32(value as c_ulong, data.as_ptr(), data.len() as u32) as u32
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn zlib_start_write() {
    // buffer, length, should pass
    type WriteVector = (&'static [u8], u32, u32, bool);
    const WRITE_VECTORS: [WriteVector; 8] = [
      (b"Hello", 5, 0, true),
      (b"H", 1, 0, true),
      (b"", 0, 0, true),
      // Overrun the buffer
      (b"H", 5, 0, false),
      (b"ello", 5, 0, false),
      (b"Hello", 5, 1, false),
      (b"H", 1, 1, false),
      (b"", 0, 1, false),
    ];

    for (input, len, offset, expected) in WRITE_VECTORS.iter() {
      let mut stream = ZlibInner {
        mode: Mode::Inflate,
        ..Default::default()
      };

      stream.init_stream().unwrap();
      assert_eq!(stream.err, Z_OK);
      assert_eq!(
        stream
          .start_write(input, *offset, *len, &mut [], 0, 0, Flush::None)
          .is_ok(),
        *expected
      );
      assert_eq!(stream.err, Z_OK);
      stream.close().unwrap();
    }
  }
}
