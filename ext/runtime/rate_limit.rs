use std::sync::Arc;
use std::time::Duration;
use std::time::Instant;

use dashmap::DashMap;
use regex::Regex;
use serde::Deserialize;
use serde::Serialize;
use tokio_util::sync::CancellationToken;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TraceRateLimitBudget {
  pub local: u32,
  pub global: u32,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct TraceRateLimitRule {
  pub matches: String,
  pub ttl: u64,
  pub budget: TraceRateLimitBudget,
}

struct CompiledRule {
  matches: Regex,
  ttl: Duration,
  budget: TraceRateLimitBudget,
}

#[derive(Debug)]
struct Entry {
  count: u32,
  expires_at: Instant,
}

#[derive(Debug, Clone, Default)]
pub struct SharedRateLimitTable {
  table: Arc<DashMap<String, Entry>>,
}

impl SharedRateLimitTable {
  /// Spawns a background task that removes expired entries every `interval`.
  /// The task shuts down when `cancel` is cancelled.
  pub fn spawn_cleanup_task(
    &self,
    interval: Duration,
    cancel: CancellationToken,
  ) {
    let table = self.table.clone();
    tokio::spawn(async move {
      loop {
        tokio::select! {
          _ = cancel.cancelled() => break,
          _ = tokio::time::sleep(interval) => {
            let now = Instant::now();
            table.retain(|_, entry| entry.expires_at > now);
          }
        }
      }
    });
  }

  /// Returns `Ok(())` when the request is allowed, or `Err(retry_after_ms)`
  /// with the number of milliseconds until the window resets when denied.
  pub fn check_and_increment(
    &self,
    key: &str,
    budget: u32,
    ttl: Duration,
  ) -> Result<(), u64> {
    let now = Instant::now();

    let mut entry =
      self.table.entry(key.to_string()).or_insert_with(|| Entry {
        count: 0,
        expires_at: now + ttl,
      });

    if now >= entry.expires_at {
      tracing::debug!(
        key,
        count = entry.count,
        budget,
        "rate limit entry expired, resetting"
      );
      entry.count = 0;
      entry.expires_at = now + ttl;
    }

    let allowed = entry.count < budget;
    tracing::trace!(
      key,
      count = entry.count,
      budget,
      ?ttl,
      allowed,
      "rate limit check"
    );

    if !allowed {
      let retry_after_ms =
        entry.expires_at.saturating_duration_since(now).as_millis() as u64;
      return Err(retry_after_ms);
    }

    entry.count += 1;
    Ok(())
  }
}

/// Bundles the shared table and per-worker rules together.
/// `Some` only when both are present; passed through the worker creation chain.
#[derive(Debug, Clone)]
pub struct TraceRateLimiterConfig {
  pub table: SharedRateLimitTable,
  pub rules: Vec<TraceRateLimitRule>,
  /// Caller-supplied stable key shared across all instances of the same
  /// function.  Used as the rate-limit key for untraced requests so the global
  /// budget accumulates correctly regardless of how many worker instances exist.
  pub global_key: Option<String>,
}

/// Rate-limit configuration as it travels through the worker creation pipeline.
///
/// - `Rules`: rules provided by JS; the pool hasn't attached a shared table yet.
/// - `Configured`: the pool has assembled the full config; ready for compilation.
#[derive(Debug, Clone, Default)]
pub enum RateLimiterOpts {
  #[default]
  Disabled,
  Rules {
    rules: Vec<TraceRateLimitRule>,
    global_key: String,
  },
  Configured(TraceRateLimiterConfig),
}

#[derive(Clone)]
pub struct TraceRateLimiter {
  table: SharedRateLimitTable,
  rules: Arc<Vec<CompiledRule>>,
  global_key: Option<String>,
}

impl TraceRateLimiter {
  pub fn new(
    TraceRateLimiterConfig {
      table,
      rules,
      global_key,
    }: TraceRateLimiterConfig,
  ) -> Result<Self, regex::Error> {
    let compiled = rules
      .into_iter()
      .map(|r| {
        Ok(CompiledRule {
          matches: Regex::new(&r.matches)?,
          ttl: Duration::from_secs(r.ttl),
          budget: r.budget,
        })
      })
      .collect::<Result<Vec<_>, regex::Error>>()?;

    Ok(Self {
      table,
      rules: Arc::new(compiled),
      global_key,
    })
  }

  /// Returns `Ok(())` when the request is allowed, or `Err(retry_after_ms)`
  /// with the number of milliseconds until the window resets when denied.
  pub fn check_and_increment(
    &self,
    url: &str,
    key: &str,
    is_traced: bool,
  ) -> Result<(), u64> {
    let rule = self.rules.iter().find(|r| r.matches.is_match(url));

    let Some(rule) = rule else {
      return Ok(());
    };

    if is_traced {
      self
        .table
        .check_and_increment(key, rule.budget.local, rule.ttl)
    } else {
      // For untraced requests a stable global_key is required so the global
      // budget accumulates correctly across worker instances.  Deny the request
      // if the caller did not supply one.
      let Some(fid) = self.global_key.as_deref() else {
        return Err(0);
      };
      self
        .table
        .check_and_increment(fid, rule.budget.global, rule.ttl)
    }
  }
}
