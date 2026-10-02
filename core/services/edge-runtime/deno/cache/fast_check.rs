// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use deno_core::error::AnyError;
use deno_graph::FastCheckCacheItem;
use deno_graph::FastCheckCacheKey;
use deno_webstorage::rusqlite::params;

use super::cache_db::CacheDB;
use super::cache_db::CacheDBConfiguration;
use super::cache_db::CacheDBHash;
use super::cache_db::CacheFailure;

pub static FAST_CHECK_CACHE_DB: CacheDBConfiguration = CacheDBConfiguration {
  table_initializer: concat!(
    "CREATE TABLE IF NOT EXISTS fastcheckcache (",
    "hash INTEGER PRIMARY KEY,",
    "data TEXT NOT NULL",
    ");"
  ),
  on_version_change: "DELETE FROM fastcheckcache;",
  preheat_queries: &[],
  on_failure: CacheFailure::Blackhole,
};

#[derive(Clone)]
pub struct FastCheckCache {
  inner: FastCheckCacheInner,
}

impl FastCheckCache {
  pub fn new(db: CacheDB) -> Self {
    Self {
      inner: FastCheckCacheInner::new(db),
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
          panic!("Error using fast check cache: {err:#}");
        } else {
          log::debug!("Error using fast check cache: {:#}", err);
        }
        T::default()
      }
    }
  }
}

impl deno_graph::FastCheckCache for FastCheckCache {
  fn get(&self, key: FastCheckCacheKey) -> Option<FastCheckCacheItem> {
    Self::ensure_ok(self.inner.get(key))
  }

  fn set(&self, key: FastCheckCacheKey, value: FastCheckCacheItem) {
    Self::ensure_ok(self.inner.set(key, &value));
  }
}

#[derive(Clone)]
struct FastCheckCacheInner {
  conn: CacheDB,
}

impl FastCheckCacheInner {
  pub fn new(conn: CacheDB) -> Self {
    Self { conn }
  }

  pub fn get(
    &self,
    key: FastCheckCacheKey,
  ) -> Result<Option<FastCheckCacheItem>, AnyError> {
    let query = "
      SELECT
        data
      FROM
        fastcheckcache
      WHERE
        hash=?1
      LIMIT 1";
    let res = self.conn.query_row(
      query,
      params![CacheDBHash::new(key.as_u64())],
      |row| {
        let value: Vec<u8> = row.get(0)?;
        Ok(bincode::deserialize::<FastCheckCacheItem>(&value)?)
      },
    )?;
    Ok(res)
  }

  pub fn set(
    &self,
    key: FastCheckCacheKey,
    data: &FastCheckCacheItem,
  ) -> Result<(), AnyError> {
    let sql = "
      INSERT OR REPLACE INTO
        fastcheckcache (hash, data)
      VALUES
        (?1, ?2)";
    self.conn.execute(
      sql,
      params![CacheDBHash::new(key.as_u64()), &bincode::serialize(data)?],
    )?;
    Ok(())
  }
}
