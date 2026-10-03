// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use std::collections::HashMap;
use std::path::Path;
use std::path::PathBuf;

use deno_core::error::AnyError;
use deno_core::parking_lot::Mutex;
use deno_core::unsync::spawn;
use deno_core::unsync::JoinHandle;
use deno_webstorage::rusqlite::params;

use super::cache_db::CacheDB;
use super::cache_db::CacheDBConfiguration;
use super::cache_db::CacheDBHash;
use super::cache_db::CacheFailure;

pub static INCREMENTAL_CACHE_DB: CacheDBConfiguration = CacheDBConfiguration {
  table_initializer: concat!(
    "CREATE TABLE IF NOT EXISTS incrementalcache (",
    "file_path TEXT PRIMARY KEY,",
    "state_hash INTEGER NOT NULL,",
    "source_hash INTEGER NOT NULL",
    ");"
  ),
  on_version_change: "DELETE FROM incrementalcache;",
  preheat_queries: &[],
  // If the cache fails, just ignore all caching attempts
  on_failure: CacheFailure::Blackhole,
};

/// Cache used to skip formatting/linting a file again when we
/// know it is already formatted or has no lint diagnostics.
pub struct IncrementalCache(IncrementalCacheInner);

impl IncrementalCache {
  pub fn new<TState: std::hash::Hash>(
    db: CacheDB,
    state: &TState,
    initial_file_paths: &[PathBuf],
  ) -> Self {
    IncrementalCache(IncrementalCacheInner::new(db, state, initial_file_paths))
  }

  pub fn is_file_same(&self, file_path: &Path, file_text: &str) -> bool {
    self.0.is_file_same(file_path, file_text)
  }

  pub fn update_file(&self, file_path: &Path, file_text: &str) {
    self.0.update_file(file_path, file_text)
  }

  pub async fn wait_completion(&self) {
    self.0.wait_completion().await;
  }
}

enum ReceiverMessage {
  Update(PathBuf, CacheDBHash),
  Exit,
}

struct IncrementalCacheInner {
  previous_hashes: HashMap<PathBuf, CacheDBHash>,
  sender: tokio::sync::mpsc::UnboundedSender<ReceiverMessage>,
  handle: Mutex<Option<JoinHandle<()>>>,
}

impl IncrementalCacheInner {
  pub fn new<TState: std::hash::Hash>(
    db: CacheDB,
    state: &TState,
    initial_file_paths: &[PathBuf],
  ) -> Self {
    let state_hash = CacheDBHash::from_source(state);
    let sql_cache = SqlIncrementalCache::new(db, state_hash);
    Self::from_sql_incremental_cache(sql_cache, initial_file_paths)
  }

  fn from_sql_incremental_cache(
    cache: SqlIncrementalCache,
    initial_file_paths: &[PathBuf],
  ) -> Self {
    let mut previous_hashes = HashMap::new();
    for path in initial_file_paths {
      if let Some(hash) = cache.get_source_hash(path) {
        previous_hashes.insert(path.to_path_buf(), hash);
      }
    }

    let (sender, mut receiver) =
      tokio::sync::mpsc::unbounded_channel::<ReceiverMessage>();

    // sqlite isn't `Sync`, so we do all the updating on a dedicated task
    let handle = spawn(async move {
      while let Some(message) = receiver.recv().await {
        match message {
          ReceiverMessage::Update(path, hash) => {
            let _ = cache.set_source_hash(&path, hash);
          }
          ReceiverMessage::Exit => break,
        }
      }
    });

    IncrementalCacheInner {
      previous_hashes,
      sender,
      handle: Mutex::new(Some(handle)),
    }
  }

  pub fn is_file_same(&self, file_path: &Path, file_text: &str) -> bool {
    match self.previous_hashes.get(file_path) {
      Some(hash) => *hash == CacheDBHash::from_source(file_text),
      None => false,
    }
  }

  pub fn update_file(&self, file_path: &Path, file_text: &str) {
    let hash = CacheDBHash::from_source(file_text);
    if let Some(previous_hash) = self.previous_hashes.get(file_path) {
      if *previous_hash == hash {
        return; // do not bother updating the db file because nothing has changed
      }
    }
    let _ = self
      .sender
      .send(ReceiverMessage::Update(file_path.to_path_buf(), hash));
  }

  pub async fn wait_completion(&self) {
    if self.sender.send(ReceiverMessage::Exit).is_err() {
      return;
    }
    let handle = self.handle.lock().take();
    if let Some(handle) = handle {
      handle.await.unwrap();
    }
  }
}

struct SqlIncrementalCache {
  conn: CacheDB,
  /// A hash of the state used to produce the formatting/linting other than
  /// the CLI version. This state is a hash of the configuration and ensures
  /// we format/lint a file when the configuration changes.
  state_hash: CacheDBHash,
}

impl SqlIncrementalCache {
  pub fn new(conn: CacheDB, state_hash: CacheDBHash) -> Self {
    Self { conn, state_hash }
  }

  pub fn get_source_hash(&self, path: &Path) -> Option<CacheDBHash> {
    match self.get_source_hash_result(path) {
      Ok(option) => option,
      Err(err) => {
        if cfg!(debug_assertions) {
          panic!("Error retrieving hash: {err}");
        } else {
          // fail silently when not debugging
          None
        }
      }
    }
  }

  fn get_source_hash_result(
    &self,
    path: &Path,
  ) -> Result<Option<CacheDBHash>, AnyError> {
    let query = "
      SELECT
        source_hash
      FROM
        incrementalcache
      WHERE
        file_path=?1
        AND state_hash=?2
      LIMIT 1";
    let res = self.conn.query_row(
      query,
      params![path.to_string_lossy(), self.state_hash],
      |row| {
        let hash: CacheDBHash = row.get(0)?;
        Ok(hash)
      },
    )?;
    Ok(res)
  }

  pub fn set_source_hash(
    &self,
    path: &Path,
    source_hash: CacheDBHash,
  ) -> Result<(), AnyError> {
    let sql = "
      INSERT OR REPLACE INTO
        incrementalcache (file_path, state_hash, source_hash)
      VALUES
        (?1, ?2, ?3)";
    self.conn.execute(
      sql,
      params![path.to_string_lossy(), self.state_hash, source_hash],
    )?;
    Ok(())
  }
}
