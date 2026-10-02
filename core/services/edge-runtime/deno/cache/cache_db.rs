// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use deno_core::error::AnyError;
use deno_core::parking_lot::Mutex;
use deno_core::parking_lot::MutexGuard;
use deno_core::unsync::spawn_blocking;
use deno_webstorage::rusqlite;
use deno_webstorage::rusqlite::Connection;
use deno_webstorage::rusqlite::OptionalExtension;
use deno_webstorage::rusqlite::Params;
use once_cell::sync::OnceCell;
use std::io::IsTerminal;
use std::path::Path;
use std::path::PathBuf;
use std::sync::Arc;
use std::time::Duration;

use super::common::FastInsecureHasher;

#[derive(Debug, Copy, Clone, PartialEq, Eq, Hash)]
pub struct CacheDBHash(u64);

impl CacheDBHash {
  pub fn new(hash: u64) -> Self {
    Self(hash)
  }

  pub fn from_source(source: impl std::hash::Hash) -> Self {
    Self::new(
      // always write in the deno version just in case
      // the clearing on deno version change doesn't work
      FastInsecureHasher::new_deno_versioned()
        .write_hashable(source)
        .finish(),
    )
  }
}

impl rusqlite::types::ToSql for CacheDBHash {
  fn to_sql(&self) -> rusqlite::Result<rusqlite::types::ToSqlOutput<'_>> {
    Ok(rusqlite::types::ToSqlOutput::Owned(
      // sqlite doesn't support u64, but it does support i64 so store
      // this value "incorrectly" as i64 then convert back to u64 on read
      rusqlite::types::Value::Integer(self.0 as i64),
    ))
  }
}

impl rusqlite::types::FromSql for CacheDBHash {
  fn column_result(
    value: rusqlite::types::ValueRef,
  ) -> rusqlite::types::FromSqlResult<Self> {
    match value {
      rusqlite::types::ValueRef::Integer(i) => Ok(Self::new(i as u64)),
      _ => Err(rusqlite::types::FromSqlError::InvalidType),
    }
  }
}

/// What should the cache should do on failure?
#[derive(Debug, Default)]
pub enum CacheFailure {
  /// Return errors if failure mode otherwise unspecified.
  #[default]
  Error,
  /// Create an in-memory cache that is not persistent.
  InMemory,
  /// Create a blackhole cache that ignores writes and returns empty reads.
  Blackhole,
}

/// Configuration SQL and other parameters for a [`CacheDB`].
#[derive(Debug)]
pub struct CacheDBConfiguration {
  /// SQL to run for a new database.
  pub table_initializer: &'static str,
  /// SQL to run when the version from [`crate::version::deno()`] changes.
  pub on_version_change: &'static str,
  /// Prepared statements to pre-heat while initializing the database.
  pub preheat_queries: &'static [&'static str],
  /// What the cache should do on failure.
  pub on_failure: CacheFailure,
}

impl CacheDBConfiguration {
  fn create_combined_sql(&self) -> String {
    format!(
      concat!(
        "PRAGMA journal_mode=WAL;",
        "PRAGMA synchronous=NORMAL;",
        "PRAGMA temp_store=memory;",
        "PRAGMA page_size=4096;",
        "PRAGMA mmap_size=6000000;",
        "PRAGMA optimize;",
        "CREATE TABLE IF NOT EXISTS info (key TEXT PRIMARY KEY, value TEXT NOT NULL);",
        "{}",
      ),
      self.table_initializer
    )
  }
}

#[derive(Debug)]
enum ConnectionState {
  Connected(Connection),
  Blackhole,
  Error(Arc<AnyError>),
}

/// A cache database that eagerly initializes itself off-thread, preventing initialization operations
/// from blocking the main thread.
#[derive(Debug, Clone)]
pub struct CacheDB {
  // TODO(mmastrac): We can probably simplify our thread-safe implementation here
  conn: Arc<Mutex<OnceCell<ConnectionState>>>,
  path: Option<PathBuf>,
  config: &'static CacheDBConfiguration,
  version: &'static str,
}

