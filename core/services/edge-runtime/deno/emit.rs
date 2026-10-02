// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use crate::cache::EmitCache;
use crate::cache::FastInsecureHasher;
use crate::cache::ParsedSourceCache;
use crate::resolver::CjsTracker;

use deno_ast::ModuleKind;
use deno_ast::SourceRange;
use deno_ast::SourceRanged;
use deno_ast::SourceRangedForSpanned;
use deno_ast::TranspileModuleOptions;
use deno_ast::TranspileOptions;
use deno_ast::TranspileResult;
use deno_core::error::AnyError;
use deno_core::futures::stream::FuturesUnordered;
use deno_core::futures::FutureExt;
use deno_core::futures::StreamExt;
use deno_core::ModuleSpecifier;
use deno_graph::MediaType;
use deno_graph::Module;
use deno_graph::ModuleGraph;
use std::sync::Arc;

pub struct Emitter {
  cjs_tracker: Arc<CjsTracker>,
  emit_cache: Arc<EmitCache>,
  parsed_source_cache: Arc<ParsedSourceCache>,
  transpile_and_emit_options:
    Arc<(deno_ast::TranspileOptions, deno_ast::EmitOptions)>,
  // cached hash of the transpile and emit options
  transpile_and_emit_options_hash: u64,
}

impl Emitter {
  pub fn new(
    cjs_tracker: Arc<CjsTracker>,
    emit_cache: Arc<EmitCache>,
    parsed_source_cache: Arc<ParsedSourceCache>,
    transpile_options: TranspileOptions,
    emit_options: deno_ast::EmitOptions,
  ) -> Self {
    let transpile_and_emit_options_hash = {
      let mut hasher = FastInsecureHasher::new_without_deno_version();
      hasher.write_hashable(&transpile_options);
      hasher.write_hashable(&emit_options);
      hasher.finish()
    };
    Self {
      cjs_tracker,
      emit_cache,
      parsed_source_cache,
      transpile_and_emit_options: Arc::new((transpile_options, emit_options)),
      transpile_and_emit_options_hash,
    }
  }

  pub async fn cache_module_emits(
    &self,
    graph: &ModuleGraph,
  ) -> Result<(), AnyError> {
    let mut futures = FuturesUnordered::new();
    for module in graph.modules() {
      let Module::Js(module) = module else {
        continue;
      };

      if module.media_type.is_emittable() {
        futures.push(
          self
            .emit_parsed_source(
              &module.specifier,
              module.media_type,
              ModuleKind::from_is_cjs(
                self.cjs_tracker.is_cjs_with_known_is_script(
                  &module.specifier,
                  module.media_type,
                  module.is_script,
                )?,
              ),
              &module.source,
            )
            .boxed_local(),
        );
      }
    }

    while let Some(result) = futures.next().await {
      result?; // surface errors
    }

    Ok(())
  }

  /// Gets a cached emit if the source matches the hash found in the cache.
  pub fn maybe_cached_emit(
    &self,
    specifier: &ModuleSpecifier,
    module_kind: deno_ast::ModuleKind,
    source: &str,
  ) -> Option<String> {
    let source_hash = self.get_source_hash(module_kind, source);
    self.emit_cache.get_emit_code(specifier, source_hash)
  }

  pub async fn emit_parsed_source(
    &self,
    specifier: &ModuleSpecifier,
    media_type: MediaType,
    module_kind: deno_ast::ModuleKind,
    source: &Arc<str>,
  ) -> Result<String, AnyError> {
    // Note: keep this in sync with the sync version below
    let helper = EmitParsedSourceHelper(self);
    match helper.pre_emit_parsed_source(specifier, module_kind, source) {
      PreEmitResult::Cached(emitted_text) => Ok(emitted_text),
      PreEmitResult::NotCached { source_hash } => {
        let parsed_source_cache = self.parsed_source_cache.clone();
        let transpile_and_emit_options =
          self.transpile_and_emit_options.clone();
        let transpiled_source = deno_core::unsync::spawn_blocking({
          let specifier = specifier.clone();
          let source = source.clone();
          move || -> Result<_, AnyError> {
            EmitParsedSourceHelper::transpile(
              &parsed_source_cache,
              &specifier,
              media_type,
              module_kind,
              source.clone(),
              &transpile_and_emit_options.0,
              &transpile_and_emit_options.1,
            )
          }
        })
        .await
        .unwrap()?;
        helper.post_emit_parsed_source(
          specifier,
          &transpiled_source,
          source_hash,
        );
        Ok(transpiled_source)
      }
    }
  }

  pub fn emit_parsed_source_sync(
    &self,
    specifier: &ModuleSpecifier,
    media_type: MediaType,
    module_kind: deno_ast::ModuleKind,
    source: &Arc<str>,
  ) -> Result<String, AnyError> {
    // Note: keep this in sync with the async version above
    let helper = EmitParsedSourceHelper(self);
    match helper.pre_emit_parsed_source(specifier, module_kind, source) {
      PreEmitResult::Cached(emitted_text) => Ok(emitted_text),
      PreEmitResult::NotCached { source_hash } => {
        let transpiled_source = EmitParsedSourceHelper::transpile(
          &self.parsed_source_cache,
          specifier,
          media_type,
          module_kind,
          source.clone(),
          &self.transpile_and_emit_options.0,
          &self.transpile_and_emit_options.1,
        )?;
        helper.post_emit_parsed_source(
          specifier,
          &transpiled_source,
          source_hash,
        );
        Ok(transpiled_source)
      }
    }
  }

