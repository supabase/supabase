// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use crate::CancelHandle;
use crate::CancelableResponseFuture;
use crate::FetchHandler;

use deno_core::futures::FutureExt;
use deno_core::futures::TryFutureExt;
use deno_core::url::Url;
use deno_core::CancelFuture;
use deno_core::OpState;
use deno_fs::FileSystemRc;
use http::StatusCode;
use http_body_util::BodyExt;
use std::rc::Rc;

/// An implementation which tries to read file URLs from the file system via
/// the runtime's configured file system.
#[derive(Clone)]
pub struct FsFetchHandler;

impl FetchHandler for FsFetchHandler {
  fn fetch_file(
    &self,
    state: &mut OpState,
    url: &Url,
  ) -> (CancelableResponseFuture, Option<Rc<CancelHandle>>) {
    let cancel_handle = CancelHandle::new_rc();
    let path_result = url.to_file_path();
    let fs = state.borrow::<FileSystemRc>().clone();
    let response_fut = async move {
      let path = path_result?;
      let body = fs
        .read_file_async(path, None)
        .await
        .map_err(|_| ())?
        .into_owned();
      let body = http_body_util::Full::new(body.into())
        .map_err(|never| match never {})
        .boxed();
      let response = http::Response::builder()
        .status(StatusCode::OK)
        .body(body)
        .map_err(|_| ())?;
      Ok::<_, ()>(response)
    }
    .map_err(move |_| super::FetchError::NetworkError)
    .or_cancel(&cancel_handle)
    .boxed_local();

    (response_fut, Some(cancel_handle))
  }
}
