use anyhow::anyhow;
use anyhow::Error;
use deno_config::workspace::SpecifiedImportMap;
use deno_core::serde_json;
use deno_core::url::Url;
use std::fs;
use std::path::Path;
use urlencoding::decode;

pub fn load_import_map(
  maybe_path: Option<&str>,
) -> Result<Option<SpecifiedImportMap>, Error> {
  if let Some(path_str) = maybe_path {
    let json_str;
    let base_url;

    // check if the path is a data URI (prefixed with data:)
    // the data URI takes the following format
    // data:{encodeURIComponent(mport_map.json)?{encodeURIComponent(base_path)}
    if path_str.starts_with("data:") {
      let data_uri = Url::parse(path_str)?;
      json_str = decode(data_uri.path())?.into_owned();
      if let Some(query) = data_uri.query() {
        base_url = Url::from_directory_path(decode(query)?.into_owned())
          .map_err(|_| anyhow!("invalid import map base url"))?;
      } else {
        base_url = Url::from_directory_path(std::env::current_dir().unwrap())
          .map_err(|_| anyhow!("invalid import map base url"))?;
      }
    } else {
      let path = Path::new(&path_str);
      let abs_path = std::env::current_dir().map(|p| p.join(path))?;
      json_str = fs::read_to_string(abs_path.clone())?;
      base_url = Url::from_directory_path(abs_path.parent().unwrap())
        .map_err(|_| anyhow!("invalid import map base url"))?;
    }

    let value = serde_json::from_str(&json_str)?;

    Ok(Some(SpecifiedImportMap { base_url, value }))
  } else {
    Ok(None)
  }
}
