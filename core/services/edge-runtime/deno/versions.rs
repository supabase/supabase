use std::borrow::Cow;

use deno_telemetry::OtelRuntimeConfig;

use crate::version;

pub fn edge_runtime_version() -> &'static str {
  option_env!("GIT_V_TAG").unwrap_or("0.1.0")
}

/// `User-Agent` sent by every worker, tagged with the project the worker
/// belongs to when it is known.
pub fn user_agent(project_ref: Option<&str>) -> String {
  // TODO: It should be changed to a well-known name for the ecosystem.
  format!("Deno/{} {}", version(), user_agent_comment(project_ref))
}

/// The comment part of [`user_agent`]: a single [RFC 9110 comment][1], so it
/// can also be appended to a `User-Agent` supplied by the function itself (see
/// `base`'s `user_agent` module).
///
/// [1]: https://www.rfc-editor.org/rfc/rfc9110#name-user-agent
pub fn user_agent_comment(project_ref: Option<&str>) -> String {
  let ref_part = project_ref
    .map(|it| format!("; ref={it}"))
    .unwrap_or_default();
  format!(
    "(variant; SupabaseEdgeRuntime/{}{ref_part})",
    edge_runtime_version()
  )
}

/// Accepts a project ref only if it is safe to put in a header comment.
///
/// Refs are alphanumeric in practice; anything else is dropped rather than
/// escaped, since a ref we don't recognize is not worth attributing traffic
/// to.
pub fn sanitize_project_ref(project_ref: &str) -> Option<&str> {
  let is_valid = !project_ref.is_empty()
    && project_ref.len() <= 64
    && project_ref
      .bytes()
      .all(|it| it.is_ascii_alphanumeric() || it == b'-' || it == b'_');
  is_valid.then_some(project_ref)
}

pub fn is_canary() -> bool {
  false
}

pub fn otel_runtime_config() -> OtelRuntimeConfig {
  OtelRuntimeConfig {
    runtime_name: Cow::Borrowed("deno"),
    runtime_version: Cow::Borrowed(version()),
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn test_user_agent() {
    assert_eq!(
      user_agent(Some("abcdefghijklmnopqrst")),
      format!(
        "Deno/{} (variant; SupabaseEdgeRuntime/{}; ref=abcdefghijklmnopqrst)",
        version(),
        edge_runtime_version()
      )
    );

    assert_eq!(
      user_agent(None),
      format!(
        "Deno/{} (variant; SupabaseEdgeRuntime/{})",
        version(),
        edge_runtime_version()
      )
    );
  }

  #[test]
  fn test_sanitize_project_ref() {
    assert_eq!(
      sanitize_project_ref("abcdefghijklmnopqrst"),
      Some("abcdefghijklmnopqrst")
    );
    assert_eq!(
      sanitize_project_ref("with-dash_and_1"),
      Some("with-dash_and_1")
    );

    assert_eq!(sanitize_project_ref(""), None);
    assert_eq!(sanitize_project_ref("has space"), None);
    assert_eq!(sanitize_project_ref("closes)comment"), None);
    assert_eq!(sanitize_project_ref("new\nline"), None);
    assert_eq!(sanitize_project_ref(&"a".repeat(65)), None);
  }
}
