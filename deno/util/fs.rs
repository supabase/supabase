// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use std::fs::OpenOptions;
use std::io::Error;
use std::io::ErrorKind;
use std::io::Write;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use deno_config::glob::FileCollector;
use deno_config::glob::FilePatterns;
use deno_config::glob::PathOrPattern;
use deno_config::glob::PathOrPatternSet;
use deno_config::glob::WalkEntry;
use deno_core::anyhow::anyhow;
use deno_core::anyhow::Context;
use deno_core::error::AnyError;
use deno_core::unsync::spawn_blocking;
use deno_core::ModuleSpecifier;
use deno_fs::FileSystem;

use crate::util::path::get_atomic_file_path;

/// Writes the file to the file system at a temporary path, then
/// renames it to the destination in a single sys call in order
/// to never leave the file system in a corrupted state.
///
/// This also handles creating the directory if a NotFound error
/// occurs.
pub fn atomic_write_file_with_retries<T: AsRef<[u8]>>(
  file_path: &Path,
  data: T,
  mode: u32,
) -> std::io::Result<()> {
  struct RealAtomicWriteFileFs {
    mode: u32,
  }

  impl AtomicWriteFileFs for RealAtomicWriteFileFs {
    fn write_file(&self, path: &Path, bytes: &[u8]) -> std::io::Result<()> {
      write_file(path, bytes, self.mode)
    }
    fn rename_file(&self, from: &Path, to: &Path) -> std::io::Result<()> {
      std::fs::rename(from, to)
    }
    fn remove_file(&self, path: &Path) -> std::io::Result<()> {
      std::fs::remove_file(path)
    }
    fn create_dir_all(&self, dir_path: &Path) -> std::io::Result<()> {
      std::fs::create_dir_all(dir_path)
    }
    fn path_exists(&self, path: &Path) -> bool {
      path.exists()
    }
  }

  atomic_write_file_with_retries_and_fs(
    &RealAtomicWriteFileFs { mode },
    file_path,
    data.as_ref(),
  )
}

pub trait AtomicWriteFileFs {
  fn write_file(&self, path: &Path, bytes: &[u8]) -> std::io::Result<()>;
  fn rename_file(&self, from: &Path, to: &Path) -> std::io::Result<()>;
  fn remove_file(&self, path: &Path) -> std::io::Result<()>;
  fn create_dir_all(&self, dir_path: &Path) -> std::io::Result<()>;
  fn path_exists(&self, path: &Path) -> bool;
}

pub struct AtomicWriteFileFsAdapter<'a> {
  pub fs: &'a dyn FileSystem,
  pub write_mode: u32,
}

impl<'a> AtomicWriteFileFs for AtomicWriteFileFsAdapter<'a> {
  fn write_file(&self, path: &Path, bytes: &[u8]) -> std::io::Result<()> {
    self
      .fs
      .write_file_sync(
        path,
        deno_fs::OpenOptions::write(true, false, false, Some(self.write_mode)),
        None,
        bytes,
      )
      .map_err(|e| e.into_io_error())
  }

  fn rename_file(&self, from: &Path, to: &Path) -> std::io::Result<()> {
    self.fs.rename_sync(from, to).map_err(|e| e.into_io_error())
  }

  fn remove_file(&self, path: &Path) -> std::io::Result<()> {
    self
      .fs
      .remove_sync(path, false)
      .map_err(|e| e.into_io_error())
  }

  fn create_dir_all(&self, dir_path: &Path) -> std::io::Result<()> {
    self
      .fs
      .mkdir_sync(dir_path, /* recursive */ true, None)
      .map_err(|e| e.into_io_error())
  }

  fn path_exists(&self, path: &Path) -> bool {
    self.fs.exists_sync(path)
  }
}