impl Drop for CacheDB {
  fn drop(&mut self) {
    // No need to clean up an in-memory cache in an way -- just drop and go.
    let path = match self.path.take() {
      Some(path) => path,
      _ => return,
    };

    // If Deno is panicking, tokio is sometimes gone before we have a chance to shutdown. In
    // that case, we just allow the drop to happen as expected.
    if tokio::runtime::Handle::try_current().is_err() {
      return;
    }

    // For on-disk caches, see if we're the last holder of the Arc.
    let arc = std::mem::take(&mut self.conn);
    if let Ok(inner) = Arc::try_unwrap(arc) {
      // Hand off SQLite connection to another thread to do the surprisingly expensive cleanup
      let inner = inner.into_inner().into_inner();
      if let Some(conn) = inner {
        spawn_blocking(move || {
          drop(conn);
          log::trace!(
            "Cleaned up SQLite connection at {}",
            path.to_string_lossy()
          );
        });
      }
    }
  }
}

impl CacheDB {
  pub fn in_memory(
    config: &'static CacheDBConfiguration,
    version: &'static str,
  ) -> Self {
    CacheDB {
      conn: Arc::new(Mutex::new(OnceCell::new())),
      path: None,
      config,
      version,
    }
  }

  pub fn from_path(
    config: &'static CacheDBConfiguration,
    path: PathBuf,
    version: &'static str,
  ) -> Self {
    log::debug!("Opening cache {}...", path.to_string_lossy());
    let new = Self {
      conn: Arc::new(Mutex::new(OnceCell::new())),
      path: Some(path),
      config,
      version,
    };

    new.spawn_eager_init_thread();
    new
  }

  /// Useful for testing: re-create this cache DB with a different current version.
  #[cfg(test)]
  pub(crate) fn recreate_with_version(mut self, version: &'static str) -> Self {
    // By taking the lock, we know there are no initialization threads alive
    drop(self.conn.lock());

    let arc = std::mem::take(&mut self.conn);
    let conn = match Arc::try_unwrap(arc) {
      Err(_) => panic!("Failed to unwrap connection"),
      Ok(conn) => match conn.into_inner().into_inner() {
        Some(ConnectionState::Connected(conn)) => conn,
        _ => panic!("Connection had failed and cannot be unwrapped"),
      },
    };

    Self::initialize_connection(self.config, &conn, version).unwrap();

    let cell = OnceCell::new();
    _ = cell.set(ConnectionState::Connected(conn));
    Self {
      conn: Arc::new(Mutex::new(cell)),
      path: self.path.clone(),
      config: self.config,
      version,
    }
  }

  fn spawn_eager_init_thread(&self) {
    let clone = self.clone();
    debug_assert!(tokio::runtime::Handle::try_current().is_ok());
    spawn_blocking(move || {
      let lock = clone.conn.lock();
      clone.initialize(&lock);
    });
  }

  /// Open the connection in memory or on disk.
  fn actually_open_connection(
    &self,
    path: Option<&Path>,
  ) -> Result<Connection, rusqlite::Error> {
    match path {
      // This should never fail unless something is very wrong
      None => Connection::open_in_memory(),
      Some(path) => Connection::open(path),
    }
  }

  /// Attempt to initialize that connection.
  fn initialize_connection(
    config: &CacheDBConfiguration,
    conn: &Connection,
    version: &str,
  ) -> Result<(), rusqlite::Error> {
    let sql = config.create_combined_sql();
    conn.execute_batch(&sql)?;

    // Check the version
    let existing_version = conn
      .query_row(
        "SELECT value FROM info WHERE key='CLI_VERSION' LIMIT 1",
        [],
        |row| row.get::<_, String>(0),
      )
      .optional()?
      .unwrap_or_default();

    // If Deno has been upgraded, run the SQL to update the version
    if existing_version != version {
      conn.execute_batch(config.on_version_change)?;
      let mut stmt = conn
        .prepare("INSERT OR REPLACE INTO info (key, value) VALUES (?1, ?2)")?;
      stmt.execute(["CLI_VERSION", version])?;
    }

    // Preheat any prepared queries
    for preheat in config.preheat_queries {
      drop(conn.prepare_cached(preheat)?);
    }
    Ok(())
  }

