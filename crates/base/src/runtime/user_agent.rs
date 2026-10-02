use std::sync::Arc;

use deno_core::error::AnyError;
use http::header::HeaderValue;
use http::header::USER_AGENT;
use http::HeaderMap;

/// Hook run for every outbound request a worker makes.
///
/// It takes the header map rather than the request: `fetch()` and `node:http`
/// build `Request<ReqBody>` while `node:http2` builds `Request<()>`, and a
/// `dyn Fn` cannot be generic over the body type. Headers are the surface all
/// paths share — and the only thing stamping touches anyway.
pub type RequestBuilderHook =
  Arc<dyn Fn(&mut HeaderMap) -> Result<(), AnyError> + Send + Sync>;

/// Builds the `deno_fetch` request hook that keeps `comment` on the
/// `User-Agent` of every request a worker sends.
///
/// `deno_fetch` already falls back to the runtime's own `User-Agent` when a
/// request carries none, so the hook only has to handle requests that set the
/// header themselves: those keep what they set, with `comment` appended, and
/// so cannot shed the project they were sent from.
///
/// Returns `None` if `comment` cannot be represented as a header value.
pub fn stamping_hook(comment: &str) -> Option<RequestBuilderHook> {
  let comment = HeaderValue::from_str(comment)
    .ok()
    .filter(|it| !it.is_empty())?;
  Some(Arc::new(move |headers: &mut HeaderMap| {
    append_user_agent_comment(headers, &comment);
    Ok(())
  }))
}

/// Appends `comment` to the `User-Agent`, if the request set one at all.
fn append_user_agent_comment(headers: &mut HeaderMap, comment: &HeaderValue) {
  let http::header::Entry::Occupied(mut entry) = headers.entry(USER_AGENT)
  else {
    return;
  };

  // Nothing to append to, and nothing to append twice to.
  let current = entry.get().as_bytes();
  if current.is_empty() {
    entry.insert(comment.clone());
    return;
  } else if current
    .windows(comment.len())
    .any(|it| it == comment.as_bytes())
  {
    return;
  }

  let mut value = Vec::with_capacity(current.len() + 1 + comment.len());
  value.extend_from_slice(current);
  value.push(b' ');
  value.extend_from_slice(comment.as_bytes());

  // The parts are header values already, so the join is one too.
  if let Ok(value) = HeaderValue::from_bytes(&value) {
    entry.insert(value);
  }
}

#[cfg(test)]
mod tests {
  use super::*;

  fn append(user_agent: Option<&str>) -> Option<String> {
    let comment = HeaderValue::from_static("(variant; ref=meow)");
    let mut headers = HeaderMap::new();
    if let Some(user_agent) = user_agent {
      headers.insert(USER_AGENT, HeaderValue::from_str(user_agent).unwrap());
    }

    append_user_agent_comment(&mut headers, &comment);
    headers
      .get(USER_AGENT)
      .map(|it| it.to_str().unwrap().to_string())
  }

  #[test]
  fn test_append_user_agent_comment() {
    // A request that sets no `User-Agent` is left to `deno_fetch`, which fills
    // in the runtime's own.
    assert_eq!(append(None), None);

    // One the request set itself is kept, but cannot shed the comment.
    assert_eq!(
      append(Some("curl/8.7.1")).as_deref(),
      Some("curl/8.7.1 (variant; ref=meow)")
    );

    // Already stamped (a forwarded `User-Agent`, say): left alone.
    assert_eq!(
      append(Some("curl/8.7.1 (variant; ref=meow)")).as_deref(),
      Some("curl/8.7.1 (variant; ref=meow)")
    );

    // An empty one has nothing to append to.
    assert_eq!(append(Some("")).as_deref(), Some("(variant; ref=meow)"));
  }

  #[test]
  fn test_stamping_hook_rejects_invalid_comments() {
    assert!(stamping_hook("(variant; ref=meow)").is_some());
    assert!(stamping_hook("").is_none());
    assert!(stamping_hook("new\nline").is_none());
  }
}
