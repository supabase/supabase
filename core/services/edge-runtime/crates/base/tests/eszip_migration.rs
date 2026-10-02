use std::borrow::Cow;
use std::fs::read_dir;
use std::path::Path;
use std::path::PathBuf;

use anyhow::anyhow;
use anyhow::bail;
use base::worker::TerminationToken;
use base::worker::WorkerSurfaceBuilder;
use deno::deno_ast::MediaType;
use deno_core::error::AnyError;
use deno_core::serde_json;
use deno_core::serde_json::json;
use deno_core::ModuleSpecifier;
use deno_facade::migrate;
use deno_facade::payload_to_eszip;
use deno_facade::EszipPayloadKind;
use eszip::v2::EszipV2Module;
use eszip::v2::EszipV2SourceSlot;
use ext_event_worker::events::WorkerEventWithMetadata;
use ext_event_worker::events::WorkerEvents;
use ext_workers::context::UserWorkerMsgs;
use ext_workers::context::UserWorkerRuntimeOpts;
use ext_workers::context::WorkerContextInitOpts;
use ext_workers::context::WorkerRuntimeOpts;
use tokio::fs::read;
use tokio::fs::write;
use tokio::sync::mpsc;
use uuid::Uuid;

#[tokio::test]
async fn test_eszip_migration() {
  let paths = get_testdata_paths().unwrap();
  let mut passed = 0;
  let mut failed = 0;
  let mut snapshot_created = 0;
  let mut diff_msgs = vec![];

  println!("running {} eszip tests", paths.len());
  for path in paths {
    assert!(path.is_file());
    let result = test_eszip_migration_inner(&path).await;
    let snapshot_path =
      PathBuf::from(format!("{}.snapshot", path.to_string_lossy()));
    print!("eszip test {} ... ", path.to_string_lossy());
    let expected = match result {
      Ok(_) => String::new(),
      Err(err) => format!("{err:#}"),
    };
    let buf = expected.as_bytes();
    let is_tolerable = String::from_utf8_lossy(buf)
      .contains("migration is not supported for this version: 2.0");
    if !snapshot_path.exists() || is_tolerable {
      write(snapshot_path, buf).await.unwrap();
      println!("snapshot created");
      passed += 1;
      snapshot_created += 1;
    } else {
      let snapshot_buf = read(&snapshot_path).await.unwrap();
      if snapshot_buf == buf {
        println!("ok");
        passed += 1;
      } else {
        println!("FAILED");
        diff_msgs.push(format!("{}", snapshot_path.to_string_lossy()).into());
        diff_msgs.push(Cow::Borrowed("--------------------"));
        diff_msgs.extend(
          render_diff(
            &String::from_utf8_lossy(&snapshot_buf),
            &String::from_utf8_lossy(buf),
          )
          .map(Cow::Owned),
        );
        diff_msgs.push(Cow::Borrowed("\n"));
        failed += 1;
      }
    }
  }
  let status = if failed > 0 { "FAILED" } else { "ok" };
  let msg =
      format!("eszip test result: {status}. {passed} passed ({snapshot_created} snapshot created); {failed} failed");
  if failed > 0 {
    for line in diff_msgs {
      eprintln!("{line}");
    }
    panic!("{msg}");
  } else {
    eprintln!("{msg}");
  }
}