  /// Open and initialize a connection.
  fn open_connection_and_init(
    &self,
    path: Option<&Path>,
  ) -> Result<Connection, rusqlite::Error> {
    let conn = self.actually_open_connection(path)?;
    Self::initialize_connection(self.config, &conn, self.version)?;
    Ok(conn)
  }

  /// This function represents the policy for dealing with corrupted cache files. We try fairly aggressively
  /// to repair the situation, and if we can't, we prefer to log noisily and continue with in-memory caches.
  fn open_connection(&self) -> Result<ConnectionState, AnyError> {
    open_connection(self.config, self.path.as_deref(), |maybe_path| {
      self.open_connection_and_init(maybe_path)
    })
  }

  fn initialize<'a>(
    &self,
    lock: &'a MutexGuard<OnceCell<ConnectionState>>,
  ) -> &'a ConnectionState {
    lock.get_or_init(|| match self.open_connection() {
      Ok(conn) => conn,
      Err(e) => ConnectionState::Error(e.into()),
    })
  }

  pub fn with_connection<T: Default>(
    &self,
    f: impl FnOnce(&Connection) -> Result<T, AnyError>,
  ) -> Result<T, AnyError> {
    let lock = self.conn.lock();
    let conn = self.initialize(&lock);

    match conn {
      ConnectionState::Blackhole => {
        // Cache is a blackhole - nothing in or out.
        Ok(T::default())
      }
      ConnectionState::Error(e) => {
        // This isn't ideal because we lose the original underlying error
        let err = AnyError::msg(e.clone().to_string());
        Err(err)
      }
      ConnectionState::Connected(conn) => f(conn),
    }
  }

  #[cfg(test)]
  pub fn ensure_connected(&self) -> Result<(), AnyError> {
    self.with_connection(|_| Ok(()))
  }

  pub fn execute(
    &self,
    sql: &'static str,
    params: impl Params,
  ) -> Result<usize, AnyError> {
    self.with_connection(|conn| {
      let mut stmt = conn.prepare_cached(sql)?;
      let res = stmt.execute(params)?;
      Ok(res)
    })
  }

  pub fn exists(
    &self,
    sql: &'static str,
    params: impl Params,
  ) -> Result<bool, AnyError> {
    self.with_connection(|conn| {
      let mut stmt = conn.prepare_cached(sql)?;
      let res = stmt.exists(params)?;
      Ok(res)
    })
  }

  /// Query a row from the database with a mapping function.
  pub fn query_row<T, F>(
    &self,
    sql: &'static str,
    params: impl Params,
    f: F,
  ) -> Result<Option<T>, AnyError>
  where
    F: FnOnce(&rusqlite::Row<'_>) -> Result<T, AnyError>,
  {
    let res = self.with_connection(|conn| {
      let mut stmt = conn.prepare_cached(sql)?;
      let mut rows = stmt.query(params)?;
      if let Some(row) = rows.next()? {
        let res = f(row)?;
        Ok(Some(res))
      } else {
        Ok(None)
      }
    })?;
    Ok(res)
  }
}

