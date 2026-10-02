use std::sync::Arc;

use deno_core::unsync::sync::AtomicFlag;
use deno_core::Resource;
use tokio_util::sync::CancellationToken;

pub struct ConnWatcher(pub Option<CancellationToken>, pub Arc<AtomicFlag>);

// FIXME(Nyannyacha): Comment it out for now. Not confident if it is ok cancel
// the token here.
// impl Drop for ConnWatcher {
//   fn drop(&mut self) {
//     if let Some(token) = self.0.as_ref() {
//       if !self.1.is_raised() {
//         token.cancel();
//       }
//     }
//   }
// }

impl Resource for ConnWatcher {
  fn name(&self) -> std::borrow::Cow<'_, str> {
    "connWatcher".into()
  }
}

impl ConnWatcher {
  pub fn into_inner(mut self) -> Option<CancellationToken> {
    self.0.take()
  }
}