async fn test_eszip_migration_inner<P>(path: P) -> Result<(), AnyError>
where
  P: AsRef<Path>,
{
  let buf = read(path.as_ref()).await?;
  let eszip = EszipPayloadKind::VecKind(buf.clone());
  let metadata_path =
    PathBuf::from(format!("{}.metadata", path.as_ref().to_string_lossy()));
  let metadata = if metadata_path.exists() {
    let buf = read(metadata_path).await?;
    Some(serde_json::from_slice::<serde_json::Value>(&buf)?)
  } else {
    None
  }
  .unwrap_or(serde_json::Value::Object(Default::default()));
  let capture_event_loop_error =
    get_bool_from_json_value(&metadata, "captureEventLoopError")
      .unwrap_or_default();
  let (tx, rx) = if capture_event_loop_error {
    let (tx, rx) = mpsc::unbounded_channel::<WorkerEventWithMetadata>();
    (Some(tx), Some(rx))
  } else {
    (None, None)
  };
  let (maybe_entrypoint, maybe_import_map_path) =
    guess_eszip_entrypoint_and_import_map_path(&metadata, buf).await?;
  let termination_token = TerminationToken::new();
  let (pool_msg_tx, mut pool_msg_rx) = mpsc::unbounded_channel();
  let worker_surface = WorkerSurfaceBuilder::new()
    .termination_token(termination_token.clone())
    .eager_module_init(true)
    .init_opts(WorkerContextInitOpts {
      pool_key: None,
      service_path: PathBuf::from("meow"),
      no_module_cache: false,
      no_npm: None,
      // XXX: This seems insufficient as it may rely on the env contained in
      // Edge Functions' metadata.
      env_vars: std::env::vars().collect(),
      conf: WorkerRuntimeOpts::UserWorker(UserWorkerRuntimeOpts {
        service_path: Some(String::from("meow")),
        key: Some(Uuid::new_v4()),
        pool_msg_tx: Some(pool_msg_tx),
        events_msg_tx: tx,
        cancel: None,
        context: json!({
          "importMapPath": maybe_import_map_path
        })
        .as_object()
        .cloned(),
        ..Default::default()
      }),
      static_patterns: vec![],
      timing: None,
      maybe_eszip: Some(eszip),
      maybe_module_code: None,
      maybe_entrypoint,
      maybe_s3_fs_config: None,
      maybe_tmp_fs_config: None,
      maybe_otel_config: None,
    })
    .build()
    .await;

  tokio::spawn({
    let token = termination_token.clone();
    async move {
      while let Some(msg) = pool_msg_rx.recv().await {
        if matches!(msg, UserWorkerMsgs::Shutdown(_)) {
          token.outbound.cancel();
          break;
        }
      }
    }
  });

  termination_token.cancel_and_wait().await;
  worker_surface.map(|_| ())?;

  if let Some(mut rx) = rx {
    rx.close();
    let mut msgs = vec![];
    while let Some(msg) = rx.recv().await {
      msgs.push(msg);
    }
    for msg in msgs {
      match msg.event {
        WorkerEvents::BootFailure(ev) => return Err(anyhow!(ev.msg)),
        WorkerEvents::UncaughtException(ev) => {
          return Err(anyhow!(ev.exception))
        }
        _ => {}
      }
    }
  }

  Ok(())
}