/// This function represents the policy for dealing with corrupted cache files. We try fairly aggressively
/// to repair the situation, and if we can't, we prefer to log noisily and continue with in-memory caches.
fn open_connection(
  config: &CacheDBConfiguration,
  path: Option<&Path>,
  open_connection_and_init: impl Fn(
    Option<&Path>,
  ) -> Result<Connection, rusqlite::Error>,
) -> Result<ConnectionState, AnyError> {
  // Success on first try? We hope that this is the case.
  let err = match open_connection_and_init(path) {
    Ok(conn) => return Ok(ConnectionState::Connected(conn)),
    Err(err) => err,
  };

  let Some(path) = path.as_ref() else {
    // If an in-memory DB fails, that's game over
    log::error!("Failed to initialize in-memory cache database.");
    return Err(err.into());
  };

  // ensure the parent directory exists
  if let Some(parent) = path.parent() {
    match std::fs::create_dir_all(parent) {
      Ok(_) => {
        log::debug!("Created parent directory for cache db.");
      }
      Err(err) => {
        log::debug!("Failed creating the cache db parent dir: {:#}", err);
      }
    }
  }

  // There are rare times in the tests when we can't initialize a cache DB the first time, but it succeeds the second time, so
  // we don't log these at a debug level.
  log::trace!(
    "Could not initialize cache database '{}', retrying... ({err:?})",
    path.to_string_lossy(),
  );

  // Try a second time, and keep retrying while the failure is transient
  let err = match retry_open_with_backoff(path, &open_connection_and_init) {
    Ok(conn) => return Ok(ConnectionState::Connected(conn)),
    Err(err) => err,
  };

  // Only delete a corrupt file: replacing a database that other connections
  // in this process still have open makes SQLite truncate the shared-memory
  // file they have mapped.
  let is_tty = std::io::stderr().is_terminal();
  if is_corruption_error(&err) {
    log::log!(
      if is_tty { log::Level::Warn } else { log::Level::Trace },
      "Could not initialize cache database '{}', deleting and retrying... ({err:?})",
      path.to_string_lossy()
    );
    if std::fs::remove_file(path).is_ok() {
      // Try a third time if we successfully deleted it
      let res = open_connection_and_init(Some(path));
      if let Ok(conn) = res {
        return Ok(ConnectionState::Connected(conn));
      };
    }
  }

  log_failure_mode(path, is_tty, config);
  handle_failure_mode(config, err, open_connection_and_init)
}

/// Returns whether the error means the database is temporarily locked by
/// another connection rather than broken, so opening it should be retried.
fn is_transient_error(err: &rusqlite::Error) -> bool {
  matches!(
    err,
    rusqlite::Error::SqliteFailure(ffi_err, _)
      if matches!(
        ffi_err.code,
        rusqlite::ErrorCode::DatabaseBusy
          | rusqlite::ErrorCode::DatabaseLocked
      )
  )
}

/// Returns whether the error means the database file itself is unusable.
fn is_corruption_error(err: &rusqlite::Error) -> bool {
  matches!(
    err,
    rusqlite::Error::SqliteFailure(ffi_err, _)
      if matches!(
        ffi_err.code,
        rusqlite::ErrorCode::DatabaseCorrupt
          | rusqlite::ErrorCode::NotADatabase
      )
  )
}

/// Maximum number of delayed retries while opening fails transiently.
const TRANSIENT_ERROR_RETRIES: u32 = 7;
/// Delay before the first delayed retry; doubles on each subsequent retry up
/// to [`TRANSIENT_ERROR_MAX_DELAY`]. The default schedule waits ~1.3s in total.
const TRANSIENT_ERROR_BASE_DELAY: Duration = Duration::from_millis(10);
const TRANSIENT_ERROR_MAX_DELAY: Duration = Duration::from_millis(1000);

/// Open the database, retrying with exponential backoff while the failure is
/// transient. Returns the first non-transient error, or the last error once
/// [`TRANSIENT_ERROR_RETRIES`] delayed retries are exhausted.
fn retry_open_with_backoff(
  path: &Path,
  open_connection_and_init: impl Fn(
    Option<&Path>,
  ) -> Result<Connection, rusqlite::Error>,
) -> Result<Connection, rusqlite::Error> {
  let mut delay = TRANSIENT_ERROR_BASE_DELAY;
  let mut attempt = 0;
  loop {
    let err = match open_connection_and_init(Some(path)) {
      Ok(conn) => return Ok(conn),
      Err(err) => err,
    };
    if attempt == TRANSIENT_ERROR_RETRIES || !is_transient_error(&err) {
      return Err(err);
    }
    attempt += 1;
    log::trace!(
      "Cache database '{}' is unavailable, retrying in {}ms (attempt {}/{})... ({err:?})",
      path.to_string_lossy(),
      delay.as_millis(),
      attempt,
      TRANSIENT_ERROR_RETRIES,
    );
    std::thread::sleep(delay);
    delay = (delay * 2).min(TRANSIENT_ERROR_MAX_DELAY);
  }
}

