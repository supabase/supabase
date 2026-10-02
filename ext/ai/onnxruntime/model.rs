use std::sync::Arc;

use anyhow::Result;
use deno_core::serde_v8::to_v8;
use deno_core::ToV8;
use ort::session::Session;
use reqwest::Url;

use super::session::get_session;
use super::session::load_session_from_bytes;
use super::session::load_session_from_url;
use super::session::SessionWithId;

#[derive(Debug, Clone)]
pub struct ModelInfo {
  pub id: String,
  pub input_names: Vec<String>,
  pub output_names: Vec<String>,
}

impl std::fmt::Display for ModelInfo {
  fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
    self.id.fmt(f)
  }
}

#[derive(Debug)]
pub struct Model {
  info: ModelInfo,
  session: Arc<Session>,
}

impl Model {
  fn new(session_with_id: SessionWithId) -> Self {
    let input_names = session_with_id
      .session
      .inputs
      .iter()
      .map(|input| input.name.clone())
      .collect::<Vec<_>>();

    let output_names = session_with_id
      .session
      .outputs
      .iter()
      .map(|output| output.name.clone())
      .collect::<Vec<_>>();

    Self {
      info: ModelInfo {
        id: session_with_id.id,
        input_names,
        output_names,
      },
      session: session_with_id.session,
    }
  }

  pub fn get_info(&self) -> ModelInfo {
    self.info.clone()
  }

  pub fn get_session(&self) -> Arc<Session> {
    self.session.clone()
  }

  pub async fn from_id(id: &str) -> Option<Self> {
    get_session(id)
      .await
      .map(|it| SessionWithId::from((id.to_string(), it)))
      .map(Self::new)
  }

  pub async fn from_url(model_url: Url) -> Result<Self> {
    load_session_from_url(model_url).await.map(Self::new)
  }

  pub async fn from_bytes(model_bytes: &[u8]) -> Result<Self> {
    load_session_from_bytes(model_bytes).await.map(Self::new)
  }
}

impl<'a> ToV8<'a> for ModelInfo {
  type Error = std::convert::Infallible;

  fn to_v8(
    self,
    scope: &mut deno_core::v8::HandleScope<'a>,
  ) -> std::result::Result<
    deno_core::v8::Local<'a, deno_core::v8::Value>,
    Self::Error,
  > {
    let v8_values =
      to_v8(scope, (self.id, self.input_names, self.output_names));

    Ok(v8_values.unwrap())
  }
}