async fn guess_eszip_entrypoint_and_import_map_path(
  metadata: &serde_json::Value,
  buf: Vec<u8>,
) -> Result<(Option<String>, Option<String>), AnyError> {
  let (metadata_entrypoint, metadata_import_map_path) = (
    get_str_from_json_value(metadata, "entrypoint"),
    get_str_from_json_value(metadata, "importMap"),
  );
  let mut eszip = migrate::try_migrate_if_needed(
    payload_to_eszip(EszipPayloadKind::VecKind(buf)).await?,
    None,
  )
  .await?;

  eszip.ensure_read_all().await?;

  let entries = eszip.modules.0.lock().unwrap();
  let import_map_path = metadata_import_map_path.or(
    entries
      .keys()
      .find(|it| {
        it.starts_with("file://")
          && (it.ends_with("import_map.json") || it.ends_with("deno.json"))
      })
      .cloned(),
  );
  let has_inline_source_code = entries
    .keys()
    .any(|it| it == eszip_trait::v1::SOURCE_CODE_ESZIP_KEY);

  // for (key, value) in entries.iter() {
  //     if !key.starts_with("file://") {
  //         continue;
  //     }
  //     let EszipV2Module::Module {
  //         source: EszipV2SourceSlot::Ready(buf),
  //         ..
  //     } = value
  //     else {
  //         continue;
  //     };
  //     let source = String::from_utf8_lossy(buf);
  //     println!("--");
  //     println!("{key}");
  //     println!("{source}");
  //     println!("--");
  // }

  let mut indexes = vec![];
  if let Some(entrypoint) =
    metadata_entrypoint.and_then(|it| ModuleSpecifier::parse(&it).ok())
  {
    indexes.push(entrypoint);
  } else {
    for key in entries.keys() {
      if !key.starts_with("file://") {
        continue;
      }
      let Ok(key) = ModuleSpecifier::parse(key) else {
        continue;
      };
      let Ok(path) = key.to_file_path() else {
        continue;
      };
      match MediaType::from_path(&path) {
        MediaType::JavaScript
        | MediaType::Mjs
        | MediaType::Jsx
        | MediaType::TypeScript
        | MediaType::Tsx => {}
        _ => continue,
      }
      if path.file_stem().unwrap() == "index" {
        indexes.push(key);
      }
    }
  }
  if has_inline_source_code && indexes.len() != 1 {
    let value = entries.get(eszip_trait::v1::SOURCE_CODE_ESZIP_KEY).unwrap();
    let EszipV2Module::Module {
      source: EszipV2SourceSlot::Ready(buf),
      ..
    } = value
    else {
      bail!("invalid inline source code");
    };
    let code = String::from_utf8_lossy(buf);
    for (key, value) in entries.iter() {
      if !key.starts_with("file://") {
        continue;
      }
      let EszipV2Module::Module {
        source: EszipV2SourceSlot::Ready(buf),
        ..
      } = value
      else {
        continue;
      };
      let target = String::from_utf8_lossy(buf);
      if code == target
        || target.starts_with(&*code)
        || code.starts_with(&*target)
      {
        return Ok((Some(key.clone()), import_map_path));
      }
    }
    Ok((Some(String::from("file:///src/index.ts")), import_map_path))
  } else if indexes.len() != 1 {
    Ok((Some(String::from("file:///src/index.ts")), import_map_path))
  } else {
    Ok((Some(indexes.first().unwrap().to_string()), import_map_path))
  }
}

fn get_testdata_paths() -> Result<Vec<PathBuf>, AnyError> {
  let mut paths = vec![];
  let dir_path = std::env::var("TESTDATA_DIR")
    .map(PathBuf::from)
    .unwrap_or(PathBuf::from("./tests/fixture/testdata"));
  if !dir_path.exists() || !dir_path.is_dir() {
    return Ok(paths);
  }
  let dir = read_dir(dir_path)?;
  for entry in dir {
    let entry = entry?;
    let path = entry.path();
    let metadata = entry.metadata()?;
    let filename = entry.file_name();
    let filename = filename.to_string_lossy();
    if metadata.is_file()
      && (!filename.ends_with(".snapshot") && !filename.ends_with(".metadata"))
    {
      paths.push(path);
    }
  }
  Ok(paths)
}

fn get_str_from_json_value(
  value: &serde_json::Value,
  key: &str,
) -> Option<String> {
  value
    .get(key)
    .and_then(|it| it.as_str().map(str::to_string))
}

fn get_bool_from_json_value(
  value: &serde_json::Value,
  key: &str,
) -> Option<bool> {
  value.get(key).and_then(|it| it.as_bool())
}

fn render_diff<'l>(
  left: &'l str,
  right: &'l str,
) -> impl Iterator<Item = String> + 'l {
  diff::lines(left, right).into_iter().map(|it| match it {
    diff::Result::Left(l) => format!("-{l}"),
    diff::Result::Both(l, _) => format!(" {l}"),
    diff::Result::Right(r) => format!("+{r}"),
  })
}
