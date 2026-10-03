use deno::deno_permissions::PermissionsOptions;
use ext_workers::context::WorkerKind;

pub fn get_default_permissions(kind: WorkerKind) -> PermissionsOptions {
  match kind {
    WorkerKind::MainWorker | WorkerKind::EventsWorker => PermissionsOptions {
      allow_all: true,
      allow_env: Some(Default::default()),
      allow_net: Some(Default::default()),
      allow_ffi: Some(Default::default()),
      allow_read: Some(Default::default()),
      allow_run: Some(Default::default()),
      allow_sys: Some(Default::default()),
      allow_write: Some(Default::default()),
      allow_import: Some(Default::default()),
      ..Default::default()
    },

    WorkerKind::UserWorker => PermissionsOptions {
      allow_all: false,
      allow_env: Some(Default::default()),
      allow_net: Some(Default::default()),
      allow_read: Some(Default::default()),
      allow_write: Some(Default::default()),
      allow_import: Some(Default::default()),
      allow_sys: Some(vec!["hostname".to_string()]),
      ..Default::default()
    },
  }
}
