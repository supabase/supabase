use std::borrow::Cow;
use std::sync::Arc;

use deno_ast::MediaType;
use deno_ast::ModuleSpecifier;
use deno_core::error::AnyError;
use deno_graph::ParsedSourceStore;
use ext_node::DenoFsNodeResolverEnv;
use node_resolver::analyze::CjsAnalysis as ExtNodeCjsAnalysis;
use node_resolver::analyze::CjsAnalysisExports;
use node_resolver::analyze::CjsCodeAnalyzer;
use node_resolver::analyze::NodeCodeTranslator;
use serde::Deserialize;
use serde::Serialize;

use crate::cache::CacheDBHash;
use crate::cache::NodeAnalysisCache;
use crate::cache::ParsedSourceCache;
use crate::resolver::CjsTracker;

pub type CliNodeCodeTranslator =
  NodeCodeTranslator<CliCjsCodeAnalyzer, DenoFsNodeResolverEnv>;

/// Resolves a specifier that is pointing into a node_modules folder.
///
/// Note: This should be called whenever getting the specifier from a
/// Module::External(module) reference because that module might not be fully
/// resolved at the time deno_graph is analyzing it because the node_modules
/// folder might not exist at that time.
pub fn resolve_specifier_into_node_modules(
  specifier: &ModuleSpecifier,
  fs: &dyn deno_fs::FileSystem,
) -> ModuleSpecifier {
  node_resolver::resolve_specifier_into_node_modules(specifier, &|path| {
    fs.realpath_sync(path).map_err(|err| err.into_io_error())
  })
}

#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
pub enum CliCjsAnalysis {
  /// The module was found to be an ES module.
  Esm,
  /// The module was CJS.
  Cjs {
    exports: Vec<String>,
    reexports: Vec<String>,
  },
}

pub struct CliCjsCodeAnalyzer {
  cache: NodeAnalysisCache,
  cjs_tracker: Arc<CjsTracker>,
  fs: deno_fs::FileSystemRc,
  parsed_source_cache: Option<Arc<ParsedSourceCache>>,
}

impl CliCjsCodeAnalyzer {
  pub fn new(
    cache: NodeAnalysisCache,
    cjs_tracker: Arc<CjsTracker>,
    fs: deno_fs::FileSystemRc,
    parsed_source_cache: Option<Arc<ParsedSourceCache>>,
  ) -> Self {
    Self {
      cache,
      cjs_tracker,
      fs,
      parsed_source_cache,
    }
  }

  async fn inner_cjs_analysis(
    &self,
    specifier: &ModuleSpecifier,
    source: &str,
  ) -> Result<CliCjsAnalysis, AnyError> {
    let source_hash = CacheDBHash::from_source(source);
    if let Some(analysis) =
      self.cache.get_cjs_analysis(specifier.as_str(), source_hash)
    {
      return Ok(analysis);
    }

    let media_type = MediaType::from_specifier(specifier);
    if media_type == MediaType::Json {
      return Ok(CliCjsAnalysis::Cjs {
        exports: vec![],
        reexports: vec![],
      });
    }

    let cjs_tracker = self.cjs_tracker.clone();
    let is_maybe_cjs = cjs_tracker.is_maybe_cjs(specifier, media_type)?;
    let analysis = if is_maybe_cjs {
      let maybe_parsed_source = self
        .parsed_source_cache
        .as_ref()
        .and_then(|c| c.remove_parsed_source(specifier));

      deno_core::unsync::spawn_blocking({
        let specifier = specifier.clone();
        let source: Arc<str> = source.into();
        move || -> Result<_, AnyError> {
          let parsed_source =
            maybe_parsed_source.map(Ok).unwrap_or_else(|| {
              deno_ast::parse_program(deno_ast::ParseParams {
                specifier,
                text: source,
                media_type,
                capture_tokens: true,
                scope_analysis: false,
                maybe_syntax: None,
              })
            })?;
          let is_script = parsed_source.compute_is_script();
          let is_cjs = cjs_tracker.is_cjs_with_known_is_script(
            parsed_source.specifier(),
            media_type,
            is_script,
          )?;
          if is_cjs {
            let analysis = parsed_source.analyze_cjs();
            Ok(CliCjsAnalysis::Cjs {
              exports: analysis.exports,
              reexports: analysis.reexports,
            })
          } else {
            Ok(CliCjsAnalysis::Esm)
          }
        }
      })
      .await
      .unwrap()?
    } else {
      CliCjsAnalysis::Esm
    };

    self
      .cache
      .set_cjs_analysis(specifier.as_str(), source_hash, &analysis);

    Ok(analysis)
  }
}

#[async_trait::async_trait(?Send)]
impl CjsCodeAnalyzer for CliCjsCodeAnalyzer {
  async fn analyze_cjs<'a>(
    &self,
    specifier: &ModuleSpecifier,
    source: Option<Cow<'a, str>>,
  ) -> Result<ExtNodeCjsAnalysis<'a>, AnyError> {
    let source = match source {
      Some(source) => source,
      None => {
        if let Ok(path) = specifier.to_file_path() {
          if let Ok(source_from_file) =
            self.fs.read_text_file_lossy_async(path, None).await
          {
            source_from_file
          } else {
            return Ok(ExtNodeCjsAnalysis::Cjs(CjsAnalysisExports {
              exports: vec![],
              reexports: vec![],
            }));
          }
        } else {
          return Ok(ExtNodeCjsAnalysis::Cjs(CjsAnalysisExports {
            exports: vec![],
            reexports: vec![],
          }));
        }
      }
    };
    let analysis = self.inner_cjs_analysis(specifier, &source).await?;
    match analysis {
      CliCjsAnalysis::Esm => Ok(ExtNodeCjsAnalysis::Esm(source)),
      CliCjsAnalysis::Cjs { exports, reexports } => {
        Ok(ExtNodeCjsAnalysis::Cjs(CjsAnalysisExports {
          exports,
          reexports,
        }))
      }
    }
  }
}
