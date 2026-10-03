// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use deno_core::error::AnyError;
use deno_core::serde_json;
use deno_webstorage::rusqlite::params;

use crate::node::CliCjsAnalysis;

use super::cache_db::CacheDB;
use super::cache_db::CacheDBConfiguration;
use super::cache_db::CacheFailure;
use super::CacheDBHash;

pub static NODE_ANALYSIS_CACHE_DB: CacheDBConfiguration =
  CacheDBConfiguration {
    table_initializer: concat!(
      "CREATE TABLE IF NOT EXISTS cjsanalysiscache (",
      "specifier TEXT PRIMARY KEY,",
      "source_hash INTEGER NOT NULL,",
      "data TEXT NOT NULL",
      ");"
    ),
    on_version_change: "DELETE FROM cjsanalysiscache;",
    preheat_queries: &[],
    on_failure: CacheFailure::InMemory,
  };

#[derive(Clone)]
pub struct NodeAnalysisCache {
  inner: NodeAnalysisCacheInner,
}

impl NodeAnalysisCache {
  pub fn new(db: CacheDB) -> Self {
    Self {
      inner: NodeAnalysisCacheInner::new(db),
    }
  }

  fn ensure_ok<T: Default>(res: Result<T, AnyError>) -> T {
    match res {
      Ok(x) => x,
      Err(err) => {
        // TODO(mmastrac): This behavior was inherited from before the refactoring but it probably makes sense to move it into the cache
        // at some point.
        // should never error here, but if it ever does don't fail
        if cfg!(debug_assertions) {
          panic!("Error using esm analysis: {err:#}");
        } else {
          log::debug!("Error using esm analysis: {:#}", err);
        }
        T::default()
      }
    }
  }

  pub fn get_cjs_analysis(
    &self,
    specifier: &str,
    expected_source_hash: CacheDBHash,
  ) -> Option<CliCjsAnalysis> {
    Self::ensure_ok(
      self.inner.get_cjs_analysis(specifier, expected_source_hash),
    )
  }

  pub fn set_cjs_analysis(
    &self,
    specifier: &str,
    source_hash: CacheDBHash,
    cjs_analysis: &CliCjsAnalysis,
  ) {
    Self::ensure_ok(self.inner.set_cjs_analysis(
      specifier,
      source_hash,
      cjs_analysis,
    ));
  }
}

#[derive(Clone)]
struct NodeAnalysisCacheInner {
  conn: CacheDB,
}

impl NodeAnalysisCacheInner {
  pub fn new(conn: CacheDB) -> Self {
    Self { conn }
  }

  pub fn get_cjs_analysis(
    &self,
    specifier: &str,
    expected_source_hash: CacheDBHash,
  ) -> Result<Option<CliCjsAnalysis>, AnyError> {
    let query = "
      SELECT
        data
      FROM
        cjsanalysiscache
      WHERE
        specifier=?1
        AND source_hash=?2
      LIMIT 1";
    let res = self.conn.query_row(
      query,
      params![specifier, expected_source_hash],
      |row| {
        let analysis_info: String = row.get(0)?;
        Ok(serde_json::from_str(&analysis_info)?)
      },
    )?;
    Ok(res)
  }

  pub fn set_cjs_analysis(
    &self,
    specifier: &str,
    source_hash: CacheDBHash,
    cjs_analysis: &CliCjsAnalysis,
  ) -> Result<(), AnyError> {
    let sql = "
      INSERT OR REPLACE INTO
        cjsanalysiscache (specifier, source_hash, data)
      VALUES
        (?1, ?2, ?3)";
    self.conn.execute(
      sql,
      params![
        specifier,
        source_hash,
        &serde_json::to_string(&cjs_analysis)?,
      ],
    )?;
    Ok(())
  }
}