fn log_failure_mode(path: &Path, is_tty: bool, config: &CacheDBConfiguration) {
  match config.on_failure {
    CacheFailure::InMemory => {
      log::log!(
        if is_tty {
          log::Level::Error
        } else {
          log::Level::Trace
        },
        "Failed to open cache file '{}', opening in-memory cache.",
        path.to_string_lossy()
      );
    }
    CacheFailure::Blackhole => {
      log::log!(
        if is_tty {
          log::Level::Error
        } else {
          log::Level::Trace
        },
        "Failed to open cache file '{}', performance may be degraded.",
        path.to_string_lossy()
      );
    }
    CacheFailure::Error => {
      log::error!(
        "Failed to open cache file '{}', expect further errors.",
        path.to_string_lossy()
      );
    }
  }
}

fn handle_failure_mode(
  config: &CacheDBConfiguration,
  err: rusqlite::Error,
  open_connection_and_init: impl Fn(
    Option<&Path>,
  ) -> Result<Connection, rusqlite::Error>,
) -> Result<ConnectionState, AnyError> {
  match config.on_failure {
    CacheFailure::InMemory => {
      Ok(ConnectionState::Connected(open_connection_and_init(None)?))
    }
    CacheFailure::Blackhole => Ok(ConnectionState::Blackhole),
    CacheFailure::Error => Err(err.into()),
  }
}

#[cfg(test)]
mod tests {
  use std::os::unix::fs::MetadataExt;
  use std::sync::atomic::AtomicUsize;
  use std::sync::atomic::Ordering;
  use std::sync::mpsc;

  use super::*;

  static TEST_DB: CacheDBConfiguration = CacheDBConfiguration {
    table_initializer: "create table if not exists test(value TEXT);",
    on_version_change: "delete from test;",
    preheat_queries: &[],
    on_failure: CacheFailure::InMemory,
  };

  fn sqlite_error(code: std::ffi::c_int) -> rusqlite::Error {
    rusqlite::Error::SqliteFailure(rusqlite::ffi::Error::new(code), None)
  }

  fn values(conn: &Connection) -> Vec<String> {
    let mut stmt = conn.prepare("select value from test order by 1").unwrap();
    stmt
      .query_map([], |row| row.get(0))
      .unwrap()
      .collect::<Result<_, _>>()
      .unwrap()
  }

  #[tokio::test]
  async fn contention_does_not_replace_a_database_in_use() {
    let temp_dir = tempfile::tempdir().unwrap();
    let path = temp_dir.path().join("data");
    let holder = CacheDB::from_path(&TEST_DB, path.clone(), "1.0");
    holder
      .execute("insert into test values (?1)", ["a"])
      .unwrap();
    let inode = std::fs::metadata(&path).unwrap().ino();
    holder.execute("BEGIN IMMEDIATE", []).unwrap();

    let (release_tx, release_rx) = mpsc::channel::<()>();
    let releaser = std::thread::spawn({
      let holder = holder.clone();
      move || {
        release_rx.recv().unwrap();
        holder.execute("COMMIT", []).unwrap();
      }
    });
    let failures = AtomicUsize::new(0);
    let state = open_connection(&TEST_DB, Some(&path), |maybe_path| {
      let res = Connection::open(maybe_path.unwrap()).and_then(|conn| {
        // SQLite skips the busy handler for some contention (e.g. a stale
        // WAL snapshot), so fail fast the way those cases do. The version
        // change makes initialization write.
        conn.busy_timeout(Duration::ZERO)?;
        CacheDB::initialize_connection(&TEST_DB, &conn, "2.0")?;
        Ok(conn)
      });
      if res.is_err() && failures.fetch_add(1, Ordering::SeqCst) == 1 {
        release_tx.send(()).unwrap();
      }
      res
    })
    .unwrap();
    releaser.join().unwrap();

    assert_eq!(std::fs::metadata(&path).unwrap().ino(), inode);
    holder
      .execute("insert into test values (?1)", ["b"])
      .unwrap();
    let holder_value = holder
      .query_row("select value from test", [], |row| {
        Ok(row.get::<_, String>(0).unwrap())
      })
      .unwrap();
    assert_eq!(holder_value.as_deref(), Some("b"));
    let ConnectionState::Connected(conn) = state else {
      panic!("expected a connection");
    };
    assert_eq!(values(&conn), ["b"]);
  }

