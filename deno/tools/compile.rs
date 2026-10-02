// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use deno_core::ModuleSpecifier;

pub fn resolve_root_dir_from_specifiers<'a>(
  starting_dir: &ModuleSpecifier,
  specifiers: impl Iterator<Item = &'a ModuleSpecifier>,
) -> ModuleSpecifier {
  fn select_common_root<'a>(a: &'a str, b: &'a str) -> &'a str {
    let min_length = a.len().min(b.len());

    let mut last_slash = 0;
    for i in 0..min_length {
      if a.as_bytes()[i] == b.as_bytes()[i] && a.as_bytes()[i] == b'/' {
        last_slash = i;
      } else if a.as_bytes()[i] != b.as_bytes()[i] {
        break;
      }
    }

    // Return the common root path up to the last common slash.
    // This returns a slice of the original string 'a', up to and including the last matching '/'.
    let common = &a[..=last_slash];
    if cfg!(windows) && common == "file:///" {
      a
    } else {
      common
    }
  }

  fn is_file_system_root(url: &str) -> bool {
    let Some(path) = url.strip_prefix("file:///") else {
      return false;
    };
    if cfg!(windows) {
      let Some((_drive, path)) = path.split_once('/') else {
        return true;
      };
      path.is_empty()
    } else {
      path.is_empty()
    }
  }

  let mut found_dir = starting_dir.as_str();
  if !is_file_system_root(found_dir) {
    for specifier in specifiers {
      if specifier.scheme() == "file" {
        found_dir = select_common_root(found_dir, specifier.as_str());
      }
    }
  }
  let found_dir = if is_file_system_root(found_dir) {
    found_dir
  } else {
    // include the parent dir name because it helps create some context
    found_dir
      .strip_suffix('/')
      .unwrap_or(found_dir)
      .rfind('/')
      .map(|i| &found_dir[..i + 1])
      .unwrap_or(found_dir)
  };
  ModuleSpecifier::parse(found_dir).unwrap()
}
