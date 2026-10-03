use std::sync::Arc;

use anyhow::bail;
use deno::deno_tls;
use deno::deno_tls::deno_native_certs::load_native_certs;
use deno::deno_tls::rustls::RootCertStore;
use deno::deno_tls::RootCertStoreProvider;
use deno_core::error::AnyError;
use ext_runtime::cert::ValueRootCertStoreProvider;

pub fn get_root_cert_store_provider(
) -> Result<Arc<dyn RootCertStoreProvider>, AnyError> {
  // Create and populate a root cert store based on environment variable.
  // Reference: https://github.com/denoland/deno/blob/v1.37.0/cli/args/mod.rs#L467
  let mut root_cert_store = RootCertStore::empty();
  let ca_stores: Vec<String> = (|| {
    let env_ca_store = std::env::var("DENO_TLS_CA_STORE").ok()?;
    Some(
      env_ca_store
        .split(',')
        .map(|s| s.trim().to_string())
        .filter(|s| !s.is_empty())
        .collect(),
    )
  })()
  .unwrap_or_else(|| vec!["mozilla".to_string()]);

  for store in ca_stores.iter() {
    match store.as_str() {
      "mozilla" => {
        root_cert_store = deno_tls::create_default_root_cert_store();
      }
      "system" => {
        let roots = load_native_certs().expect("could not load platform certs");
        for root in roots {
          root_cert_store
            .add((&*root.0).into())
            .expect("Failed to add platform cert to root cert store");
        }
      }
      _ => {
        bail!(
          concat!(
            "Unknown certificate store \"{0}\" specified ",
            "(allowed: \"system,mozilla\")"
          ),
          store
        );
      }
    }
  }

  Ok(Arc::new(ValueRootCertStoreProvider::new(
    root_cert_store.clone(),
  )))
}