  #[tokio::test]
  async fn open_error_then_contention_does_not_delete_the_database() {
    let temp_dir = tempfile::tempdir().unwrap();
    let path = temp_dir.path().join("data");
    std::fs::write(&path, b"in use").unwrap();
    let attempts = AtomicUsize::new(0);
    let state = open_connection(&TEST_DB, Some(&path), |maybe_path| {
      match (maybe_path, attempts.fetch_add(1, Ordering::SeqCst)) {
        (Some(_), 0) => Err(sqlite_error(rusqlite::ffi::SQLITE_CANTOPEN)),
        (Some(_), 1 | 2) => Err(sqlite_error(rusqlite::ffi::SQLITE_BUSY)),
        (Some(path), _) => Connection::open(path),
        (None, _) => Connection::open_in_memory(),
      }
    })
    .unwrap();

    assert!(matches!(state, ConnectionState::Connected(_)));
    assert_eq!(attempts.load(Ordering::SeqCst), 4);
    assert_eq!(std::fs::read(&path).unwrap(), b"in use");
  }

  #[tokio::test]
  async fn unopenable_database_falls_back_immediately_without_deleting() {
    let temp_dir = tempfile::tempdir().unwrap();
    let path = temp_dir.path().join("data");
    std::fs::write(&path, b"in use").unwrap();
    let attempts = AtomicUsize::new(0);
    let state =
      open_connection(&TEST_DB, Some(&path), |maybe_path| match maybe_path {
        Some(_) => {
          attempts.fetch_add(1, Ordering::SeqCst);
          Err(sqlite_error(rusqlite::ffi::SQLITE_CANTOPEN))
        }
        None => Connection::open_in_memory(),
      })
      .unwrap();

    assert!(matches!(state, ConnectionState::Connected(_)));
    assert_eq!(attempts.load(Ordering::SeqCst), 2);
    assert_eq!(std::fs::read(&path).unwrap(), b"in use");
  }

  #[tokio::test]
  async fn persistent_contention_falls_back_without_deleting() {
    let temp_dir = tempfile::tempdir().unwrap();
    let path = temp_dir.path().join("data");
    std::fs::write(&path, b"in use").unwrap();
    let state =
      open_connection(&TEST_DB, Some(&path), |maybe_path| match maybe_path {
        Some(_) => Err(sqlite_error(rusqlite::ffi::SQLITE_BUSY)),
        None => Connection::open_in_memory(),
      })
      .unwrap();

    assert!(matches!(state, ConnectionState::Connected(_)));
    assert_eq!(std::fs::read(&path).unwrap(), b"in use");
  }

  #[tokio::test]
  async fn corrupt_database_is_recreated_on_disk() {
    let temp_dir = tempfile::tempdir().unwrap();
    let path = temp_dir.path().join("data");
    std::fs::write(&path, [b'x'; 4096]).unwrap();

    let db = CacheDB::from_path(&TEST_DB, path.clone(), "1.0");
    db.execute("insert into test values (?1)", ["a"]).unwrap();

    let conn = Connection::open(&path).unwrap();
    assert_eq!(values(&conn), ["a"]);
  }

  #[tokio::test]
  async fn concurrent_initialization_shares_one_database() {
    let temp_dir = tempfile::tempdir().unwrap();
    let path = temp_dir.path().join("cache").join("data");
    let dbs = (0..8)
      .map(|_| CacheDB::from_path(&TEST_DB, path.clone(), "1.0"))
      .collect::<Vec<_>>();
    for db in &dbs {
      db.ensure_connected().unwrap();
    }

    dbs[0]
      .execute("insert into test values (?1)", ["a"])
      .unwrap();
    for db in &dbs {
      let value = db
        .query_row("select value from test", [], |row| {
          Ok(row.get::<_, String>(0).unwrap())
        })
        .unwrap();
      assert_eq!(value.as_deref(), Some("a"));
    }
  }
}