pub fn atomic_write_file_with_retries_and_fs<T: AsRef<[u8]>>(
  fs: &impl AtomicWriteFileFs,
  file_path: &Path,
  data: T,
) -> std::io::Result<()> {
  let mut count = 0;
  loop {
    match atomic_write_file(fs, file_path, data.as_ref()) {
      Ok(()) => return Ok(()),
      Err(err) => {
        if count >= 5 {
          // too many retries, return the error
          return Err(err);
        }
        count += 1;
        let sleep_ms = std::cmp::min(50, 10 * count);
        std::thread::sleep(std::time::Duration::from_millis(sleep_ms));
      }
    }
  }
}

/// Writes the file to the file system at a temporary path, then
/// renames it to the destination in a single sys call in order
/// to never leave the file system in a corrupted state.
///
/// This also handles creating the directory if a NotFound error
/// occurs.
fn atomic_write_file(
  fs: &impl AtomicWriteFileFs,
  file_path: &Path,
  data: &[u8],
) -> std::io::Result<()> {
  fn atomic_write_file_raw(
    fs: &impl AtomicWriteFileFs,
    temp_file_path: &Path,
    file_path: &Path,
    data: &[u8],
  ) -> std::io::Result<()> {
    fs.write_file(temp_file_path, data)?;
    fs.rename_file(temp_file_path, file_path)
      .inspect_err(|_err| {
        // clean up the created temp file on error
        let _ = fs.remove_file(temp_file_path);
      })
  }

  let temp_file_path = get_atomic_file_path(file_path);

  if let Err(write_err) =
    atomic_write_file_raw(fs, &temp_file_path, file_path, data)
  {
    if write_err.kind() == ErrorKind::NotFound {
      let parent_dir_path = file_path.parent().unwrap();
      match fs.create_dir_all(parent_dir_path) {
        Ok(()) => {
          return atomic_write_file_raw(fs, &temp_file_path, file_path, data)
            .map_err(|err| add_file_context_to_err(file_path, err));
        }
        Err(create_err) => {
          if !fs.path_exists(parent_dir_path) {
            return Err(Error::new(
              create_err.kind(),
              format!(
                "{:#} (for '{}')\nCheck the permission of the directory.",
                create_err,
                parent_dir_path.display()
              ),
            ));
          }
        }
      }
    }
    return Err(add_file_context_to_err(file_path, write_err));
  }
  Ok(())
}

/// Creates a std::fs::File handling if the parent does not exist.
pub fn create_file(file_path: &Path) -> std::io::Result<std::fs::File> {
  match std::fs::File::create(file_path) {
    Ok(file) => Ok(file),
    Err(err) => {
      if err.kind() == ErrorKind::NotFound {
        let parent_dir_path = file_path.parent().unwrap();
        match std::fs::create_dir_all(parent_dir_path) {
          Ok(()) => {
            return std::fs::File::create(file_path)
              .map_err(|err| add_file_context_to_err(file_path, err));
          }
          Err(create_err) => {
            if !parent_dir_path.exists() {
              return Err(Error::new(
                create_err.kind(),
                format!(
                  "{:#} (for '{}')\nCheck the permission of the directory.",
                  create_err,
                  parent_dir_path.display()
                ),
              ));
            }
          }
        }
      }
      Err(add_file_context_to_err(file_path, err))
    }
  }
}

fn add_file_context_to_err(file_path: &Path, err: Error) -> Error {
  Error::new(
    err.kind(),
    format!("{:#} (for '{}')", err, file_path.display()),
  )
}

pub fn write_file<T: AsRef<[u8]>>(
  filename: &Path,
  data: T,
  mode: u32,
) -> std::io::Result<()> {
  write_file_2(filename, data, true, mode, true, false)
}

pub fn write_file_2<T: AsRef<[u8]>>(
  filename: &Path,
  data: T,
  update_mode: bool,
  mode: u32,
  is_create: bool,
  is_append: bool,
) -> std::io::Result<()> {
  let mut file = OpenOptions::new()
    .read(false)
    .write(true)
    .append(is_append)
    .truncate(!is_append)
    .create(is_create)
    .open(filename)?;

  if update_mode {
    #[cfg(unix)]
    {
      use std::os::unix::fs::PermissionsExt;
      let mode = mode & 0o777;
      let permissions = PermissionsExt::from_mode(mode);
      file.set_permissions(permissions)?;
    }
    #[cfg(not(unix))]
    let _ = mode;
  }

  file.write_all(data.as_ref())
}

