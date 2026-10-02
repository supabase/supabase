// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use std::collections::HashMap;
use std::sync::Arc;

use deno_ast::MediaType;
use deno_ast::ModuleSpecifier;
use deno_ast::ParsedSource;
use deno_core::parking_lot::Mutex;
use deno_graph::CapturingEsParser;
use deno_graph::DefaultEsParser;
use deno_graph::EsParser;
use deno_graph::ParseOptions;
use deno_graph::ParsedSourceStore;

#[derive(Default)]
pub struct ParsedSourceCache {
  sources: Mutex<HashMap<ModuleSpecifier, ParsedSource>>,
}

impl ParsedSourceCache {
  pub fn get_parsed_source_from_js_module(
    &self,
    module: &deno_graph::JsModule,
  ) -> Result<ParsedSource, deno_ast::ParseDiagnostic> {
    let parser = self.as_capturing_parser();
    // this will conditionally parse because it's using a CapturingEsParser
    parser.parse_program(ParseOptions {
      specifier: &module.specifier,
      source: module.source.clone(),
      media_type: module.media_type,
      scope_analysis: false,
    })
  }

  pub fn remove_or_parse_module(
    &self,
    specifier: &ModuleSpecifier,
    source: Arc<str>,
    media_type: MediaType,
  ) -> Result<ParsedSource, deno_ast::ParseDiagnostic> {
    if let Some(parsed_source) = self.remove_parsed_source(specifier) {
      if parsed_source.media_type() == media_type
        && parsed_source.text().as_ref() == source.as_ref()
      {
        // note: message used tests
        log::debug!("Removed parsed source: {}", specifier);
        return Ok(parsed_source);
      }
    }
    let options = ParseOptions {
      specifier,
      source,
      media_type,
      scope_analysis: false,
    };
    DefaultEsParser.parse_program(options)
  }

  /// Frees the parsed source from memory.
  pub fn free(&self, specifier: &ModuleSpecifier) {
    self.sources.lock().remove(specifier);
  }

  /// Creates a parser that will reuse a ParsedSource from the store
  /// if it exists, or else parse.
  pub fn as_capturing_parser(&self) -> CapturingEsParser<'_> {
    CapturingEsParser::new(None, self)
  }
}

/// It's ok that this is racy since in non-LSP situations
/// this will only ever store one form of a parsed source
/// and in LSP settings the concurrency will be enforced
/// at a higher level to ensure this will have the latest
/// parsed source.
impl deno_graph::ParsedSourceStore for ParsedSourceCache {
  fn set_parsed_source(
    &self,
    specifier: ModuleSpecifier,
    parsed_source: ParsedSource,
  ) -> Option<ParsedSource> {
    self.sources.lock().insert(specifier, parsed_source)
  }

  fn get_parsed_source(
    &self,
    specifier: &ModuleSpecifier,
  ) -> Option<ParsedSource> {
    self.sources.lock().get(specifier).cloned()
  }

  fn remove_parsed_source(
    &self,
    specifier: &ModuleSpecifier,
  ) -> Option<ParsedSource> {
    self.sources.lock().remove(specifier)
  }

  fn get_scope_analysis_parsed_source(
    &self,
    specifier: &ModuleSpecifier,
  ) -> Option<ParsedSource> {
    let mut sources = self.sources.lock();
    let parsed_source = sources.get(specifier)?;
    if parsed_source.has_scope_analysis() {
      Some(parsed_source.clone())
    } else {
      // upgrade to have scope analysis
      let parsed_source = sources.remove(specifier).unwrap();
      let parsed_source = parsed_source.into_with_scope_analysis();
      sources.insert(specifier.clone(), parsed_source.clone());
      Some(parsed_source)
    }
  }
}
