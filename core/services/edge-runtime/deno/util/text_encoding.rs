// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use std::borrow::Cow;
use std::ops::Range;
use std::sync::Arc;

use base64::prelude::BASE64_STANDARD;
use base64::Engine;
use deno_core::ModuleSourceCode;

static SOURCE_MAP_PREFIX: &[u8] =
  b"//# sourceMappingURL=data:application/json;base64,";

#[inline(always)]
pub fn from_utf8_lossy_cow(bytes: Cow<[u8]>) -> Cow<str> {
  match bytes {
    Cow::Borrowed(bytes) => String::from_utf8_lossy(bytes),
    Cow::Owned(bytes) => Cow::Owned(from_utf8_lossy_owned(bytes)),
  }
}

#[inline(always)]
pub fn from_utf8_lossy_owned(bytes: Vec<u8>) -> String {
  match String::from_utf8_lossy(&bytes) {
    Cow::Owned(code) => code,
    // SAFETY: `String::from_utf8_lossy` guarantees that the result is valid
    // UTF-8 if `Cow::Borrowed` is returned.
    Cow::Borrowed(_) => unsafe { String::from_utf8_unchecked(bytes) },
  }
}

pub fn source_map_from_code(code: &[u8]) -> Option<Vec<u8>> {
  let range = find_source_map_range(code)?;
  let source_map_range = &code[range];
  let input = source_map_range.split_at(SOURCE_MAP_PREFIX.len()).1;
  let decoded_map = BASE64_STANDARD.decode(input).ok()?;
  Some(decoded_map)
}

/// Truncate the source code before the source map.
pub fn code_without_source_map(code: ModuleSourceCode) -> ModuleSourceCode {
  use deno_core::ModuleCodeBytes;

  match code {
    ModuleSourceCode::String(mut code) => {
      if let Some(range) = find_source_map_range(code.as_bytes()) {
        code.truncate(range.start);
      }
      ModuleSourceCode::String(code)
    }
    ModuleSourceCode::Bytes(code) => {
      if let Some(range) = find_source_map_range(code.as_bytes()) {
        let source_map_index = range.start;
        ModuleSourceCode::Bytes(match code {
          ModuleCodeBytes::Static(bytes) => {
            ModuleCodeBytes::Static(&bytes[..source_map_index])
          }
          ModuleCodeBytes::Boxed(bytes) => {
            // todo(dsherret): should be possible without cloning
            ModuleCodeBytes::Boxed(
              bytes[..source_map_index].to_vec().into_boxed_slice(),
            )
          }
          ModuleCodeBytes::Arc(bytes) => ModuleCodeBytes::Boxed(
            bytes[..source_map_index].to_vec().into_boxed_slice(),
          ),
        })
      } else {
        ModuleSourceCode::Bytes(code)
      }
    }
  }
}

fn find_source_map_range(code: &[u8]) -> Option<Range<usize>> {
  fn last_non_blank_line_range(code: &[u8]) -> Option<Range<usize>> {
    let mut hit_non_whitespace = false;
    let mut range_end = code.len();
    for i in (0..code.len()).rev() {
      match code[i] {
        b' ' | b'\t' => {
          if !hit_non_whitespace {
            range_end = i;
          }
        }
        b'\n' | b'\r' => {
          if hit_non_whitespace {
            return Some(i + 1..range_end);
          }
          range_end = i;
        }
        _ => {
          hit_non_whitespace = true;
        }
      }
    }
    None
  }

  let range = last_non_blank_line_range(code)?;
  if code[range.start..range.end].starts_with(SOURCE_MAP_PREFIX) {
    Some(range)
  } else {
    None
  }
}

/// Converts an `Arc<str>` to an `Arc<[u8]>`.
#[allow(dead_code)]
pub fn arc_str_to_bytes(arc_str: Arc<str>) -> Arc<[u8]> {
  let raw = Arc::into_raw(arc_str);
  // SAFETY: This is safe because they have the same memory layout.
  unsafe { Arc::from_raw(raw as *const [u8]) }
}

/// Converts an `Arc<u8>` to an `Arc<str>` if able.
#[allow(dead_code)]
pub fn arc_u8_to_arc_str(
  arc_u8: Arc<[u8]>,
) -> Result<Arc<str>, std::str::Utf8Error> {
  // Check that the string is valid UTF-8.
  std::str::from_utf8(&arc_u8)?;
  // SAFETY: the string is valid UTF-8, and the layout Arc<[u8]> is the same as
  // Arc<str>. This is proven by the From<Arc<str>> impl for Arc<[u8]> from the
  // standard library.
  Ok(unsafe {
    std::mem::transmute::<std::sync::Arc<[u8]>, std::sync::Arc<str>>(arc_u8)
  })
}