/// Similar to `std::fs::canonicalize()` but strips UNC prefixes on Windows.
pub fn canonicalize_path(path: &Path) -> Result<PathBuf, Error> {
  Ok(deno_path_util::strip_unc_prefix(path.canonicalize()?))
}

/// Canonicalizes a path which might be non-existent by going up the
/// ancestors until it finds a directory that exists, canonicalizes
/// that path, then adds back the remaining path components.
///
/// Note: When using this, you should be aware that a symlink may
/// subsequently be created along this path by some other code.
pub fn canonicalize_path_maybe_not_exists(
  path: &Path,
) -> Result<PathBuf, Error> {
  deno_path_util::canonicalize_path_maybe_not_exists(path, &canonicalize_path)
}

pub fn canonicalize_path_maybe_not_exists_with_fs(
  path: &Path,
  fs: &dyn FileSystem,
) -> Result<PathBuf, Error> {
  deno_path_util::canonicalize_path_maybe_not_exists(path, &|path| {
    fs.realpath_sync(path).map_err(|err| err.into_io_error())
  })
}

/// Collects module specifiers that satisfy the given predicate as a file path, by recursively walking `include`.
/// Specifiers that start with http and https are left intact.
/// Note: This ignores all .git and node_modules folders.
pub fn collect_specifiers(
  mut files: FilePatterns,
  vendor_folder: Option<PathBuf>,
  predicate: impl Fn(WalkEntry) -> bool,
) -> Result<Vec<ModuleSpecifier>, AnyError> {
  let mut prepared = vec![];

  // break out the remote specifiers
  if let Some(include_mut) = &mut files.include {
    let includes = std::mem::take(include_mut);
    let path_or_patterns = includes.into_path_or_patterns();
    let mut result = Vec::with_capacity(path_or_patterns.len());
    for path_or_pattern in path_or_patterns {
      match path_or_pattern {
        PathOrPattern::Path(path) => {
          if path.is_dir() {
            result.push(PathOrPattern::Path(path));
          } else if !files.exclude.matches_path(&path) {
            let url = specifier_from_file_path(&path)?;
            prepared.push(url);
          }
        }
        PathOrPattern::NegatedPath(path) => {
          // add it back
          result.push(PathOrPattern::NegatedPath(path));
        }
        PathOrPattern::RemoteUrl(remote_url) => {
          prepared.push(remote_url);
        }
        PathOrPattern::Pattern(pattern) => {
          // add it back
          result.push(PathOrPattern::Pattern(pattern));
        }
      }
    }
    *include_mut = PathOrPatternSet::new(result);
  }

  let collected_files = FileCollector::new(predicate)
    .ignore_git_folder()
    .ignore_node_modules()
    .set_vendor_folder(vendor_folder)
    .collect_file_patterns(&deno_config::fs::RealDenoConfigFs, files)?;
  let mut collected_files_as_urls = collected_files
    .iter()
    .map(|f| specifier_from_file_path(f).unwrap())
    .collect::<Vec<ModuleSpecifier>>();

  collected_files_as_urls.sort();
  prepared.extend(collected_files_as_urls);

  Ok(prepared)
}

/// Asynchronously removes a directory and all its descendants, but does not error
/// when the directory does not exist.
pub async fn remove_dir_all_if_exists(path: &Path) -> std::io::Result<()> {
  let result = tokio::fs::remove_dir_all(path).await;
  match result {
    Err(err) if err.kind() == std::io::ErrorKind::NotFound => Ok(()),
    _ => result,
  }
}

mod clone_dir_imp {

