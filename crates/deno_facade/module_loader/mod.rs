use std::path::PathBuf;
use std::rc::Rc;
use std::sync::Arc;

use deno::deno_npm::resolution::ValidSerializedNpmResolutionSnapshot;
use deno::PermissionsContainer;
use deno_core::ModuleLoader;
use eszip_trait::EszipStaticFiles;
use ext_node::NodeExtInitServices;
use fs::virtual_fs::FileBackedVfs;
use url::Url;

use crate::Metadata;

pub mod standalone;
pub mod util;

pub struct RuntimeProviders {
  pub migrated: bool,
  pub module_loader: Rc<dyn ModuleLoader>,
  pub node_services: NodeExtInitServices,
  pub npm_snapshot: Option<ValidSerializedNpmResolutionSnapshot>,
  pub permissions: PermissionsContainer,
  pub metadata: Metadata,
  pub static_files: EszipStaticFiles,
  pub vfs_path: PathBuf,
  pub vfs: Arc<FileBackedVfs>,
  pub base_url: Arc<Url>,
}
