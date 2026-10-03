use std::collections::HashSet;

use deno_config::deno_json::TsConfigForEmit;
use deno_core::serde_json;
use deno_semver::jsr::JsrDepPackageReq;
use deno_semver::jsr::JsrPackageReqReference;
use deno_semver::npm::NpmPackageReqReference;

pub fn deno_json_deps(
  config: &deno_config::deno_json::ConfigFile,
) -> HashSet<JsrDepPackageReq> {
  let values = imports_values(config.json.imports.as_ref())
    .into_iter()
    .chain(scope_values(config.json.scopes.as_ref()));
  let mut set = values_to_set(values);

  if let Some(serde_json::Value::Object(compiler_options)) =
    &config.json.compiler_options
  {
    // add jsxImportSource
    if let Some(serde_json::Value::String(value)) =
      compiler_options.get("jsxImportSource")
    {
      if let Some(dep_req) = value_to_dep_req(value) {
        set.insert(dep_req);
      }
    }
    // add jsxImportSourceTypes
    if let Some(serde_json::Value::String(value)) =
      compiler_options.get("jsxImportSourceTypes")
    {
      if let Some(dep_req) = value_to_dep_req(value) {
        set.insert(dep_req);
      }
    }
    // add the dependencies in the types array
    if let Some(serde_json::Value::Array(types)) = compiler_options.get("types")
    {
      for value in types {
        if let serde_json::Value::String(value) = value {
          if let Some(dep_req) = value_to_dep_req(value) {
            set.insert(dep_req);
          }
        }
      }
    }
  }

  set
}

fn imports_values(value: Option<&serde_json::Value>) -> Vec<&String> {
  let Some(obj) = value.and_then(|v| v.as_object()) else {
    return Vec::new();
  };
  let mut items = Vec::with_capacity(obj.len());
  for value in obj.values() {
    if let serde_json::Value::String(value) = value {
      items.push(value);
    }
  }
  items
}

fn scope_values(value: Option<&serde_json::Value>) -> Vec<&String> {
  let Some(obj) = value.and_then(|v| v.as_object()) else {
    return Vec::new();
  };
  obj.values().flat_map(|v| imports_values(Some(v))).collect()
}

fn values_to_set<'a>(
  values: impl Iterator<Item = &'a String>,
) -> HashSet<JsrDepPackageReq> {
  let mut entries = HashSet::new();
  for value in values {
    if let Some(dep_req) = value_to_dep_req(value) {
      entries.insert(dep_req);
    }
  }
  entries
}

fn value_to_dep_req(value: &str) -> Option<JsrDepPackageReq> {
  if let Ok(req_ref) = JsrPackageReqReference::from_str(value) {
    Some(JsrDepPackageReq::jsr(req_ref.into_inner().req))
  } else if let Ok(req_ref) = NpmPackageReqReference::from_str(value) {
    Some(JsrDepPackageReq::npm(req_ref.into_inner().req))
  } else {
    None
  }
}

pub fn check_warn_tsconfig(ts_config: &TsConfigForEmit) {
  if let Some(ignored_options) = &ts_config.maybe_ignored_options {
    log::warn!("{}", ignored_options);
  }
  let serde_json::Value::Object(obj) = &ts_config.ts_config.0 else {
    return;
  };
  if obj.get("experimentalDecorators") == Some(&serde_json::Value::Bool(true)) {
    log::warn!(
      "{} experimentalDecorators compiler option is deprecated and may be removed at any time",
      "Warning"
    );
  }
}