  #[cfg(target_vendor = "apple")]
  mod apple {
    use super::super::copy_dir_recursive;
    use deno_core::error::AnyError;
    use std::os::unix::ffi::OsStrExt;
    use std::path::Path;
    fn clonefile(from: &Path, to: &Path) -> std::io::Result<()> {
      let from = std::ffi::CString::new(from.as_os_str().as_bytes())?;
      let to = std::ffi::CString::new(to.as_os_str().as_bytes())?;
      // SAFETY: `from` and `to` are valid C strings.
      let ret = unsafe { libc::clonefile(from.as_ptr(), to.as_ptr(), 0) };
      if ret != 0 {
        return Err(std::io::Error::last_os_error());
      }
      Ok(())
    }

    pub fn clone_dir_recursive(from: &Path, to: &Path) -> Result<(), AnyError> {
      if let Some(parent) = to.parent() {
        std::fs::create_dir_all(parent)?;
      }
      // Try to clone the whole directory
      if let Err(err) = clonefile(from, to) {
        if err.kind() != std::io::ErrorKind::AlreadyExists {
          log::warn!(
            "Failed to clone dir {:?} to {:?} via clonefile: {}",
            from,
            to,
            err
          );
        }
        // clonefile won't overwrite existing files, so if the dir exists
        // we need to handle it recursively.
        copy_dir_recursive(from, to)?;
      }

      Ok(())
    }
  }

  #[cfg(target_vendor = "apple")]
  pub(super) use apple::clone_dir_recursive;

  #[cfg(not(target_vendor = "apple"))]
  pub(super) fn clone_dir_recursive(
    from: &std::path::Path,
    to: &std::path::Path,
  ) -> Result<(), deno_core::error::AnyError> {
    if let Err(e) = super::hard_link_dir_recursive(from, to) {
      log::debug!("Failed to hard link dir {:?} to {:?}: {}", from, to, e);
      super::copy_dir_recursive(from, to)?;
    }

    Ok(())
  }
}

/// Clones a directory to another directory. The exact method
/// is not guaranteed - it may be a hardlink, copy, or other platform-specific
/// operation.
///
/// Note: Does not handle symlinks.
pub fn clone_dir_recursive(from: &Path, to: &Path) -> Result<(), AnyError> {
  clone_dir_imp::clone_dir_recursive(from, to)
}

/// Copies a directory to another directory.
///
/// Note: Does not handle symlinks.
pub fn copy_dir_recursive(from: &Path, to: &Path) -> Result<(), AnyError> {
  std::fs::create_dir_all(to)
    .with_context(|| format!("Creating {}", to.display()))?;
  let read_dir = std::fs::read_dir(from)
    .with_context(|| format!("Reading {}", from.display()))?;

  for entry in read_dir {
    let entry = entry?;
    let file_type = entry.file_type()?;
    let new_from = from.join(entry.file_name());
    let new_to = to.join(entry.file_name());

    if file_type.is_dir() {
      copy_dir_recursive(&new_from, &new_to).with_context(|| {
        format!("Dir {} to {}", new_from.display(), new_to.display())
      })?;
    } else if file_type.is_file() {
      std::fs::copy(&new_from, &new_to).with_context(|| {
        format!("Copying {} to {}", new_from.display(), new_to.display())
      })?;
    }
  }

  Ok(())
}

