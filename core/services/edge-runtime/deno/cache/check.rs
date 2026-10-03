// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use super::cache_db::CacheDB;
use super::cache_db::CacheDBConfiguration;
use super::cache_db::CacheDBHash;
use super::cache_db::CacheFailure;
use deno_ast::ModuleSpecifier;
use deno_core::error::AnyError;
use deno_webstorage::rusqlite::params;

pub static TYPE_CHECK_CACHE_DB: CacheDBConfiguration = CacheDBConfiguration {
  table_initializer: concat!(
    "CREATE TABLE IF NOT EXISTS checkcache (",
    "check_hash INT PRIMARY KEY",
    ");",
    "CREATE TABLE IF NOT EXISTS tsbuildinfo (",
    "specifier TEXT PRIMARY KEY,",
    "text TEXT NOT NULL",
    ");",
  ),
  on_version_change: concat!(
    "DELETE FROM checkcache;",
    "DELETE FROM tsbuildinfo;"
  ),
  preheat_queries: &[],
  // If the cache fails, just ignore all caching attempts
  on_failure: CacheFailure::Blackhole,
};

/// The cache used to tell whether type checking should occur again.
///
/// This simply stores a hash of the inputs of each successful type check
/// and only clears them out when changing CLI versions.
pub struct TypeCheckCache(CacheDB);

impl TypeCheckCache {
  pub fn new(db: CacheDB) -> Self {
    Self(db)
  }

  pub fn has_check_hash(&self, hash: CacheDBHash) -> bool {
    match self.hash_check_hash_result(hash) {
      Ok(val) => val,
      Err(err) => {
        if cfg!(debug_assertions) {
          panic!("Error retrieving hash: {err}");
        } else {
          log::debug!("Error retrieving hash: {}", err);
          // fail silently when not debugging
          false
        }
      }
    }
  }

  fn hash_check_hash_result(
    &self,
    hash: CacheDBHash,
  ) -> Result<bool, AnyError> {
    self.0.exists(
      "SELECT * FROM checkcache WHERE check_hash=?1 LIMIT 1",
      params![hash],
    )
  }

  pub fn add_check_hash(&self, check_hash: CacheDBHash) {
    if let Err(err) = self.add_check_hash_result(check_hash) {
      if cfg!(debug_assertions) {
        panic!("Error saving check hash: {err}");
      } else {
        log::debug!("Error saving check hash: {}", err);
      }
    }
  }

  fn add_check_hash_result(
    &self,
    check_hash: CacheDBHash,
  ) -> Result<(), AnyError> {
    let sql = "
    INSERT OR REPLACE INTO
      checkcache (check_hash)
    VALUES
      (?1)";
    self.0.execute(sql, params![check_hash])?;
    Ok(())
  }

  pub fn get_tsbuildinfo(&self, specifier: &ModuleSpecifier) -> Option<String> {
    self
      .0
      .query_row(
        "SELECT text FROM tsbuildinfo WHERE specifier=?1 LIMIT 1",
        params![specifier.to_string()],
        |row| Ok(row.get::<_, String>(0)?),
      )
      .ok()?
  }

  pub fn set_tsbuildinfo(&self, specifier: &ModuleSpecifier, text: &str) {
    if let Err(err) = self.set_tsbuildinfo_result(specifier, text) {
      // should never error here, but if it ever does don't fail
      if cfg!(debug_assertions) {
        panic!("Error saving tsbuildinfo: {err}");
      } else {
        log::debug!("Error saving tsbuildinfo: {}", err);
      }
    }
  }

  fn set_tsbuildinfo_result(
    &self,
    specifier: &ModuleSpecifier,
    text: &str,
  ) -> Result<(), AnyError> {
    self.0.execute(
      "INSERT OR REPLACE INTO tsbuildinfo (specifier, text) VALUES (?1, ?2)",
      params![specifier.to_string(), text],
    )?;
    Ok(())
  }
}
