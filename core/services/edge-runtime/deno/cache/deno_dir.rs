// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use once_cell::sync::OnceCell;

use super::DiskCache;

use std::env;
use std::path::PathBuf;

/// Lazily creates the deno dir which might be useful in scenarios
/// where functionality wants to continue if the DENO_DIR can't be created.
pub struct DenoDirProvider {
  maybe_custom_root: Option<PathBuf>,
  deno_dir: OnceCell<std::io::Result<DenoDir>>,
}

impl DenoDirProvider {
  pub fn new(maybe_custom_root: Option<PathBuf>) -> Self {
    Self {
      maybe_custom_root,
      deno_dir: Default::default(),
    }
  }

  pub fn get_or_create(&self) -> Result<&DenoDir, std::io::Error> {
    self
      .deno_dir
      .get_or_init(|| DenoDir::new(self.maybe_custom_root.clone()))
      .as_ref()
      .map_err(|err| std::io::Error::new(err.kind(), err.to_string()))
  }
}

/// `DenoDir` serves as coordinator for multiple `DiskCache`s containing them
/// in single directory that can be controlled with `$DENO_DIR` env variable.
#[derive(Debug, Clone)]
pub struct DenoDir {
  /// Example: /Users/rld/.deno/
  pub root: PathBuf,
  /// Used by TsCompiler to cache compiler output.
  pub gen_cache: DiskCache,
}

impl DenoDir {
  pub fn new(maybe_custom_root: Option<PathBuf>) -> std::io::Result<Self> {
    let maybe_custom_root =
      maybe_custom_root.or_else(|| env::var("DENO_DIR").map(String::into).ok());
    let root: PathBuf = if let Some(root) = maybe_custom_root {
      root
    } else if let Some(cache_dir) = dirs::cache_dir() {
      // We use the OS cache dir because all files deno writes are cache files
      // Once that changes we need to start using different roots if DENO_DIR
      // is not set, and keep a single one if it is.
      cache_dir.join("deno")
    } else if let Some(home_dir) = dirs::home_dir() {
      // fallback path
      home_dir.join(".deno")
    } else {
      panic!("Could not set the Deno root directory")
    };
    let root = if root.is_absolute() {
      root
    } else {
      std::env::current_dir()?.join(root)
    };
    assert!(root.is_absolute());
    let gen_path = root.join("gen");

    let deno_dir = Self {
      root,
      gen_cache: DiskCache::new(&gen_path),
    };

    Ok(deno_dir)
  }

  /// The root directory of the DENO_DIR for display purposes only.
  pub fn root_path_for_display(&self) -> std::path::Display<'_> {
    self.root.display()
  }

  /// Path for the V8 code cache.
  pub fn code_cache_db_file_path(&self) -> PathBuf {
    // bump this version name to invalidate the entire cache
    self.root.join("v8_code_cache_v2")
  }

  /// Path for the incremental cache used for formatting.
  pub fn fmt_incremental_cache_db_file_path(&self) -> PathBuf {
    // bump this version name to invalidate the entire cache
    self.root.join("fmt_incremental_cache_v2")
  }

  /// Path for the incremental cache used for linting.
  pub fn lint_incremental_cache_db_file_path(&self) -> PathBuf {
    // bump this version name to invalidate the entire cache
    self.root.join("lint_incremental_cache_v2")
  }

  /// Path for caching swc dependency analysis.
  pub fn dep_analysis_db_file_path(&self) -> PathBuf {
    // bump this version name to invalidate the entire cache
    self.root.join("dep_analysis_cache_v2")
  }

  /// Path for the cache used for fast check.
  pub fn fast_check_cache_db_file_path(&self) -> PathBuf {
    // bump this version name to invalidate the entire cache
    self.root.join("fast_check_cache_v2")
  }

  /// Path for caching node analysis.
  pub fn node_analysis_db_file_path(&self) -> PathBuf {
    // bump this version name to invalidate the entire cache
    self.root.join("node_analysis_cache_v2")
  }

  /// Path for the cache used for type checking.
  pub fn type_checking_cache_db_file_path(&self) -> PathBuf {
    // bump this version name to invalidate the entire cache
    self.root.join("check_cache_v2")
  }

  /// Path to the registries cache, used for the lps.
  pub fn registries_folder_path(&self) -> PathBuf {
    self.root.join("registries")
  }

  /// Path to the remote cache folder.
  pub fn remote_folder_path(&self) -> PathBuf {
    self.root.join("remote")
  }

  /// Path to the origin data cache folder.
  pub fn origin_data_folder_path(&self) -> PathBuf {
    // TODO(@crowlKats): change to origin_data for 2.0
    self.root.join("location_data")
  }

  /// File used for the upgrade checker.
  pub fn upgrade_check_file_path(&self) -> PathBuf {
    self.root.join("latest.txt")
  }

  /// Folder used for the npm cache.
  pub fn npm_folder_path(&self) -> PathBuf {
    self.root.join("npm")
  }

  /// Path used for the REPL history file.
  /// Can be overridden or disabled by setting `DENO_REPL_HISTORY` environment variable.
  pub fn repl_history_file_path(&self) -> Option<PathBuf> {
    if let Some(deno_repl_history) = env::var_os("DENO_REPL_HISTORY") {
      if deno_repl_history.is_empty() {
        None
      } else {
        Some(PathBuf::from(deno_repl_history))
      }
    } else {
      Some(self.root.join("deno_history.txt"))
    }
  }

  /// Folder path used for downloading new versions of deno.
  pub fn dl_folder_path(&self) -> PathBuf {
    self.root.join("dl")
  }
}

/// To avoid the poorly managed dirs crate
#[cfg(not(windows))]
pub mod dirs {
  use std::path::PathBuf;

  pub fn cache_dir() -> Option<PathBuf> {
    if cfg!(target_os = "macos") {
      home_dir().map(|h| h.join("Library/Caches"))
    } else {
      std::env::var_os("XDG_CACHE_HOME")
        .map(PathBuf::from)
        .or_else(|| home_dir().map(|h| h.join(".cache")))
    }
  }

  pub fn home_dir() -> Option<PathBuf> {
    std::env::var_os("HOME")
      .filter(|h| !h.is_empty())
      .or_else(|| {
        // TODO(bartlomieju):
        #[allow(clippy::undocumented_unsafe_blocks)]
        unsafe {
          fallback()
        }
      })
      .map(PathBuf::from)
  }

  // This piece of code is taken from the deprecated home_dir() function in Rust's standard library: https://github.com/rust-lang/rust/blob/master/src/libstd/sys/unix/os.rs#L579
  // The same code is used by the dirs crate
  unsafe fn fallback() -> Option<std::ffi::OsString> {
    let amt = match libc::sysconf(libc::_SC_GETPW_R_SIZE_MAX) {
      n if n < 0 => 512_usize,
      n => n as usize,
    };
    let mut buf = Vec::with_capacity(amt);
    let mut passwd: libc::passwd = std::mem::zeroed();
    let mut result = std::ptr::null_mut();
    match libc::getpwuid_r(
      libc::getuid(),
      &mut passwd,
      buf.as_mut_ptr(),
      buf.capacity(),
      &mut result,
    ) {
      0 if !result.is_null() => {
        let ptr = passwd.pw_dir as *const _;
        let bytes = std::ffi::CStr::from_ptr(ptr).to_bytes().to_vec();
        Some(std::os::unix::ffi::OsStringExt::from_vec(bytes))
      }
      _ => None,
    }
  }
}
