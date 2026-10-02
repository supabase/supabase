use std::collections::HashMap;
use std::path::Path;
use std::sync::Arc;

use anyhow::Context;
use deno_npm::npm_rc::NpmRc;
use deno_npm::npm_rc::ResolvedNpmRc;
use tokio::fs;

use crate::args::npm_registry_url;

pub async fn create_npmrc<P>(
  path: P,
  maybe_env_vars: Option<&HashMap<String, String>>,
) -> Result<Arc<ResolvedNpmRc>, anyhow::Error>
where
  P: AsRef<Path>,
{
  let get_env_fn =
    |k: &str| maybe_env_vars.as_ref().and_then(|it| it.get(k).cloned());
  NpmRc::parse(
    fs::read_to_string(path)
      .await
      .context("failed to read path")?
      .as_str(),
    &get_env_fn,
  )
  .context("failed to parse .npmrc file")?
  .as_resolved(npm_registry_url())
  .context("failed to resolve .npmrc file")
  .map(Arc::new)
}