/// Hardlinks the files in one directory to another directory.
///
/// Note: Does not handle symlinks.
pub fn hard_link_dir_recursive(from: &Path, to: &Path) -> Result<(), AnyError> {
  std::fs::create_dir_all(to)
    .with_context(|| format!("Creating {}", to.display()))?;
  let read_dir = std::fs::read_dir(from)
    .with_context(|| format!("Reading {}", from.display()))?;

  for entry in read_dir {
    let entry = entry?;
    let file_type = entry.file_type()?;
    let new_from = from.join(entry.file_name());
    let new_to = to.join(entry.file_name());

    if file_type.is_dir() {
      hard_link_dir_recursive(&new_from, &new_to).with_context(|| {
        format!("Dir {} to {}", new_from.display(), new_to.display())
      })?;
    } else if file_type.is_file() {
      // note: chance for race conditions here between attempting to create,
      // then removing, then attempting to create. There doesn't seem to be
      // a way to hard link with overwriting in Rust, but maybe there is some
      // way with platform specific code. The workaround here is to handle
      // scenarios where something else might create or remove files.
      if let Err(err) = std::fs::hard_link(&new_from, &new_to) {
        if err.kind() == ErrorKind::AlreadyExists {
          if let Err(err) = std::fs::remove_file(&new_to) {
            if err.kind() == ErrorKind::NotFound {
              // Assume another process/thread created this hard link to the file we are wanting
              // to remove then sleep a little bit to let the other process/thread move ahead
              // faster to reduce contention.
              std::thread::sleep(Duration::from_millis(10));
            } else {
              return Err(err).with_context(|| {
                format!(
                  "Removing file to hard link {} to {}",
                  new_from.display(),
                  new_to.display()
                )
              });
            }
          }

          // Always attempt to recreate the hardlink. In contention scenarios, the other process
          // might have been killed or exited after removing the file, but before creating the hardlink
          if let Err(err) = std::fs::hard_link(&new_from, &new_to) {
            // Assume another process/thread created this hard link to the file we are wanting
            // to now create then sleep a little bit to let the other process/thread move ahead
            // faster to reduce contention.
            if err.kind() == ErrorKind::AlreadyExists {
              std::thread::sleep(Duration::from_millis(10));
            } else {
              return Err(err).with_context(|| {
                format!(
                  "Hard linking {} to {}",
                  new_from.display(),
                  new_to.display()
                )
              });
            }
          }
        } else {
          return Err(err).with_context(|| {
            format!(
              "Hard linking {} to {}",
              new_from.display(),
              new_to.display()
            )
          });
        }
      }
    }
  }

  Ok(())
}

pub fn symlink_dir(oldpath: &Path, newpath: &Path) -> Result<(), Error> {
  let err_mapper = |err: Error, kind: Option<ErrorKind>| {
    Error::new(
      kind.unwrap_or_else(|| err.kind()),
      format!(
        "{}, symlink '{}' -> '{}'",
        err,
        oldpath.display(),
        newpath.display()
      ),
    )
  };
  #[cfg(unix)]
  {
    use std::os::unix::fs::symlink;
    symlink(oldpath, newpath).map_err(|e| err_mapper(e, None))?;
  }
  #[cfg(not(unix))]
  {
    use std::os::windows::fs::symlink_dir;
    symlink_dir(oldpath, newpath).map_err(|err| {
      if let Some(code) = err.raw_os_error() {
        if code as u32 == winapi::shared::winerror::ERROR_PRIVILEGE_NOT_HELD
          || code as u32 == winapi::shared::winerror::ERROR_INVALID_FUNCTION
        {
          return err_mapper(err, Some(ErrorKind::PermissionDenied));
        }
      }
      err_mapper(err, None)
    })?;
  }
  Ok(())
}

/// Gets the total size (in bytes) of a directory.
pub fn dir_size(path: &Path) -> std::io::Result<u64> {
  let entries = std::fs::read_dir(path)?;
  let mut total = 0;
  for entry in entries {
    let entry = entry?;
    total += match entry.metadata()? {
      data if data.is_dir() => dir_size(&entry.path())?,
      data => data.len(),
    };
  }
  Ok(total)
}

struct LaxSingleProcessFsFlagInner {
  file_path: PathBuf,
  fs_file: std::fs::File,
  finished_token: Arc<tokio_util::sync::CancellationToken>,
}

impl Drop for LaxSingleProcessFsFlagInner {
  fn drop(&mut self) {
    // kill the poll thread
    self.finished_token.cancel();
    // release the file lock
    if let Err(err) = self.fs_file.unlock() {
      log::debug!(
        "Failed releasing lock for {}. {:#}",
        self.file_path.display(),
        err
      );
    }
  }
}

