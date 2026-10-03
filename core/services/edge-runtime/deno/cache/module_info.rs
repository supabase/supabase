// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use std::sync::Arc;

use deno_ast::MediaType;
use deno_ast::ModuleSpecifier;
use deno_core::error::AnyError;
use deno_core::serde_json;
use deno_graph::ModuleInfo;
use deno_graph::ParserModuleAnalyzer;
use deno_webstorage::rusqlite::params;

use super::cache_db::CacheDB;
use super::cache_db::CacheDBConfiguration;
use super::cache_db::CacheDBHash;
use super::cache_db::CacheFailure;
use super::parsed_source::ParsedSourceCache;

const SELECT_MODULE_INFO: &str = "
SELECT
  module_info
FROM
  moduleinfocache
WHERE
  specifier=?1
  AND media_type=?2
  AND source_hash=?3
LIMIT 1";

pub static MODULE_INFO_CACHE_DB: CacheDBConfiguration = CacheDBConfiguration {
  table_initializer: concat!(
    "CREATE TABLE IF NOT EXISTS moduleinfocache (",
    "specifier TEXT PRIMARY KEY,",
    "media_type INTEGER NOT NULL,",
    "source_hash INTEGER NOT NULL,",
    "module_info TEXT NOT NULL",
    ");"
  ),
  on_version_change: "DELETE FROM moduleinfocache;",
  preheat_queries: &[SELECT_MODULE_INFO],
  on_failure: CacheFailure::InMemory,
};

/// A cache of `deno_graph::ModuleInfo` objects. Using this leads to a considerable
/// performance improvement because when it exists we can skip parsing a module for
/// deno_graph.
pub struct ModuleInfoCache {
  conn: CacheDB,
  parsed_source_cache: Arc<ParsedSourceCache>,
}

impl ModuleInfoCache {
  #[cfg(test)]
  pub fn new_in_memory(
    version: &'static str,
    parsed_source_cache: Arc<ParsedSourceCache>,
  ) -> Self {
    Self::new(
      CacheDB::in_memory(&MODULE_INFO_CACHE_DB, version),
      parsed_source_cache,
    )
  }

  pub fn new(
    conn: CacheDB,
    parsed_source_cache: Arc<ParsedSourceCache>,
  ) -> Self {
    Self {
      conn,
      parsed_source_cache,
    }
  }

  /// Useful for testing: re-create this cache DB with a different current version.
  #[cfg(test)]
  #[allow(dead_code)]
  pub(crate) fn recreate_with_version(self, version: &'static str) -> Self {
    Self {
      conn: self.conn.recreate_with_version(version),
      parsed_source_cache: self.parsed_source_cache,
    }
  }

  pub fn get_module_info(
    &self,
    specifier: &ModuleSpecifier,
    media_type: MediaType,
    expected_source_hash: CacheDBHash,
  ) -> Result<Option<ModuleInfo>, AnyError> {
    let query = SELECT_MODULE_INFO;
    let res = self.conn.query_row(
      query,
      params![
        &specifier.as_str(),
        serialize_media_type(media_type),
        expected_source_hash,
      ],
      |row| {
        let module_info: String = row.get(0)?;
        let module_info = serde_json::from_str(&module_info)?;
        Ok(module_info)
      },
    )?;
    Ok(res)
  }

  pub fn set_module_info(
    &self,
    specifier: &ModuleSpecifier,
    media_type: MediaType,
    source_hash: CacheDBHash,
    module_info: &ModuleInfo,
  ) -> Result<(), AnyError> {
    let sql = "
      INSERT OR REPLACE INTO
        moduleinfocache (specifier, media_type, source_hash, module_info)
      VALUES
        (?1, ?2, ?3, ?4)";
    self.conn.execute(
      sql,
      params![
        specifier.as_str(),
        serialize_media_type(media_type),
        source_hash,
        &serde_json::to_string(&module_info)?,
      ],
    )?;
    Ok(())
  }

  pub fn as_module_analyzer(&self) -> ModuleInfoCacheModuleAnalyzer<'_> {
    ModuleInfoCacheModuleAnalyzer {
      module_info_cache: self,
      parsed_source_cache: &self.parsed_source_cache,
    }
  }
}

pub struct ModuleInfoCacheModuleAnalyzer<'a> {
  module_info_cache: &'a ModuleInfoCache,
  parsed_source_cache: &'a Arc<ParsedSourceCache>,
}

#[async_trait::async_trait(?Send)]
impl<'a> deno_graph::ModuleAnalyzer for ModuleInfoCacheModuleAnalyzer<'a> {
  async fn analyze(
    &self,
    specifier: &ModuleSpecifier,
    source: Arc<str>,
    media_type: MediaType,
  ) -> Result<ModuleInfo, deno_ast::ParseDiagnostic> {
    // attempt to load from the cache
    let source_hash = CacheDBHash::from_source(&source);
    match self.module_info_cache.get_module_info(
      specifier,
      media_type,
      source_hash,
    ) {
      Ok(Some(info)) => return Ok(info),
      Ok(None) => {}
      Err(err) => {
        log::debug!(
          "Error loading module cache info for {}. {:#}",
          specifier,
          err
        );
      }
    }

    // otherwise, get the module info from the parsed source cache
    let module_info = deno_core::unsync::spawn_blocking({
      let cache = self.parsed_source_cache.clone();
      let specifier = specifier.clone();
      move || {
        let parser = cache.as_capturing_parser();
        let analyzer = ParserModuleAnalyzer::new(&parser);
        analyzer.analyze_sync(&specifier, source, media_type)
      }
    })
    .await
    .unwrap()?;

    // then attempt to cache it
    if let Err(err) = self.module_info_cache.set_module_info(
      specifier,
      media_type,
      source_hash,
      &module_info,
    ) {
      log::debug!(
        "Error saving module cache info for {}. {:#}",
        specifier,
        err
      );
    }

    Ok(module_info)
  }
}

fn serialize_media_type(media_type: MediaType) -> i64 {
  use MediaType::*;
  match media_type {
    JavaScript => 1,
    Jsx => 2,
    Mjs => 3,
    Cjs => 4,
    TypeScript => 5,
    Mts => 6,
    Cts => 7,
    Dts => 8,
    Dmts => 9,
    Dcts => 10,
    Tsx => 11,
    Json => 12,
    Wasm => 13,
    Css => 14,
    SourceMap => 15,
    Unknown => 16,
  }
}