  /// A hashing function that takes the source code and uses the global emit
  /// options then generates a string hash which can be stored to
  /// determine if the cached emit is valid or not.
  fn get_source_hash(
    &self,
    module_kind: deno_ast::ModuleKind,
    source_text: &str,
  ) -> u64 {
    FastInsecureHasher::new_without_deno_version() // stored in the transpile_and_emit_options_hash
      .write_str(source_text)
      .write_u64(self.transpile_and_emit_options_hash)
      .write_hashable(module_kind)
      .finish()
  }
}

enum PreEmitResult {
  Cached(String),
  NotCached { source_hash: u64 },
}

/// Helper to share code between async and sync emit_parsed_source methods.
struct EmitParsedSourceHelper<'a>(&'a Emitter);

impl<'a> EmitParsedSourceHelper<'a> {
  pub fn pre_emit_parsed_source(
    &self,
    specifier: &ModuleSpecifier,
    module_kind: deno_ast::ModuleKind,
    source: &Arc<str>,
  ) -> PreEmitResult {
    let source_hash = self.0.get_source_hash(module_kind, source);

    if let Some(emit_code) =
      self.0.emit_cache.get_emit_code(specifier, source_hash)
    {
      PreEmitResult::Cached(emit_code)
    } else {
      PreEmitResult::NotCached { source_hash }
    }
  }

  pub fn transpile(
    parsed_source_cache: &ParsedSourceCache,
    specifier: &ModuleSpecifier,
    media_type: MediaType,
    module_kind: deno_ast::ModuleKind,
    source: Arc<str>,
    transpile_options: &deno_ast::TranspileOptions,
    emit_options: &deno_ast::EmitOptions,
  ) -> Result<String, AnyError> {
    // nothing else needs the parsed source at this point, so remove from
    // the cache in order to not transpile owned
    let parsed_source = parsed_source_cache
      .remove_or_parse_module(specifier, source, media_type)?;
    ensure_no_import_assertion(&parsed_source)?;
    let transpile_result = parsed_source.transpile(
      transpile_options,
      &TranspileModuleOptions {
        module_kind: Some(module_kind),
      },
      emit_options,
    )?;
    let transpiled_source = match transpile_result {
      TranspileResult::Owned(source) => source,
      TranspileResult::Cloned(source) => {
        debug_assert!(false, "Transpile owned failed.");
        source
      }
    };
    debug_assert!(transpiled_source.source_map.is_none());
    Ok(transpiled_source.text)
  }

  pub fn post_emit_parsed_source(
    &self,
    specifier: &ModuleSpecifier,
    transpiled_source: &str,
    source_hash: u64,
  ) {
    self.0.emit_cache.set_emit_code(
      specifier,
      source_hash,
      transpiled_source.as_bytes(),
    );
  }
}

// todo(dsherret): this is a temporary measure until we have swc erroring for this
fn ensure_no_import_assertion(
  parsed_source: &deno_ast::ParsedSource,
) -> Result<(), AnyError> {
  fn has_import_assertion(text: &str) -> bool {
    // good enough
    text.contains(" assert ") && !text.contains(" with ")
  }

  fn create_err(
    parsed_source: &deno_ast::ParsedSource,
    range: SourceRange,
  ) -> AnyError {
    let text_info = parsed_source.text_info_lazy();
    let loc = text_info.line_and_column_display(range.start);
    let mut msg = "Import assertions are deprecated. Use `with` keyword, instead of 'assert' keyword.".to_string();
    msg.push_str("\n\n");
    msg.push_str(range.text_fast(text_info));
    msg.push_str("\n\n");
    msg.push_str(&format!(
      "  at {}:{}:{}\n",
      parsed_source.specifier(),
      loc.line_number,
      loc.column_number,
    ));
    deno_core::anyhow::anyhow!("{}", msg)
  }

  let deno_ast::ProgramRef::Module(module) = parsed_source.program_ref() else {
    return Ok(());
  };

  for item in &module.body {
    match item {
      deno_ast::swc::ast::ModuleItem::ModuleDecl(decl) => match decl {
        deno_ast::swc::ast::ModuleDecl::Import(n) => {
          if n.with.is_some()
            && has_import_assertion(n.text_fast(parsed_source.text_info_lazy()))
          {
            return Err(create_err(parsed_source, n.range()));
          }
        }
        deno_ast::swc::ast::ModuleDecl::ExportAll(n) => {
          if n.with.is_some()
            && has_import_assertion(n.text_fast(parsed_source.text_info_lazy()))
          {
            return Err(create_err(parsed_source, n.range()));
          }
        }
        deno_ast::swc::ast::ModuleDecl::ExportNamed(n) => {
          if n.with.is_some()
            && has_import_assertion(n.text_fast(parsed_source.text_info_lazy()))
          {
            return Err(create_err(parsed_source, n.range()));
          }
        }
        deno_ast::swc::ast::ModuleDecl::ExportDecl(_)
        | deno_ast::swc::ast::ModuleDecl::ExportDefaultDecl(_)
        | deno_ast::swc::ast::ModuleDecl::ExportDefaultExpr(_)
        | deno_ast::swc::ast::ModuleDecl::TsImportEquals(_)
        | deno_ast::swc::ast::ModuleDecl::TsExportAssignment(_)
        | deno_ast::swc::ast::ModuleDecl::TsNamespaceExport(_) => {}
      },
      deno_ast::swc::ast::ModuleItem::Stmt(_) => {}
    }
  }

  Ok(())
}
