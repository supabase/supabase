#[macro_export]
macro_rules! integration_test_listen_fut {
  (
    $port:expr,
    $tls:expr,
    $main_file:expr,
    $policy:expr,
    $flag:expr,
    $tx:expr,
    $token:expr
  ) => {{
    use std::str::FromStr;

    use __private::futures_util::FutureExt;
    use __private::Tls;

    use $crate::macros::test_macros::__private;

    let main_service_path = String::from($main_file);
    let tls: Option<base::server::Tls> = $tls.clone();
    let addr = std::net::SocketAddr::from_str(&format!("0.0.0.0:{}", $port))
      .expect("failed to parse the address to bind the server");

    let mut builder = base::server::Builder::new(addr, &main_service_path);

    if let Some(tls) = tls {
      builder.tls(tls);
    }
    if let Some(policy) = $policy {
      builder.user_worker_policy(policy);
    }
    if let Some(token) = $token.clone() {
      builder.termination_token(token);
    }

    builder.event_callback($tx.clone());
    *builder.flags_mut() = $flag;

    async move { builder.build().await?.listen().await }.boxed()
  }};
}

#[macro_export]
macro_rules! integration_test_with_server_flag {
  (
    $flag:expr,
    $main_file:expr,
    $port:expr,
    $url:expr,
    $policy:expr,
    $req_builder:expr,
    $tls:expr, ($($function:tt)+) $(, $($token:tt)+)?
  ) => {
    use $crate::macros::test_macros::__private;

    use __private::futures_util::FutureExt;
    use __private::ServerHealth;
    use __private::Tls;
    use __private::reqwest_v011;

    let (tx, mut rx) = tokio::sync::mpsc::channel::<ServerHealth>(1);

    let req_builder: Option<reqwest_v011::RequestBuilder> = $req_builder;
    let tls: Option<Tls> = $tls;
    let schema = if tls.is_some() { "https" } else { "http" };
    let signal = tokio::spawn(async move {
      while let
        Some(ServerHealth::Listening(event_rx, metric_src)) = rx.recv().await
      {
        $crate::integration_test_with_server_flag!(
          @req event_rx,
          metric_src,
          schema,
          $port,
          $url,
          req_builder,
          ($($function)+)
        );
      }
      None
    });

    let token = $crate::integration_test_with_server_flag!(
      @term $(, $($token)+)?
    );
    let mut listen_fut = $crate::integration_test_listen_fut!(
      $port,
      tls,
      $main_file,
      $policy,
      $flag,
      tx,
      token
    );

    tokio::select! {
      resp = signal => {
        if let Ok(maybe_response_from_server) = resp {
          // then, after checking the response... (2)
          let resp = maybe_response_from_server.unwrap();
          $crate::integration_test_with_server_flag!(
            @resp resp, ($($function)+)
          )
          .await;
        } else {
          panic!("Request thread had a heart attack");
        }
      }

      // we poll the listen future till get a response (1)
      res = &mut listen_fut => {
        if res.is_err() {
          res.unwrap();
        } else {
          panic!("This one should not end first");
        }
      }
    }

    // if we have a termination token, we should advence a listen future to
    // the end for a graceful exit. (3)
    if let Some(token) = token {
      let join_fut = tokio::spawn(async move {
        let _ = listen_fut.await;
      });

      $crate::integration_test_with_server_flag!(
        @term_cleanup $($($token)+)?, token, join_fut
      );
    }
  };

  (@term , #[manual] $token:expr) => {
    Some($token)
  };

  (@term , $token:expr) => {
    Some($token)
  };

  (@term) => {
    None
  };

  (@term_cleanup $(#[manual] $_:expr)?, $__:ident, $___:ident) => {};
  (@term_cleanup $_:expr, $token:ident, $join_fut:ident) => {
    let wait_fut = async move {
      let (_, ret) = tokio::join!(
        $token.cancel_and_wait(),
        $join_fut
      );

      ret.unwrap();
    };

    if tokio::time::timeout(
      // XXX(Nyannyacha): Should we apply variable timeout?
      core::time::Duration::from_secs(30),
      wait_fut
    )
    .await
    .is_err()
    {
        panic!("failed to terminate server within 30 seconds");
    }
  };

  (
    @req
    $event_rx:ident,
    $metric_src:ident,
    $schema:expr,
    $port:expr,
    $url:expr,
    $req_builder:expr,
    ($req:expr, $_:expr)
  ) => {
    if let Some(resp) = __private::infer_req_closure_signature(
      $req,
      (
        $port,
        $url,
        $req_builder,
        $event_rx,
        $metric_src,
      )
    )
    .await
    {
      return Some(resp);
    } else {
      let resp = reqwest_v011::get(format!(
        "{}://localhost:{}/{}",
        $schema,
        $port,
        $url
      ))
      .await;
      return Some(resp);
    }
  };

  (
    @req
    $_:ident,
    $__:ident,
    $schema:expr,
    $port:expr,
    $url:expr,
    $req_builder:expr,
    $___:expr
  ) => {
    if let Some(req_factory) = $req_builder {
      return Some(req_factory.send().await);
    } else {
      let resp = reqwest_v011::get(format!(
        "{}://localhost:{}/{}",
        $schema,
        $port,
        $url
      )).await;
      return Some(resp);
    }
  };

  (@resp $var:ident, ($_:expr, $resp:expr)) => {
    __private::infer_resp_closure_signature($resp, $var)
  };

  (@resp $var:ident, $resp:expr) => {
    __private::infer_resp_closure_signature($resp, $var)
  };
}

#[macro_export]
macro_rules! integration_test {
  (
    $main_file:expr,
    $port:expr,
    $url:expr,
    $policy:expr,
    $req_builder:expr,
    $tls:expr,
    ($($function:tt)+) $(, $($token:tt)+)?
  ) => {
    $crate::integration_test_with_server_flag!(
      ServerFlags::default(),
      $main_file,
      $port,
      $url,
      $policy,
      $req_builder,
      $tls,
      ($($function)+)
      $(,$($token)+)?
    )
  };
}

#[doc(hidden)]
pub mod __private {
  use std::future::Future;

  use ext_runtime::SharedMetricSource;
  use reqwest_v011::Error;
  use reqwest_v011::RequestBuilder;
  use reqwest_v011::Response;
  use tokio::sync::mpsc;

  use crate::server::ServerEvent;

  pub use crate::server::ServerFlags;
  pub use crate::server::ServerHealth;
  pub use crate::server::Tls;
  pub use crate::worker::TerminationToken;
  pub use futures_util;
  pub use reqwest_v011;

  /// NOTE(Nyannyacha): This was defined to enable pattern matching in closure
  /// argument positions.
  type ReqTuple = (
    u16,
    &'static str,
    Option<RequestBuilder>,
    mpsc::UnboundedReceiver<ServerEvent>,
    SharedMetricSource,
  );

  pub async fn infer_req_closure_signature<F, R>(
    closure: F,
    args: ReqTuple,
  ) -> Option<Result<Response, Error>>
  where
    F: FnOnce(ReqTuple) -> R,
    R: Future<Output = Option<Result<Response, Error>>>,
  {
    closure(args).await
  }

  pub async fn infer_resp_closure_signature<F, R>(
    closure: F,
    arg0: Result<Response, Error>,
  ) where
    F: FnOnce(Result<Response, Error>) -> R,
    R: Future<Output = ()>,
  {
    closure(arg0).await;
  }
}
