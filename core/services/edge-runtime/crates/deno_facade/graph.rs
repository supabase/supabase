use std::path::PathBuf;
use std::sync::Arc;

use anyhow::anyhow;
use anyhow::Context;
use deno::args::check_warn_tsconfig;
use deno::args::TsConfigType;
use deno::deno_graph::ModuleGraph;
use deno::file_fetcher::File;
use deno_core::error::AnyError;
use deno_core::FastString;
use deno_core::ModuleSpecifier;
use eszip::EszipRelativeFileBaseUrl;
use eszip::EszipV2;

use crate::emitter::EmitterFactory;

#[allow(clippy::arc_with_non_send_sync)]
pub async fn create_eszip_from_graph_raw(
  graph: ModuleGraph,
  emitter_factory: Option<Arc<EmitterFactory>>,
  relative_file_base: Option<EszipRelativeFileBaseUrl<'_>>,
) -> Result<EszipV2, AnyError> {
  let emitter =
    emitter_factory.unwrap_or_else(|| Arc::new(EmitterFactory::new()));
  let parser_arc = emitter.clone().parsed_source_cache().unwrap();
  let parser = parser_arc.as_capturing_parser();
  let options = emitter.deno_options()?;
  let ts_config_result =
    options.resolve_ts_config_for_emit(TsConfigType::Emit)?;
  check_warn_tsconfig(&ts_config_result);
  let (transpile_options, _) =
    deno::args::ts_config_to_transpile_and_emit_options(
      ts_config_result.ts_config,
    )?;
  let emit_options = emitter.emit_options();

  eszip::EszipV2::from_graph(eszip::FromGraphOptions {
    graph,
    parser,
    module_kind_resolver: Default::default(),
    transpile_options,
    emit_options,
    relative_file_base,
    npm_packages: None,
  })
}

pub enum CreateGraphArgs<'a> {
  File(PathBuf),
  Code { path: PathBuf, code: &'a FastString },
}

impl CreateGraphArgs<'_> {
  pub fn path(&self) -> &PathBuf {
    match self {
      Self::File(path) => path,
      Self::Code { path, .. } => path,
    }
  }
}

pub async fn create_graph(
  args: &CreateGraphArgs<'_>,
  emitter_factory: Arc<EmitterFactory>,
) -> Result<Arc<ModuleGraph>, AnyError> {
  fn convert_path(path: &PathBuf) -> Result<ModuleSpecifier, AnyError> {
    ModuleSpecifier::from_file_path(path)
      .map_err(|_| anyhow!("failed to parse specifier"))
  }

  let module_specifier = match args {
    CreateGraphArgs::File(file) => convert_path(
      &std::fs::canonicalize(file).context("failed to read path")?,
    )?,

    CreateGraphArgs::Code { code, path } => {
      let specifier = convert_path(path)?;

      emitter_factory.file_fetcher()?.insert_memory_files(File {
        specifier: specifier.clone(),
        maybe_headers: None,
        source: code.as_bytes().into(),
      });

      specifier
    }
  };

  let builder = emitter_factory.module_graph_creator().await?.clone();
  let create_module_graph_task =
    builder.create_graph_and_maybe_check(vec![module_specifier]);

  create_module_graph_task
    .await
    .context("failed to create the graph")
}
