use std::future::Future;
use std::pin::Pin;
use std::task::Poll;

#[repr(transparent)]
pub struct MaskValueAsSend<V> {
  pub value: V,
}

unsafe impl<R> Send for MaskValueAsSend<R> {}

impl<R> MaskValueAsSend<R> {
  #[inline(always)]
  pub fn into_inner(self) -> R {
    self.value
  }
}

#[allow(dead_code)] // Used by optional runtime configurations.
pub struct MaskFutureAsSend<Fut> {
  pub fut: MaskValueAsSend<Fut>,
}

impl<Fut> From<Fut> for MaskFutureAsSend<Fut>
where
  Fut: Future,
{
  fn from(value: Fut) -> Self {
    Self {
      fut: MaskValueAsSend { value },
    }
  }
}

impl<Fut: Future> Future for MaskFutureAsSend<Fut> {
  type Output = Fut::Output;

  fn poll(
    self: Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
  ) -> Poll<Self::Output> {
    unsafe { Pin::new_unchecked(&mut self.get_unchecked_mut().fut.value) }
      .poll(cx)
  }
}