/// A file system based flag that will attempt to synchronize multiple
/// processes so they go one after the other. In scenarios where
/// synchronization cannot be achieved, it will allow the current process
/// to proceed.
///
/// This should only be used in places where it's ideal for multiple
/// processes to not update something on the file system at the same time,
/// but it's not that big of a deal.
pub struct LaxSingleProcessFsFlag(
  #[allow(dead_code)] Option<LaxSingleProcessFsFlagInner>,
);

impl LaxSingleProcessFsFlag {
  pub async fn lock(file_path: PathBuf, _long_wait_message: &str) -> Self {
    log::debug!("Acquiring file lock at {}", file_path.display());
    use fs3::FileExt;
    let last_updated_path = file_path.with_extension("lock.poll");
    let open_result = std::fs::OpenOptions::new()
      .read(true)
      .write(true)
      .create(true)
      .truncate(false)
      .open(&file_path);

    match open_result {
      Ok(fs_file) => {
        let mut error_count = 0;
        while error_count < 10 {
          let lock_result = fs_file.try_lock_exclusive();
          let poll_file_update_ms = 100;
          match lock_result {
            Ok(_) => {
              log::debug!("Acquired file lock at {}", file_path.display());
              let _ignore = std::fs::write(&last_updated_path, "");
              let token = Arc::new(tokio_util::sync::CancellationToken::new());

              // Spawn a blocking task that will continually update a file
              // signalling the lock is alive. This is a fail safe for when
              // a file lock is never released. For example, on some operating
              // systems, if a process does not release the lock (say it's
              // killed), then the OS may release it at an indeterminate time
              //
              // This uses a blocking task because we use a single threaded
              // runtime and this is time sensitive so we don't want it to update
              // at the whims of whatever is occurring on the runtime thread.
              spawn_blocking({
                let token = token.clone();
                let last_updated_path = last_updated_path.clone();
                move || {
                  let mut i = 0;
                  while !token.is_cancelled() {
                    i += 1;
                    let _ignore =
                      std::fs::write(&last_updated_path, i.to_string());
                    std::thread::sleep(Duration::from_millis(
                      poll_file_update_ms,
                    ));
                  }
                }
              });

              return Self(Some(LaxSingleProcessFsFlagInner {
                file_path,
                fs_file,
                finished_token: token,
              }));
            }
            Err(_) => {
              // sleep for a little bit
              tokio::time::sleep(Duration::from_millis(20)).await;

              // Poll the last updated path to check if it's stopped updating,
              // which is an indication that the file lock is claimed, but
              // was never properly released.
              match std::fs::metadata(&last_updated_path)
                .and_then(|p| p.modified())
              {
                Ok(last_updated_time) => {
                  let current_time = std::time::SystemTime::now();
                  match current_time.duration_since(last_updated_time) {
                    Ok(duration) => {
                      if duration.as_millis()
                        > (poll_file_update_ms * 2) as u128
                      {
                        // the other process hasn't updated this file in a long time
                        // so maybe it was killed and the operating system hasn't
                        // released the file lock yet
                        return Self(None);
                      } else {
                        error_count = 0; // reset
                      }
                    }
                    Err(_) => {
                      error_count += 1;
                    }
                  }
                }
                Err(_) => {
                  error_count += 1;
                }
              }
            }
          }
        }

        Self(None)
      }
      Err(err) => {
        log::debug!(
          "Failed to open file lock at {}. {:#}",
          file_path.display(),
          err
        );
        Self(None) // let the process through
      }
    }
  }
}

pub fn specifier_from_file_path(
  path: &Path,
) -> Result<ModuleSpecifier, AnyError> {
  ModuleSpecifier::from_file_path(path)
    .map_err(|_| anyhow!("Invalid file path '{}'", path.display()))
}
