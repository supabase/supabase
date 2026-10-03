// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use super::CACHE_PERM;
use crate::util::fs::atomic_write_file_with_retries;

use deno_cache_dir::url_to_filename;
use deno_core::url::Host;
use deno_core::url::Url;
use std::ffi::OsStr;
use std::fs;
use std::path::Component;
use std::path::Path;
use std::path::PathBuf;
use std::path::Prefix;
use std::str;

#[derive(Debug, Clone)]
pub struct DiskCache {
  pub location: PathBuf,
}

impl DiskCache {
  /// `location` must be an absolute path.
  pub fn new(location: &Path) -> Self {
    assert!(location.is_absolute());
    Self {
      location: location.to_owned(),
    }
  }

  fn get_cache_filename(&self, url: &Url) -> Option<PathBuf> {
    let mut out = PathBuf::new();

    let scheme = url.scheme();
    out.push(scheme);

    match scheme {
      "wasm" => {
        let host = url.host_str().unwrap();
        let host_port = match url.port() {
          // Windows doesn't support ":" in filenames, so we represent port using a
          // special string.
          Some(port) => format!("{host}_PORT{port}"),
          None => host.to_string(),
        };
        out.push(host_port);

        for path_seg in url.path_segments().unwrap() {
          out.push(path_seg);
        }
      }
      "http" | "https" | "data" | "blob" => out = url_to_filename(url).ok()?,
      "file" => {
        let path = match url.to_file_path() {
          Ok(path) => path,
          Err(_) => return None,
        };
        let mut path_components = path.components();

        if cfg!(target_os = "windows") {
          if let Some(Component::Prefix(prefix_component)) =
            path_components.next()
          {
            // Windows doesn't support ":" in filenames, so we need to extract disk prefix
            // Example: file:///C:/deno/js/unit_test_runner.ts
            // it should produce: file\c\deno\js\unit_test_runner.ts
            match prefix_component.kind() {
              Prefix::Disk(disk_byte) | Prefix::VerbatimDisk(disk_byte) => {
                let disk = (disk_byte as char).to_string();
                out.push(disk);
              }
              Prefix::UNC(server, share)
              | Prefix::VerbatimUNC(server, share) => {
                out.push("UNC");
                let host = Host::parse(server.to_str().unwrap()).unwrap();
                let host = host.to_string().replace(':', "_");
                out.push(host);
                out.push(share);
              }
              _ => unreachable!(),
            }
          }
        }

        // Must be relative, so strip forward slash
        let mut remaining_components = path_components.as_path();
        if let Ok(stripped) = remaining_components.strip_prefix("/") {
          remaining_components = stripped;
        };

        out = out.join(remaining_components);
      }
      _ => return None,
    };

    Some(out)
  }

  pub fn get_cache_filename_with_extension(
    &self,
    url: &Url,
    extension: &str,
  ) -> Option<PathBuf> {
    let base = self.get_cache_filename(url)?;

    match base.extension() {
      None => Some(base.with_extension(extension)),
      Some(ext) => {
        let original_extension = OsStr::to_str(ext).unwrap();
        let final_extension = format!("{original_extension}.{extension}");
        Some(base.with_extension(final_extension))
      }
    }
  }

  pub fn get(&self, filename: &Path) -> std::io::Result<Vec<u8>> {
    let path = self.location.join(filename);
    fs::read(path)
  }

  pub fn set(&self, filename: &Path, data: &[u8]) -> std::io::Result<()> {
    let path = self.location.join(filename);
    atomic_write_file_with_retries(&path, data, CACHE_PERM)
  }
}
