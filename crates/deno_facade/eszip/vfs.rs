use std::collections::BTreeMap;
use std::collections::VecDeque;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Arc;

use anyhow::Context;
use deno::deno_npm::NpmSystemInfo;
use deno::npm::CliNpmResolver;
use deno::npm::InnerCliNpmResolverRef;
use deno::DenoOptions;
use deno_core::error::AnyError;
use eszip_trait::AsyncEszipDataRead;
use fs::virtual_fs::FileBackedVfs;
use fs::virtual_fs::VfsBuilder;
use fs::virtual_fs::VfsEntry;
use fs::virtual_fs::VfsRoot;
use fs::virtual_fs::VirtualDirectory;
use fs::VfsOpts;

pub fn load_npm_vfs(
  eszip: Arc<dyn AsyncEszipDataRead + 'static>,
  root_dir_path: PathBuf,
  maybe_virtual_dir: Option<VirtualDirectory>,
) -> Result<FileBackedVfs, AnyError> {
  let fs_root: VfsRoot = if let Some(mut dir) = maybe_virtual_dir {
    // align the name of the directory with the root dir
    dir.name = root_dir_path
      .file_name()
      .unwrap()
      .to_string_lossy()
      .to_string();

    VfsRoot {
      dir,
      root_path: root_dir_path,
    }
  } else {
    VfsRoot {
      dir: VirtualDirectory {
        name: "".to_string(),
        entries: vec![],
      },
      root_path: root_dir_path,
    }
  };

  Ok(FileBackedVfs::new(eszip, fs_root))
}

pub fn build_npm_vfs<'scope, F>(
  opts: VfsOpts,
  deno_options: Arc<DenoOptions>,
  add_content_callback_fn: F,
) -> Result<VfsBuilder<'scope>, AnyError>
where
  F: (for<'r> FnMut(&'r Path, &'r str, Vec<u8>) -> String) + 'scope,
{
  match opts.npm_resolver.as_inner() {
    InnerCliNpmResolverRef::Managed(npm_resolver) => {
      if let Some(node_modules_path) = npm_resolver.root_node_modules_path() {
        let mut builder = VfsBuilder::new(
          node_modules_path.to_path_buf(),
          add_content_callback_fn,
        )?;

        builder.add_dir_recursive(node_modules_path)?;
        Ok(builder)
      } else {
        // DO NOT include the user's registry url as it may contain credentials,
        // but also don't make this dependent on the registry url
        let global_cache_root_path = npm_resolver.global_cache_root_path();
        let mut builder = VfsBuilder::new(
          global_cache_root_path.to_path_buf(),
          add_content_callback_fn,
        )?;
        let mut packages =
          npm_resolver.all_system_packages(&NpmSystemInfo::default());
        packages.sort_by(|a, b| a.id.cmp(&b.id));
        for package in packages {
          let folder =
            npm_resolver.resolve_pkg_folder_from_pkg_id(&package.id)?;
          builder.add_dir_recursive(&folder)?;
        }

        // Flatten all the registries folders into a single "node_modules/localhost" folder
        // that will be used by denort when loading the npm cache. This avoids us exposing
        // the user's private registry information and means we don't have to bother
        // serializing all the different registry config into the binary.
        builder.with_root_dir(|root_dir| {
          root_dir.name = "node_modules".to_string();
          let mut new_entries = Vec::with_capacity(root_dir.entries.len());
          let mut localhost_entries = BTreeMap::new();
          for entry in std::mem::take(&mut root_dir.entries) {
            match entry {
              VfsEntry::Dir(dir) => {
                for entry in dir.entries {
                  log::debug!("Flattening {} into node_modules", entry.name());
                  if let Some(existing) =
                    localhost_entries.insert(entry.name().to_string(), entry)
                  {
                    panic!(
                      "Unhandled scenario where a duplicate entry was found: {:?}",
                      existing
                    );
                  }
                }
              }
              VfsEntry::File(_) | VfsEntry::Symlink(_) => {
                new_entries.push(entry);
              }
            }
          }
          new_entries.push(VfsEntry::Dir(VirtualDirectory {
            name: "localhost".to_string(),
            entries: localhost_entries.into_values().collect(),
          }));
          // needs to be sorted by name
          new_entries.sort_by(|a, b| a.name().cmp(b.name()));
          root_dir.entries = new_entries;
        });

        Ok(builder)
      }
    }
    InnerCliNpmResolverRef::Byonm(_) => {
      let mut builder =
        VfsBuilder::new(opts.root_path.clone(), add_content_callback_fn)?;
      for pkg_json in deno_options.workspace().package_jsons() {
        builder.add_file_at_path(&pkg_json.path)?;
      }
      // traverse and add all the node_modules directories in the workspace
      let mut pending_dirs = VecDeque::new();
      pending_dirs
        .push_back(deno_options.workspace().root_dir().to_file_path().unwrap());
      while let Some(pending_dir) = pending_dirs.pop_front() {
        let mut entries = std::fs::read_dir(&pending_dir)
          .with_context(|| {
            format!("Failed reading: {}", pending_dir.display())
          })?
          .collect::<Result<Vec<_>, _>>()?;
        entries.sort_by_cached_key(|entry| entry.file_name()); // determinism
        for entry in entries {
          let path = entry.path();
          if !path.is_dir() {
            continue;
          }
          if path.ends_with("node_modules") {
            builder.add_dir_recursive(&path)?;
          } else {
            pending_dirs.push_back(path);
          }
        }
      }
      Ok(builder)
    }
  }
}
