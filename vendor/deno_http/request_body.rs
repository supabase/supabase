// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.
use bytes::Bytes;
use deno_core::futures::stream::Peekable;
use deno_core::futures::Stream;
use deno_core::futures::StreamExt;
use deno_core::futures::TryFutureExt;
use deno_core::AsyncRefCell;
use deno_core::AsyncResult;
use deno_core::BufView;
use deno_core::RcRef;
use deno_core::Resource;
use hyper::body::Body;
use hyper::body::Incoming;
use hyper::body::SizeHint;
use std::borrow::Cow;
use std::pin::Pin;
use std::rc::Rc;
use std::task::ready;
use std::task::Poll;

/// Converts a hyper incoming body stream into a stream of [`Bytes`] that we can use to read in V8.
struct ReadFuture(Incoming);

impl Stream for ReadFuture {
  type Item = Result<Bytes, hyper::Error>;

  fn poll_next(
    self: Pin<&mut Self>,
    cx: &mut std::task::Context<'_>,
  ) -> Poll<Option<Self::Item>> {
    // Loop until we receive a non-empty frame from Hyper
    let this = self.get_mut();
    loop {
      let res = ready!(Pin::new(&mut this.0).poll_frame(cx));
      break match res {
        Some(Ok(frame)) => {
          if let Ok(data) = frame.into_data() {
            // Ensure that we never yield an empty frame
            if !data.is_empty() {
              break Poll::Ready(Some(Ok(data)));
            }
          }
          // Loop again so we don't lose the waker
          continue;
        }
        Some(Err(e)) => Poll::Ready(Some(Err(e))),
        None => Poll::Ready(None),
      };
    }
  }
}

pub struct HttpRequestBody(AsyncRefCell<Peekable<ReadFuture>>, SizeHint);

impl HttpRequestBody {
  pub fn new(body: Incoming) -> Self {
    let size_hint = body.size_hint();
    Self(AsyncRefCell::new(ReadFuture(body).peekable()), size_hint)
  }

  async fn read(self: Rc<Self>, limit: usize) -> Result<BufView, hyper::Error> {
    let peekable = RcRef::map(self, |this| &this.0);
    let mut peekable = peekable.borrow_mut().await;
    match Pin::new(&mut *peekable).peek_mut().await {
      None => Ok(BufView::empty()),
      Some(Err(_)) => Err(peekable.next().await.unwrap().err().unwrap()),
      Some(Ok(bytes)) => {
        if bytes.len() <= limit {
          // We can safely take the next item since we peeked it
          return Ok(BufView::from(peekable.next().await.unwrap()?));
        }
        let ret = bytes.split_to(limit);
        Ok(BufView::from(ret))
      }
    }
  }
}

impl Resource for HttpRequestBody {
  fn name(&self) -> Cow<'_, str> {
    "requestBody".into()
  }

  fn read(self: Rc<Self>, limit: usize) -> AsyncResult<BufView> {
    Box::pin(HttpRequestBody::read(self, limit).map_err(Into::into))
  }

  fn size_hint(&self) -> (u64, Option<u64>) {
    (self.1.lower(), self.1.upper())
  }
}
