#![allow(clippy::arc_with_non_send_sync)]
#![allow(clippy::async_yields_async)]

use std::borrow::Cow;
use std::collections::HashMap;
use std::io;
use std::io::BufRead;
use std::io::Cursor;
use std::net::IpAddr;
use std::net::Ipv4Addr;
use std::net::SocketAddr;
use std::path::PathBuf;
use std::str::FromStr;
use std::sync::atomic::AtomicBool;
use std::sync::Arc;
use std::time::Duration;

use anyhow::Context;
use async_tungstenite::WebSocketStream;
use base::get_default_permissions;
use base::integration_test;
use base::integration_test_listen_fut;
use base::integration_test_with_server_flag;
use base::server::Builder;
use base::server::RequestIdleTimeout;
use base::server::ServerEvent;
use base::server::ServerFlags;
use base::server::ServerHealth;
use base::server::Tls;
use base::utils::test_utils::create_test_user_worker;
use base::utils::test_utils::ensure_npm_package_installed;
use base::utils::test_utils::test_user_runtime_opts;
use base::utils::test_utils::test_user_worker_pool_policy;
use base::utils::test_utils::TestBed;
use base::utils::test_utils::TestBedBuilder;
use base::worker;
use base::worker::TerminationToken;
use base::WorkerKind;
use deno::deno_telemetry::OtelConfig;
use deno::DenoOptionsBuilder;
use deno_core::error::AnyError;
use deno_core::serde_json::json;
use deno_core::serde_json::{self};
use deno_facade::generate_binary_eszip;
use deno_facade::EmitterFactory;
use deno_facade::EszipPayloadKind;
use deno_facade::Metadata;
use ext_event_worker::events::LogLevel;
use ext_event_worker::events::ShutdownReason;
use ext_event_worker::events::WorkerEventWithMetadata;
use ext_event_worker::events::WorkerEvents;
use ext_runtime::SharedMetricSource;
use ext_workers::context::MainWorkerRuntimeOpts;
use ext_workers::context::WorkerContextInitOpts;
use ext_workers::context::WorkerRequestMsg;
use ext_workers::context::WorkerRuntimeOpts;
use futures_util::future::BoxFuture;
use futures_util::Future;
use futures_util::FutureExt;
use futures_util::SinkExt;
use futures_util::StreamExt;
use http::Method;
use http::Request;
use http::Response as HttpResponse;
use http::StatusCode;
use http_utils::utils::get_upgrade_type;
use http_v02 as http;
use http_v02::HeaderValue;
use hyper::body::to_bytes;
use hyper::Body;
use hyper_v014 as hyper;
use reqwest::header;
use reqwest::multipart::Form;
use reqwest::multipart::Part;
use reqwest::Certificate;
use reqwest::Client;
use reqwest::RequestBuilder;
use reqwest::Response;
use reqwest_v011 as reqwest;
use serde::Deserialize;
use serial_test::serial;
use tokio::fs;
use tokio::io::AsyncRead;
use tokio::io::AsyncReadExt;
use tokio::io::AsyncWrite;
use tokio::io::AsyncWriteExt;
use tokio::join;
use tokio::net::TcpListener;
use tokio::net::TcpStream;
use tokio::sync::mpsc;
use tokio::sync::oneshot;
use tokio::time::sleep;
use tokio::time::timeout;
use tokio_rustls::rustls;
use tokio_rustls::rustls::pki_types::ServerName;
use tokio_rustls::rustls::ClientConfig;
use tokio_rustls::rustls::RootCertStore;
use tokio_rustls::TlsAcceptor;
use tokio_rustls::TlsConnector;
use tokio_util::compat::TokioAsyncReadCompatExt;
use tokio_util::sync::CancellationToken;
use tungstenite::Message;

const MB: usize = 1024 * 1024;
const NON_SECURE_PORT: u16 = 8498;
const SECURE_PORT: u16 = 4433;
const TESTBED_DEADLINE_SEC: u64 = 20;

static OTEL_INIT: std::sync::OnceLock<()> = std::sync::OnceLock::new();

fn init_otel() {
  OTEL_INIT.get_or_init(|| {
    deno::deno_telemetry::init(
      deno::versions::otel_runtime_config(),
      OtelConfig::default(),
    )
    .unwrap();
  });
}

const TLS_LOCALHOST_ROOT_CA: &[u8] =
  include_bytes!("./fixture/tls/root-ca.pem");
const TLS_LOCALHOST_CERT: &[u8] = include_bytes!("./fixture/tls/localhost.pem");
const TLS_LOCALHOST_KEY: &[u8] =
  include_bytes!("./fixture/tls/localhost-key.pem");

#[tokio::test]
#[serial]
async fn test_custom_readable_stream_response() {
  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "readable-stream-resp",
    None,
    None,
    None,
    (|resp| async {
      assert_eq!(
        resp.unwrap().text().await.unwrap(),
        "Hello world from streams"
      );
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_import_map_inlined() {
  integration_test!(
    "./test_cases/with-import-map",
    NON_SECURE_PORT,
    "",
    None,
    None,
    None,
    (|resp| async {
      let res = resp.unwrap();
      assert!(res.status().as_u16() == 200);

      let body_bytes = res.bytes().await.unwrap();
      assert_eq!(body_bytes, r#"{"message":"ok"}"#);
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_import_map_file_path() {
  integration_test!(
    "./test_cases/with-import-map-2",
    NON_SECURE_PORT,
    "",
    None,
    None,
    None,
    (|resp| async {
      let res = resp.unwrap();
      assert!(res.status().as_u16() == 200);

      let body_bytes = res.bytes().await.unwrap();
      assert_eq!(body_bytes, r#"{"message":"ok"}"#);
    }),
    TerminationToken::new()
  );
}

#[cfg(target_os = "linux")]
#[tokio::test]
#[serial]
async fn test_not_trigger_pku_sigsegv_due_to_jit_compilation_cli() {
  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "slow_resp",
    None,
    None,
    None,
    (|resp| async {
      assert!(resp.unwrap().text().await.unwrap().starts_with("meow: "));
    }),
    TerminationToken::new()
  );
}

#[cfg(target_os = "linux")]
#[tokio::test]
#[serial]
async fn test_not_trigger_pku_sigsegv_due_to_jit_compilation_non_cli() {
  let pool_termination_token = TerminationToken::new();
  let main_termination_token = TerminationToken::new();

  // create a user worker pool
  let (_, worker_pool_tx) = worker::create_user_worker_pool(
    Arc::default(),
    test_user_worker_pool_policy(),
    None,
    Some(pool_termination_token.clone()),
    vec![],
    None,
  )
  .await
  .unwrap();

  let surface = worker::WorkerSurfaceBuilder::new()
    .init_opts(WorkerContextInitOpts {
      pool_key: None,
      service_path: "./test_cases/slow_resp".into(),
      no_module_cache: false,
      no_npm: None,
      env_vars: HashMap::new(),
      timing: None,
      maybe_eszip: None,
      maybe_entrypoint: None,
      maybe_module_code: None,
      conf: WorkerRuntimeOpts::MainWorker(MainWorkerRuntimeOpts {
        worker_pool_tx,
        shared_metric_src: None,
        event_worker_metric_src: None,
        context: None,
      }),
      static_patterns: vec![],

      maybe_s3_fs_config: None,
      maybe_tmp_fs_config: None,
      maybe_otel_config: None,
    })
    .termination_token(main_termination_token.clone())
    .build()
    .await
    .unwrap();

  let (res_tx, res_rx) =
    oneshot::channel::<Result<HttpResponse<Body>, hyper::Error>>();

  let req = Request::builder()
    .uri("/slow_resp")
    .method("GET")
    .body(Body::empty())
    .unwrap();

  let conn_token = CancellationToken::new();
  let msg = WorkerRequestMsg {
    req,
    res_tx,
    conn_token: Some(conn_token.clone()),
    idle_timed_out: Arc::new(AtomicBool::new(false)),
  };

  let _ = surface.msg_tx.send(msg);

  let res = res_rx.await.unwrap().unwrap();
  assert!(res.status().as_u16() == 200);

  let body_bytes = hyper::body::to_bytes(res.into_body()).await.unwrap();

  assert!(body_bytes.starts_with(b"meow: "));

  conn_token.cancel();
  pool_termination_token.cancel_and_wait().await;
  main_termination_token.cancel_and_wait().await;
}

#[tokio::test]
#[serial]
async fn test_main_worker_options_request() {
  let client = Client::new();
  let req = client
    .request(
      Method::OPTIONS,
      format!("http://localhost:{}/std_user_worker", NON_SECURE_PORT),
    )
    .body(Body::empty())
    .build()
    .unwrap();

  let original = RequestBuilder::from_parts(client, req);

  let request_builder = Some(original);

  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "",
    None,
    request_builder,
    None,
    (|resp| async {
      let res = resp.unwrap();
      assert!(res.status().as_u16() == 200);

      assert_eq!(
        res.headers().get("Access-Control-Allow-Origin").unwrap(),
        &"*"
      );
      assert_eq!(
        res.headers().get("Access-Control-Allow-Headers").unwrap(),
        &"authorization, x-client-info, apikey"
      );
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_main_worker_post_request() {
  let body_chunk = "{ \"name\": \"bar\"}";

  let content_length = &body_chunk.len();
  let chunks: Vec<Result<_, std::io::Error>> = vec![Ok(body_chunk)];
  let stream = futures_util::stream::iter(chunks);
  let body = Body::wrap_stream(stream);

  let client = Client::new();
  let req = client
    .request(
      Method::POST,
      format!("http://localhost:{}/std_user_worker", NON_SECURE_PORT),
    )
    .body(body)
    .header("Content-Type", "application/json")
    .header("Content-Length", content_length.to_string())
    .build()
    .unwrap();

  let original = RequestBuilder::from_parts(client, req);

  let request_builder = Some(original);

  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "",
    None,
    request_builder,
    None,
    (|resp| async {
      let res = resp.unwrap();
      assert!(res.status().as_u16() == 200);

      let body_bytes = res.bytes().await.unwrap();
      assert_eq!(body_bytes, "{\"message\":\"Hello bar from foo!\"}");
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_main_worker_boot_error() {
  let pool_termination_token = TerminationToken::new();
  let main_termination_token = TerminationToken::new();

  // create a user worker pool
  let (_, worker_pool_tx) = worker::create_user_worker_pool(
    Arc::default(),
    test_user_worker_pool_policy(),
    None,
    Some(pool_termination_token.clone()),
    vec![],
    None,
  )
  .await
  .unwrap();

  let result = worker::WorkerSurfaceBuilder::new()
    .init_opts(WorkerContextInitOpts {
      pool_key: None,
      service_path: "./test_cases/meow".into(),
      no_module_cache: false,
      no_npm: None,
      env_vars: HashMap::new(),
      timing: None,
      maybe_eszip: None,
      maybe_entrypoint: None,
      maybe_module_code: None,
      conf: WorkerRuntimeOpts::MainWorker(MainWorkerRuntimeOpts {
        worker_pool_tx,
        shared_metric_src: None,
        event_worker_metric_src: None,
        context: None,
      }),
      static_patterns: vec![],

      maybe_s3_fs_config: None,
      maybe_tmp_fs_config: None,
      maybe_otel_config: None,
    })
    .termination_token(main_termination_token.clone())
    .build()
    .await;

  assert!(result.is_err());
  assert!(result
    .unwrap_err()
    .to_string()
    .starts_with("worker boot error"));

  pool_termination_token.cancel_and_wait().await;
  main_termination_token.cancel_and_wait().await;
}

#[tokio::test]
#[serial]
async fn test_main_worker_abort_request() {
  let body_chunk = "{ \"name\": \"bar\"}";

  let content_length = &body_chunk.len();
  let chunks: Vec<Result<_, std::io::Error>> = vec![Ok(body_chunk)];
  let stream = futures_util::stream::iter(chunks);
  let body = Body::wrap_stream(stream);

  let client = Client::new();
  let req = client
    .request(
      Method::POST,
      format!("http://localhost:{}/std_user_worker", NON_SECURE_PORT),
    )
    .body(body)
    .header("Content-Type", "application/json")
    .header("Content-Length", content_length.to_string())
    .build()
    .unwrap();

  let original = RequestBuilder::from_parts(client, req);

  let request_builder = Some(original);

  integration_test!(
    "./test_cases/main_with_abort",
    NON_SECURE_PORT,
    "",
    None,
    request_builder,
    None,
    (|resp| async {
      let res = resp.unwrap();
      assert!(res.status().as_u16() == 500);

      let body_bytes = res.bytes().await.unwrap();
      assert_eq!(
        body_bytes,
        "{\"msg\":\"AbortError: The signal has been aborted\"}"
      );
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_main_worker_with_jsx_function() {
  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "jsx",
    None,
    None,
    None,
    (|resp: Result<reqwest::Response, reqwest::Error>| async {
      let res = resp.unwrap();
      assert!(res.status().as_u16() == 200);

      let body_bytes = res.bytes().await.unwrap();
      assert_eq!(
        body_bytes,
        r#"{"type":"div","props":{"children":"Hello"},"__k":null,"__":null,"__b":0,"__e":null,"__c":null,"__v":-1,"__i":-1,"__u":0}"#
      );
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
async fn test_main_worker_user_worker_mod_evaluate_exception() {
  let pool_termination_token = TerminationToken::new();
  let main_termination_token = TerminationToken::new();

  // create a user worker pool
  let (_, worker_pool_tx) = worker::create_user_worker_pool(
    Arc::default(),
    test_user_worker_pool_policy(),
    None,
    Some(pool_termination_token.clone()),
    vec![],
    None,
  )
  .await
  .unwrap();

  let surface = worker::WorkerSurfaceBuilder::new()
    .init_opts(WorkerContextInitOpts {
      pool_key: None,
      service_path: "./test_cases/main".into(),
      no_module_cache: false,
      no_npm: None,
      env_vars: HashMap::new(),
      timing: None,
      maybe_eszip: None,
      maybe_entrypoint: None,
      maybe_module_code: None,
      conf: WorkerRuntimeOpts::MainWorker(MainWorkerRuntimeOpts {
        worker_pool_tx,
        shared_metric_src: None,
        event_worker_metric_src: None,
        context: None,
      }),
      static_patterns: vec![],

      maybe_s3_fs_config: None,
      maybe_tmp_fs_config: None,
      maybe_otel_config: None,
    })
    .termination_token(main_termination_token.clone())
    .build()
    .await
    .unwrap();

  let (res_tx, res_rx) =
    oneshot::channel::<Result<HttpResponse<Body>, hyper::Error>>();

  let req = Request::builder()
    .uri("/boot_err_user_worker")
    .method("GET")
    .body(Body::empty())
    .unwrap();

  let conn_token = CancellationToken::new();
  let msg = WorkerRequestMsg {
    req,
    res_tx,
    conn_token: Some(conn_token.clone()),
    idle_timed_out: Arc::new(AtomicBool::new(false)),
  };

  let _ = surface.msg_tx.send(msg);

  let res = res_rx.await.unwrap().unwrap();
  assert!(res.status().as_u16() == 500);

  let body_bytes = to_bytes(res.into_body()).await.unwrap();

  assert!(body_bytes.starts_with(b"{\"msg\":\"InvalidWorkerResponse"));
}

async fn test_main_worker_post_request_with_transfer_encoding(
  maybe_tls: Option<Tls>,
) {
  let chunks: Vec<Result<_, std::io::Error>> =
    vec![Ok("{\"name\":"), Ok("\"bar\"}")];
  let stream = futures_util::stream::iter(chunks);
  let body = Body::wrap_stream(stream);

  let client = maybe_tls.client();
  let req = client
    .request(
      Method::POST,
      format!(
        "{}://localhost:{}/std_user_worker",
        maybe_tls.schema(),
        maybe_tls.port(),
      ),
    )
    .body(body)
    .header("Transfer-Encoding", "chunked")
    .build()
    .unwrap();

  let original = RequestBuilder::from_parts(client, req);
  let request_builder = Some(original);

  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "",
    None,
    request_builder,
    maybe_tls,
    (|resp| async {
      let res = resp.unwrap();
      assert!(res.status().as_u16() == 200);

      let body_bytes = res.bytes().await.unwrap();
      assert_eq!(body_bytes, "{\"message\":\"Hello bar from foo!\"}");
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_main_worker_post_request_with_transfer_encoding_non_secure() {
  test_main_worker_post_request_with_transfer_encoding(new_localhost_tls(
    false,
  ))
  .await;
}

#[tokio::test]
#[serial]
async fn test_main_worker_post_request_with_transfer_encoding_secure() {
  test_main_worker_post_request_with_transfer_encoding(new_localhost_tls(true))
    .await;
}

#[tokio::test]
#[serial]
async fn test_null_body_with_204_status() {
  integration_test!(
    "./test_cases/empty-response",
    NON_SECURE_PORT,
    "",
    None,
    None,
    None,
    (|resp| async {
      let res = resp.unwrap();
      assert!(res.status().as_u16() == 204);

      let body_bytes = res.bytes().await.unwrap();
      assert_eq!(body_bytes.len(), 0);
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_null_body_with_204_status_post() {
  let client = Client::new();
  let req = client
    .request(
      Method::POST,
      format!("http://localhost:{}", NON_SECURE_PORT),
    )
    .body(Body::empty())
    .build()
    .unwrap();

  let original = RequestBuilder::from_parts(client, req);

  let request_builder = Some(original);

  integration_test!(
    "./test_cases/empty-response",
    NON_SECURE_PORT,
    "",
    None,
    request_builder,
    None,
    (|resp| async {
      let res = resp.unwrap();
      assert!(res.status().as_u16() == 204);

      let body_bytes = res.bytes().await.unwrap();
      assert_eq!(body_bytes.len(), 0);
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_oak_server() {
  integration_test!(
    "./test_cases/oak",
    NON_SECURE_PORT,
    "oak",
    None,
    None,
    None,
    (|resp| async {
      let res = resp.unwrap();
      assert!(res.status().as_u16() == 200);

      let body_bytes = res.bytes().await.unwrap();
      assert_eq!(
        body_bytes,
        "This is an example Oak server running on Edge Functions!"
      );
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_file_upload() {
  let body_chunk = concat!(
    "--TEST\r\n",
    "Content-Disposition: form-data; name=\"file\"; filename=\"test.txt\"\r\n",
    "Content-Type: text/plain\r\n",
    "\r\n",
    "testuser\r\n",
    "--TEST--\r\n"
  );

  let content_length = &body_chunk.len();
  let chunks: Vec<Result<_, std::io::Error>> = vec![Ok(body_chunk)];
  let stream = futures_util::stream::iter(chunks);
  let body = Body::wrap_stream(stream);

  let client = Client::new();
  let req = client
    .request(
      Method::POST,
      format!("http://localhost:{}/file-upload", NON_SECURE_PORT),
    )
    .header("Content-Type", "multipart/form-data; boundary=TEST")
    .header("Content-Length", content_length.to_string())
    .body(body)
    .build()
    .unwrap();

  let original = RequestBuilder::from_parts(client, req);
  let request_builder = Some(original);

  integration_test!(
    "./test_cases/oak-v12-file-upload",
    NON_SECURE_PORT,
    "",
    None,
    request_builder,
    None,
    (|resp| async {
      let res = resp.unwrap();
      assert_eq!(res.status().as_u16(), 201);

      let body_bytes = res.bytes().await.unwrap();
      assert_eq!(body_bytes, "file-type: text/plain");
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_file_upload_real_multipart_bytes() {
  test_oak_file_upload(
    Cow::Borrowed("./test_cases/main"),
    (9.98 * MB as f32) as usize, // < 10MB (in binary)
    None,
    |resp| async {
      let res = resp.unwrap();

      assert_eq!(res.status().as_u16(), 201);

      let res = res.text().await;

      assert!(res.is_ok());
      assert_eq!(res.unwrap(), "Success!");
    },
  )
  .await;
}

#[tokio::test]
#[serial]
async fn test_file_upload_size_exceed() {
  test_oak_file_upload(
    Cow::Borrowed("./test_cases/main"),
    10 * MB,
    None,
    |resp| async {
      let res = resp.unwrap();

      assert_eq!(res.status().as_u16(), 500);

      let res = res.text().await;

      assert!(res.is_ok());
      assert_eq!(res.unwrap(), "Error!");
    },
  )
  .await;
}

#[tokio::test]
#[serial]
async fn test_node_server() {
  integration_test!(
    "./test_cases/node-server",
    NON_SECURE_PORT,
    "",
    None,
    None,
    None,
    (|resp| async {
      let res = resp.unwrap();
      assert_eq!(res.status().as_u16(), 200);
      let body_bytes = res.bytes().await.unwrap();
      assert_eq!(
        body_bytes,
        concat!(
          "Look again at that dot. That's here. That's home. That's us. On it everyone you love, ",
          "everyone you know, everyone you ever heard of, every human being who ever was, lived out ",
          "their lives. The aggregate of our joy and suffering, thousands of confident religions, ideologies, ",
          "and economic doctrines, every hunter and forager, every hero and coward, every creator and destroyer of ",
          "civilization, every king and peasant, every young couple in love, every mother and father, hopeful child, ",
          "inventor and explorer, every teacher of morals, every corrupt politician, every 'superstar,' every 'supreme leader,' ",
          "every saint and sinner in the history of our species lived there-on a mote of dust suspended in a sunbeam."
        )
      );
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_tls_throw_invalid_data() {
  integration_test!(
    "./test_cases/tls_invalid_data",
    NON_SECURE_PORT,
    "",
    None,
    None,
    None,
    (|resp| async {
      let res = resp.unwrap();
      assert!(res.status().as_u16() == 200);

      let body_bytes = res.bytes().await.unwrap();
      assert_eq!(body_bytes, r#"{"passed":true}"#);
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_user_worker_json_imports() {
  integration_test!(
    "./test_cases/json_import",
    NON_SECURE_PORT,
    "",
    None,
    None,
    None,
    (|resp| async {
      let res = resp.unwrap();
      assert!(res.status().as_u16() == 200);

      let body_bytes = res.bytes().await.unwrap();
      assert_eq!(body_bytes, r#"{"version":"1.0.0"}"#);
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_user_imports_npm() {
  integration_test!(
    "./test_cases/npm",
    NON_SECURE_PORT,
    "",
    None,
    None,
    None,
    (|resp| async {
      let res = resp.unwrap();
      assert!(res.status().as_u16() == 200);

      let body_bytes = res.bytes().await.unwrap();
      assert_eq!(
        body_bytes,
        r#"{"is_even":true,"hello":"","numbers":{"Uno":1,"Dos":2}}"#
      );
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_worker_boot_invalid_imports() {
  let opts = WorkerContextInitOpts {
    pool_key: None,
    service_path: "./test_cases/invalid_imports".into(),
    no_module_cache: false,
    no_npm: None,
    env_vars: HashMap::new(),
    timing: None,
    maybe_eszip: None,
    maybe_entrypoint: None,
    maybe_module_code: None,
    conf: WorkerRuntimeOpts::UserWorker(test_user_runtime_opts()),
    static_patterns: vec![],

    maybe_s3_fs_config: None,
    maybe_tmp_fs_config: None,
    maybe_otel_config: None,
  };

  let result = create_test_user_worker(opts).await;

  assert!(result.is_err());
  assert!(result
    .unwrap_err()
    .to_string()
    .starts_with("worker boot error"));
}

#[tokio::test]
#[serial]
async fn test_worker_boot_with_0_byte_eszip() {
  let opts = WorkerContextInitOpts {
    pool_key: None,
    service_path: "./test_cases/meow".into(),
    no_module_cache: false,
    no_npm: None,
    env_vars: HashMap::new(),
    timing: None,
    maybe_eszip: Some(EszipPayloadKind::VecKind(vec![])),
    maybe_entrypoint: Some("file:///src/index.ts".to_string()),
    maybe_module_code: None,
    conf: WorkerRuntimeOpts::UserWorker(test_user_runtime_opts()),
    static_patterns: vec![],

    maybe_s3_fs_config: None,
    maybe_tmp_fs_config: None,
    maybe_otel_config: None,
  };

  let result = create_test_user_worker(opts).await;

  assert!(result.is_err());
  assert!(format!("{:#}", result.unwrap_err()).starts_with(
    "worker boot error: failed to bootstrap runtime: unexpected end of file"
  ));
}

#[tokio::test]
#[serial]
async fn test_worker_boot_with_invalid_entrypoint() {
  let opts = WorkerContextInitOpts {
    pool_key: None,
    service_path: "./test_cases/meow".into(),
    no_module_cache: false,
    no_npm: None,
    env_vars: HashMap::new(),
    timing: None,
    maybe_eszip: None,
    maybe_entrypoint: Some("file:///meow/mmmmeeeow.ts".to_string()),
    maybe_module_code: None,
    conf: WorkerRuntimeOpts::UserWorker(test_user_runtime_opts()),
    static_patterns: vec![],

    maybe_s3_fs_config: None,
    maybe_tmp_fs_config: None,
    maybe_otel_config: None,
  };

  let result = create_test_user_worker(opts).await;

  assert!(result.is_err());
  assert!(format!("{:#}", result.unwrap_err())
    .starts_with("worker boot error: failed to bootstrap runtime: failed to determine entrypoint"));
}

#[tokio::test]
#[serial]
async fn req_failure_case_timeout() {
  let tb = TestBedBuilder::new("./test_cases/main")
    // NOTE: It should be small enough that the worker pool rejects the
    // request.
    .with_oneshot_policy(Some(10))
    .build()
    .await;

  let req_body_fn = |b: http::request::Builder| {
    b.uri("/slow_resp")
      .method("GET")
      .body(Body::empty())
      .context("can't make request")
  };

  let (res1, res2) = join!(tb.request(req_body_fn), tb.request(req_body_fn));

  let res_iter = vec![res1, res2].into_iter();
  let mut found_timeout = false;

  for res in res_iter {
    let mut res = res.unwrap();

    if !found_timeout {
      let buf = to_bytes(res.body_mut()).await.unwrap();
      let status_500 = res.status() == StatusCode::INTERNAL_SERVER_ERROR;
      let valid_output =
                buf == "{\"msg\":\"InvalidWorkerCreation: worker did not respond in time\"}";

      found_timeout = status_500 && valid_output;
    }
  }

  tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;
  assert!(found_timeout);
}

#[tokio::test]
#[serial]
async fn req_failure_case_cpu_time_exhausted() {
  let tb = TestBedBuilder::new("./test_cases/main_small_cpu_time")
    .with_oneshot_policy(None)
    .build()
    .await;

  let mut res = tb
    .request(|b| {
      b.uri("/slow_resp")
        .method("GET")
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  let buf = to_bytes(res.body_mut()).await.unwrap();

  assert_eq!(
    buf,
    "{\"msg\":\"WorkerRequestCancelled: request has been cancelled by supervisor\"}"
  );

  tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;
}

#[tokio::test]
#[serial]
async fn req_failure_case_cpu_time_exhausted_2() {
  let tb = TestBedBuilder::new("./test_cases/main_small_cpu_time")
    .with_oneshot_policy(None)
    .build()
    .await;

  let mut res = tb
    .request(|b| {
      b.uri("/cpu-sync")
        .method("GET")
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  let buf = to_bytes(res.body_mut()).await.unwrap();

  assert_eq!(
    buf,
    "{\"msg\":\"WorkerRequestCancelled: request has been cancelled by supervisor\"}"
  );

  tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;
}

#[tokio::test]
#[serial]
async fn req_failure_case_wall_clock_reached() {
  let tb = TestBedBuilder::new("./test_cases/main_small_wall_clock")
    .with_oneshot_policy(None)
    .build()
    .await;

  let mut res = tb
    .request(|b| {
      b.uri("/slow_resp")
        .method("GET")
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  let buf = to_bytes(res.body_mut()).await.unwrap();

  assert!(
    buf == "{\"msg\":\"InvalidWorkerResponse: user worker failed to respond\"}"
    || buf
      == "{\"msg\":\"WorkerRequestCancelled: request has been cancelled by supervisor\"}"
  );

  tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;
}

#[tokio::test]
#[serial]
async fn req_failture_case_memory_limit_1() {
  let tb = TestBedBuilder::new("./test_cases/main")
    .with_oneshot_policy(None)
    .build()
    .await;

  let mut res = tb
    .request(|b| {
      b.uri("/array-alloc-sync")
        .method("GET")
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  let buf = to_bytes(res.body_mut()).await.unwrap();

  assert_eq!(
    buf,
    "{\"msg\":\"WorkerRequestCancelled: request has been cancelled by supervisor\"}"
  );

  tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;
}

#[tokio::test]
#[serial]
async fn req_failture_case_memory_limit_2() {
  let tb = TestBedBuilder::new("./test_cases/main")
    .with_oneshot_policy(None)
    .build()
    .await;

  let mut res = tb
    .request(|b| {
      b.uri("/array-alloc")
        .method("GET")
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  let buf = to_bytes(res.body_mut()).await.unwrap();

  assert_eq!(
    buf,
    "{\"msg\":\"WorkerRequestCancelled: request has been cancelled by supervisor\"}"
  );

  tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;
}

#[tokio::test]
#[serial]
async fn req_failure_case_wall_clock_reached_less_than_100ms() {
  // TODO(Nyannyacha): This test seems a little flaky. If running the entire test
  // dozens of times on the local machine, it will fail with a timeout.

  let tb =
    TestBedBuilder::new("./test_cases/main_small_wall_clock_less_than_100ms")
      .with_oneshot_policy(None)
      .build()
      .await;

  let mut res = tb
    .request(|b| {
      b.uri("/slow_resp")
        .method("GET")
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  let buf = to_bytes(res.body_mut()).await.unwrap();

  assert!(
    buf == "{\"msg\":\"InvalidWorkerResponse: user worker failed to respond\"}"
    || buf == "{\"msg\":\"InvalidWorkerCreation: worker did not respond in time\"}"
    || buf
      == "{\"msg\":\"WorkerRequestCancelled: request has been cancelled by supervisor\"}"
  );

  tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;
}

async fn req_failure_case_intentional_peer_reset(maybe_tls: Option<Tls>) {
  let (server_ev_tx, mut server_ev_rx) = mpsc::unbounded_channel();

  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "slow_resp",
    None,
    None,
    maybe_tls.clone(),
    (
      |(_, url, _, mut ev, ..)| async move {
        tokio::spawn(async move {
          loop {
            tokio::select! {
              Some(ev) = ev.recv() => {
                let _ = server_ev_tx.send(ev);
                break;
              }

              else => continue
            }
          }
        });

        Some(
          maybe_tls
            .client()
            .get(format!(
              "{}://localhost:{}/{}",
              maybe_tls.schema(),
              maybe_tls.port(),
              url
            ))
            .timeout(Duration::from_millis(100))
            .send()
            .await,
        )
      },
      |_| async {}
    ),
    TerminationToken::new()
  );

  let ev = loop {
    tokio::select! {
      Some(ev) = server_ev_rx.recv() => break ev,
      else => continue,
    }
  };

  assert!(
    matches!(ev, ServerEvent::ConnectionError(e) if e.is_incomplete_message())
  );
}

#[tokio::test]
#[serial]
async fn req_failure_case_intentional_peer_reset_non_secure() {
  req_failure_case_intentional_peer_reset(new_localhost_tls(false)).await;
}

#[tokio::test]
#[serial]
async fn req_failure_case_intentional_peer_reset_secure() {
  req_failure_case_intentional_peer_reset(new_localhost_tls(true)).await;
}

#[tokio::test]
#[serial]
async fn req_failure_case_op_cancel_from_server_due_to_cpu_resource_limit() {
  test_oak_file_upload(
    Cow::Borrowed("./test_cases/main_small_cpu_time"),
    120 * MB,
    None,
    |resp| async {
      assert_op_cancel_from_server_response(resp).await;
    },
  )
  .await;
}

#[tokio::test]
#[serial]
async fn req_failure_case_op_cancel_from_server_due_to_cpu_resource_limit_2() {
  test_oak_file_upload(
    Cow::Borrowed("./test_cases/main_small_cpu_time"),
    10 * MB,
    Some("image/png"),
    |resp| async {
      assert_op_cancel_from_server_response(resp).await;
    },
  )
  .await;
}

/// When the supervisor tears down a user worker that exceeded its CPU limit,
/// two paths race each other and both outcomes are correct:
///
/// 1. The connection token is canceled before the main worker's response is
///    handed back to the server, so the server serves 503 on its own.
/// 2. The main worker's `WorkerRequestCancelled` handler wins the race, and its
///    own 500 payload is relayed to the client untouched.
///
/// Which one wins depends on scheduling alone, so accept either, but keep
/// asserting the shape of the response so that unrelated failures (most
/// notably the request body being detached from its receiver) are still caught.
async fn assert_op_cancel_from_server_response(
  resp: Result<Response, reqwest::Error>,
) {
  let res = resp.unwrap();
  let status = res.status().as_u16();
  let served_by = res
    .headers()
    .get("x-served-by")
    .map(|v| v.to_str().unwrap().to_owned());

  match status {
    503 => {
      assert_eq!(
        served_by.as_deref(),
        Some(concat!(env!("CARGO_PKG_NAME"), "/server"))
      );
    }

    500 => {
      assert_eq!(served_by, None);

      let payload = res.json::<ErrorResponsePayload>().await;

      assert!(payload.is_ok());

      let msg = payload.unwrap().msg;

      assert!(
        !msg.starts_with("TypeError: request body receiver not connected"),
        "unexpected error message: {msg}"
      );
      assert!(
        msg
          == "WorkerRequestCancelled: request has been cancelled by supervisor"
          || msg == "broken pipe",
        "unexpected error message: {msg}"
      );
    }

    _ => panic!("unexpected status code: {status}"),
  }
}

async fn test_oak_file_upload<F, R>(
  main_service: Cow<'static, str>,
  bytes: usize,
  mime: Option<&str>,
  resp_callback: F,
) where
  F: FnOnce(Result<Response, reqwest::Error>) -> R,
  R: Future<Output = ()>,
{
  let client = Client::builder().build().unwrap();
  let req = client
    .request(
      Method::POST,
      format!("http://localhost:{}/oak-file-upload", NON_SECURE_PORT),
    )
    .multipart(
      Form::new().part(
        "meow",
        Part::bytes(vec![0u8; bytes])
          .file_name("meow.bin")
          .mime_str(mime.unwrap_or("application/octet-stream"))
          .unwrap(),
      ),
    )
    .build()
    .unwrap();

  let original = RequestBuilder::from_parts(client, req);
  let request_builder = Some(original);

  integration_test_with_server_flag!(
    ServerFlags {
      request_buffer_size: Some(1024),
      ..Default::default()
    },
    main_service,
    NON_SECURE_PORT,
    "",
    None,
    request_builder,
    None,
    (|resp| async {
      resp_callback(resp).await;
    }),
    TerminationToken::new()
  );
}

async fn test_websocket_upgrade(maybe_tls: Option<Tls>, use_node_ws: bool) {
  let nonce = tungstenite::handshake::client::generate_key();
  let client = maybe_tls.client();
  let req = client
    .request(
      Method::GET,
      format!(
        "{}://localhost:{}/websocket-upgrade{}",
        maybe_tls.schema(),
        maybe_tls.port(),
        if use_node_ws { "-node" } else { "" }
      ),
    )
    .header(header::CONNECTION, "upgrade")
    .header(header::UPGRADE, "websocket")
    .header(header::SEC_WEBSOCKET_KEY, &nonce)
    .header(header::SEC_WEBSOCKET_VERSION, "13")
    .build()
    .unwrap();

  let original = RequestBuilder::from_parts(client, req);
  let request_builder = Some(original);

  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "",
    None,
    request_builder,
    maybe_tls,
    (|resp| async {
      let res = resp.unwrap();
      let accepted = get_upgrade_type(res.headers());

      assert!(res.status().as_u16() == 101);
      assert!(accepted.is_some());
      assert_eq!(accepted.as_ref().unwrap(), "websocket");

      let upgraded = res.upgrade().await.unwrap();
      let mut ws = WebSocketStream::from_raw_socket(
        upgraded.compat(),
        tungstenite::protocol::Role::Client,
        None,
      )
      .await;

      assert_eq!(
        ws.next().await.unwrap().unwrap().into_text().unwrap(),
        "meow"
      );

      ws.send(Message::Text("meow!!".into())).await.unwrap();
      assert_eq!(
        ws.next().await.unwrap().unwrap().into_text().unwrap(),
        "meow!!"
      );
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_graceful_shutdown() {
  let token = TerminationToken::new();

  let (server_ev_tx, mut server_ev_rx) = mpsc::unbounded_channel();
  let (metric_tx, metric_rx) = oneshot::channel::<SharedMetricSource>();
  let (tx, rx) = oneshot::channel::<()>();

  tokio::spawn({
    let token = token.clone();
    async move {
      let metric_src = metric_rx.await.unwrap();

      while metric_src.active_io() == 0 {
        tokio::task::yield_now().await;
      }

      assert_eq!(metric_src.active_io(), 1);
      token.cancel();

      tokio::select! {
        Some(ServerEvent::Draining) = server_ev_rx.recv() => {
          assert_eq!(metric_src.handled_requests(), 0);
        }

        else => {
          panic!("event sequence does not match != ServerEvent::Draining");
        }
      }

      while metric_src.active_io() > 0 {
        tokio::task::yield_now().await;
      }

      if timeout(Duration::from_secs(10), token.cancel_and_wait())
        .await
        .is_err()
      {
        panic!("failed to terminate server within 10 seconds");
      }

      assert_eq!(metric_src.active_io(), 0);
      assert_eq!(metric_src.handled_requests(), 1);
      assert_eq!(
        metric_src.received_requests(),
        metric_src.handled_requests()
      );

      tx.send(()).unwrap();
    }
  });

  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "slow_resp",
    None,
    None,
    None,
    (
      |(.., mut ev, metric_src)| async move {
        metric_tx.send(metric_src).unwrap();
        tokio::spawn(async move {
          while let Some(ev) = ev.recv().await {
            let _ = server_ev_tx.send(ev);
          }
        });

        None
      },
      |resp| async {
        assert_eq!(resp.unwrap().status().as_u16(), 200);
      }
    ),
    #[manual]
    token
  );

  if timeout(Duration::from_secs(10), rx).await.is_err() {
    panic!("failed to check within 10 seconds");
  }
}

#[tokio::test]
#[serial]
async fn test_websocket_upgrade_deno_non_secure() {
  test_websocket_upgrade(new_localhost_tls(false), false).await;
}

#[tokio::test]
#[serial]
async fn test_websocket_upgrade_deno_secure() {
  test_websocket_upgrade(new_localhost_tls(true), false).await;
}

#[tokio::test]
#[serial]
async fn test_websocket_upgrade_node_non_secure() {
  test_websocket_upgrade(new_localhost_tls(false), true).await;
}

#[tokio::test]
#[serial]
async fn test_websocket_upgrade_node_secure() {
  test_websocket_upgrade(new_localhost_tls(true), true).await;
}

async fn test_decorators(suffix: &str) {
  let client = Client::new();
  let req = client
    .request(
      Method::OPTIONS,
      format!("http://localhost:{}/decorator_{}", NON_SECURE_PORT, suffix),
    )
    .build()
    .unwrap();

  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "",
    None,
    Some(RequestBuilder::from_parts(client, req)),
    None,
    (|resp| async {
      let resp = resp.unwrap();

      assert_eq!(resp.status(), StatusCode::OK);
      assert_eq!(resp.text().await.unwrap().as_str(), "meow?");
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_decorator_parse_tc39() {
  test_decorators("tc39").await;
}

#[tokio::test]
#[serial]
async fn test_decorator_parse_typescript_experimental_with_metadata() {
  test_decorators("typescript_with_metadata").await;
}

#[tokio::test]
#[serial]
async fn send_partial_payload_into_closed_pipe_should_not_be_affected_worker_stability(
) {
  let tb = TestBedBuilder::new("./test_cases/main")
    .with_oneshot_policy(None)
    .build()
    .await;

  let mut resp1 = tb
    .request(|b| {
      b.uri("/chunked-char-1000ms")
        .method("GET")
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  assert_eq!(resp1.status().as_u16(), StatusCode::OK);

  let resp1_body = resp1.body_mut();
  let resp1_chunk1 = resp1_body.next().await.unwrap().unwrap();

  assert_eq!(resp1_chunk1, "m");

  drop(resp1);
  sleep(Duration::from_secs(1)).await;

  // NOTE(Nyannyacha): Before dc057b0, the statement below panics with the
  // reason `connection closed before message completed`. This is the result
  // of `Deno.serve` failing to properly handle an exception from a previous
  // request.
  let resp2 = tb
    .request(|b| {
      b.uri("/empty-response")
        .method("GET")
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  assert_eq!(resp2.status().as_u16(), StatusCode::NO_CONTENT);

  tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;
}

#[tokio::test]
#[serial]
async fn oak_with_jsr_specifier() {
  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "oak-with-jsr",
    None,
    None,
    None,
    (|resp| async {
      assert_eq!(resp.unwrap().text().await.unwrap(), "meow");
    }),
    TerminationToken::new()
  );
}

async fn test_slowloris<F, R>(
  request_read_timeout_ms: u64,
  maybe_tls: Option<Tls>,
  test_fn: F,
) where
  F: (FnOnce(Box<dyn AsyncReadWrite>) -> R) + Send + 'static,
  R: Future<Output = bool> + Send,
{
  let token = TerminationToken::new();

  let (health_tx, mut health_rx) = mpsc::channel(1);
  let (tx, rx) = oneshot::channel();

  let mut listen_fut = integration_test_listen_fut!(
    NON_SECURE_PORT,
    maybe_tls,
    "./test_cases/main",
    None,
    ServerFlags {
      request_read_timeout_ms: Some(request_read_timeout_ms),
      ..Default::default()
    },
    health_tx,
    Some(token.clone())
  );

  let req_fut = {
    let token = token.clone();
    async move {
      assert!(test_fn(maybe_tls.stream().await).await);

      if timeout(Duration::from_secs(10), token.cancel_and_wait())
        .await
        .is_err()
      {
        panic!("failed to terminate server within 10 seconds");
      }

      tx.send(()).unwrap();
    }
  };

  let join_fut = tokio::spawn(async move {
    loop {
      if let Some(ServerHealth::Listening(..)) = health_rx.recv().await {
        break;
      }
    }

    req_fut.await;
  });

  tokio::select! {
    _ = join_fut => {}
    _ = &mut listen_fut => {}
  };

  if timeout(Duration::from_secs(10), rx).await.is_err() {
    panic!("failed to check within 10 seconds");
  }
}

async fn test_slowloris_no_prompt_timeout(
  maybe_tls: Option<Tls>,
  invert: bool,
) {
  test_slowloris(
    if invert { u64::MAX } else { 5000 },
    maybe_tls,
    move |mut io| async move {
      static HEADER: &[u8] =
        b"GET /oak-with-jsr HTTP/1.1\r\nHost: localhost\r\n\r\n";

      let check_io_kind_fn = move |err: std::io::Error| {
        if invert {
          return true;
        }

        matches!(
          err.kind(),
          io::ErrorKind::BrokenPipe | io::ErrorKind::UnexpectedEof
        )
      };

      // > 5000ms
      sleep(Duration::from_secs(10)).await;

      if let Err(err) = io.write_all(HEADER).await {
        return check_io_kind_fn(err);
      }

      if let Err(err) = io.flush().await {
        return check_io_kind_fn(err);
      }

      let mut buf = vec![0; 1_048_576];

      match io.read(&mut buf).await {
        Ok(nread) => {
          if invert {
            nread > 0
          } else {
            nread == 0
          }
        }

        Err(err) => check_io_kind_fn(err),
      }
    },
  )
  .await;
}

#[tokio::test]
#[serial]
async fn test_slowloris_no_prompt_timeout_non_secure() {
  test_slowloris_no_prompt_timeout(new_localhost_tls(false), false).await;
}

#[tokio::test]
#[serial]
#[ignore = "too slow"]
async fn test_slowloris_no_prompt_timeout_non_secure_inverted() {
  test_slowloris_no_prompt_timeout(new_localhost_tls(false), true).await;
}

#[tokio::test]
#[serial]
async fn test_slowloris_no_prompt_timeout_secure() {
  test_slowloris_no_prompt_timeout(new_localhost_tls(true), false).await;
}

#[tokio::test]
#[serial]
#[ignore = "too slow"]
async fn test_slowloris_no_prompt_timeout_secure_inverted() {
  test_slowloris_no_prompt_timeout(new_localhost_tls(true), true).await;
}

async fn test_slowloris_slow_header_timedout(
  maybe_tls: Option<Tls>,
  invert: bool,
) {
  test_slowloris(
    if invert { u64::MAX } else { 5000 },
    maybe_tls,
    move |mut io| async move {
      static HEADER: &[u8] =
        b"GET /oak-with-jsr HTTP/1.1\r\nHost: localhost\r\n\r\n";

      let check_io_kind_fn = move |err: std::io::Error| {
        if invert {
          return true;
        }

        matches!(
          err.kind(),
          io::ErrorKind::BrokenPipe | io::ErrorKind::UnexpectedEof
        )
      };

      // takes 1000ms per each character (ie. > 5000ms)
      for &b in HEADER {
        if let Err(err) = io.write(&[b]).await {
          return check_io_kind_fn(err);
        }

        if let Err(err) = io.flush().await {
          return check_io_kind_fn(err);
        }

        sleep(Duration::from_secs(1)).await;
      }

      let mut buf = vec![0; 1_048_576];

      match io.read(&mut buf).await {
        Ok(nread) => {
          if invert {
            nread > 0
          } else {
            nread == 0
          }
        }

        Err(err) => check_io_kind_fn(err),
      }
    },
  )
  .await;
}

#[tokio::test]
#[serial]
async fn test_slowloris_slow_header_timedout_non_secure() {
  test_slowloris_slow_header_timedout(new_localhost_tls(false), false).await;
}

#[tokio::test]
#[serial]
#[ignore = "too slow 2x"]
async fn test_slowloris_slow_header_timedout_non_secure_inverted() {
  test_slowloris_slow_header_timedout(new_localhost_tls(false), true).await;
}

#[tokio::test]
#[serial]
async fn test_slowloris_slow_header_timedout_secure() {
  test_slowloris_slow_header_timedout(new_localhost_tls(true), false).await;
}

#[tokio::test]
#[serial]
#[ignore = "too slow 2x"]
async fn test_slowloris_slow_header_timedout_secure_inverted() {
  test_slowloris_slow_header_timedout(new_localhost_tls(true), true).await;
}

async fn test_request_idle_timeout_no_streamed_response(
  maybe_tls: Option<Tls>,
) {
  let client = maybe_tls.client();
  let req = client
    .request(
      Method::GET,
      format!(
        "{}://localhost:{}/sleep-5000ms",
        maybe_tls.schema(),
        maybe_tls.port(),
      ),
    )
    .build()
    .unwrap();

  let original = RequestBuilder::from_parts(client, req);
  let request_builder = Some(original);

  integration_test_with_server_flag!(
    ServerFlags {
      request_idle_timeout: RequestIdleTimeout::from_millis(None, Some(1000)),
      ..Default::default()
    },
    "./test_cases/main",
    NON_SECURE_PORT,
    "",
    None,
    request_builder,
    maybe_tls,
    (|resp| async {
      let resp = resp.unwrap();
      assert_eq!(resp.status().as_u16(), StatusCode::GATEWAY_TIMEOUT);
      let body = resp.bytes().await.unwrap();
      assert!(
        std::str::from_utf8(&body)
          .unwrap()
          .contains("WorkerRequestIdleTimeout"),
        "expected WorkerRequestIdleTimeout in body"
      );
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_request_idle_timeout_no_streamed_response_non_secure() {
  test_request_idle_timeout_no_streamed_response(new_localhost_tls(false))
    .await;
}

#[tokio::test]
#[serial]
#[ignore = "running too much tests"]
async fn test_request_idle_timeout_no_streamed_response_non_secure_1000() {
  for _ in 0..1000 {
    test_request_idle_timeout_no_streamed_response(new_localhost_tls(false))
      .await;
  }
}

#[tokio::test]
#[serial]
async fn test_request_idle_timeout_no_streamed_response_secure() {
  test_request_idle_timeout_no_streamed_response(new_localhost_tls(true)).await;
}

async fn test_request_idle_timeout_streamed_response(maybe_tls: Option<Tls>) {
  let client = maybe_tls.client();
  let req = client
    .request(
      Method::GET,
      format!(
        "{}://localhost:{}/chunked-char-variable-delay-max-6000ms",
        maybe_tls.schema(),
        maybe_tls.port(),
      ),
    )
    .build()
    .unwrap();

  let original = RequestBuilder::from_parts(client, req);
  let request_builder = Some(original);

  integration_test_with_server_flag!(
    ServerFlags {
      request_idle_timeout: RequestIdleTimeout::from_millis(None, Some(2000)),
      ..Default::default()
    },
    "./test_cases/main",
    NON_SECURE_PORT,
    "",
    None,
    request_builder,
    maybe_tls,
    (|resp| async {
      let resp = resp.unwrap();

      assert_eq!(resp.status().as_u16(), StatusCode::OK);
      assert!(resp.content_length().is_none());

      let mut buf = Vec::<u8>::new();
      let mut bytes_stream = resp.bytes_stream();

      loop {
        match bytes_stream.next().await {
          Some(Ok(v)) => {
            buf.extend(v);
          }

          Some(Err(_)) => {
            break;
          }

          None => {
            break;
          }
        }
      }

      assert_eq!(&buf, b"meo");
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_request_idle_timeout_streamed_response_non_secure() {
  test_request_idle_timeout_streamed_response(new_localhost_tls(false)).await;
}

#[tokio::test]
#[serial]
async fn test_request_idle_timeout_streamed_response_secure() {
  test_request_idle_timeout_streamed_response(new_localhost_tls(true)).await;
}

async fn test_request_idle_timeout_streamed_response_first_chunk_timeout(
  maybe_tls: Option<Tls>,
) {
  let client = maybe_tls.client();
  let req = client
    .request(
      Method::GET,
      format!(
        "{}://localhost:{}/chunked-char-first-6000ms",
        maybe_tls.schema(),
        maybe_tls.port(),
      ),
    )
    .build()
    .unwrap();

  let original = RequestBuilder::from_parts(client, req);
  let request_builder = Some(original);

  integration_test_with_server_flag!(
    ServerFlags {
      request_idle_timeout: RequestIdleTimeout::from_millis(None, Some(1000)),
      ..Default::default()
    },
    "./test_cases/main",
    NON_SECURE_PORT,
    "",
    None,
    request_builder,
    maybe_tls,
    (|resp| async {
      let resp = resp.unwrap();

      assert_eq!(resp.status().as_u16(), StatusCode::OK);
      assert!(resp.content_length().is_none());

      let mut buf = Vec::<u8>::new();
      let mut bytes_stream = resp.bytes_stream();

      loop {
        match bytes_stream.next().await {
          Some(Ok(v)) => {
            buf.extend(v);
          }

          Some(Err(_)) => {
            break;
          }

          None => {
            break;
          }
        }
      }

      assert_eq!(&buf, b"");
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_request_idle_timeout_streamed_response_first_chunk_timeout_non_secure(
) {
  test_request_idle_timeout_streamed_response_first_chunk_timeout(
    new_localhost_tls(false),
  )
  .await;
}

#[tokio::test]
#[serial]
async fn test_request_idle_timeout_streamed_response_first_chunk_timeout_secure(
) {
  test_request_idle_timeout_streamed_response_first_chunk_timeout(
    new_localhost_tls(true),
  )
  .await;
}

async fn test_request_idle_timeout_websocket_deno(
  maybe_tls: Option<Tls>,
  use_node_ws: bool,
) {
  let nonce = tungstenite::handshake::client::generate_key();
  let client = maybe_tls.client();
  let req = client
    .request(
      Method::GET,
      format!(
        "{}://localhost:{}/websocket-upgrade-no-send{}",
        maybe_tls.schema(),
        maybe_tls.port(),
        if use_node_ws { "-node" } else { "" }
      ),
    )
    .header(header::CONNECTION, "upgrade")
    .header(header::UPGRADE, "websocket")
    .header(header::SEC_WEBSOCKET_KEY, &nonce)
    .header(header::SEC_WEBSOCKET_VERSION, "13")
    .build()
    .unwrap();

  let original = RequestBuilder::from_parts(client, req);
  let request_builder = Some(original);

  integration_test_with_server_flag!(
    ServerFlags {
      request_idle_timeout: RequestIdleTimeout::from_millis(None, Some(1000)),
      ..Default::default()
    },
    "./test_cases/main",
    NON_SECURE_PORT,
    "",
    None,
    request_builder,
    maybe_tls,
    (|resp| async {
      let res = resp.unwrap();
      let accepted = get_upgrade_type(res.headers());

      assert!(res.status().as_u16() == 101);
      assert!(accepted.is_some());
      assert_eq!(accepted.as_ref().unwrap(), "websocket");

      let upgraded = res.upgrade().await.unwrap();
      let mut ws = WebSocketStream::from_raw_socket(
        upgraded.compat(),
        tungstenite::protocol::Role::Client,
        None,
      )
      .await;

      sleep(Duration::from_secs(3)).await;

      ws.send(Message::Text("meow!!".into())).await.unwrap();

      let err = ws.next().await.unwrap().unwrap_err();

      use tungstenite::error::ProtocolError;
      use tungstenite::Error;

      assert!(matches!(
        err,
        Error::Protocol(ProtocolError::ResetWithoutClosingHandshake)
      ));
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_request_idle_timeout_websocket_deno_non_secure() {
  test_request_idle_timeout_websocket_deno(new_localhost_tls(false), false)
    .await;
}

#[tokio::test]
#[serial]
async fn test_request_idle_timeout_websocket_deno_secure() {
  test_request_idle_timeout_websocket_deno(new_localhost_tls(true), false)
    .await;
}

#[tokio::test]
#[serial]
async fn test_request_idle_timeout_websocket_node_non_secure() {
  test_request_idle_timeout_websocket_deno(new_localhost_tls(false), true)
    .await;
}

#[tokio::test]
#[serial]
async fn test_request_idle_timeout_websocket_node_secure() {
  test_request_idle_timeout_websocket_deno(new_localhost_tls(true), true).await;
}

#[tokio::test]
#[serial]
async fn test_should_not_hang_when_forced_redirection_for_specifiers() {
  let (tx, rx) = oneshot::channel::<()>();

  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "concurrent-redirect",
    None,
    None,
    None,
    (|resp| async {
      assert_eq!(resp.unwrap().status().as_u16(), 200);
      tx.send(()).unwrap();
    }),
    TerminationToken::new()
  );

  if timeout(Duration::from_secs(10), rx).await.is_err() {
    panic!("failed to check within 10 seconds");
  }
}

async fn test_allow_net<F, R>(
  allow_net: Option<Vec<&str>>,
  url: &str,
  callback: F,
) where
  F: FnOnce(Result<Response, reqwest::Error>) -> R,
  R: Future<Output = ()>,
{
  let payload = serde_json::json!({
      "allowNet": allow_net,
      "url": url
  });

  let client = Client::new();
  let req = client
    .request(
      Method::POST,
      format!("http://localhost:{}/fetch", NON_SECURE_PORT),
    )
    .json(&payload)
    .build()
    .unwrap();

  integration_test!(
    "./test_cases/main_with_allow_net",
    NON_SECURE_PORT,
    "",
    None,
    Some(RequestBuilder::from_parts(client, req)),
    None,
    (|resp| async {
      callback(resp).await;
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_allow_net_fetch_google_com() {
  #[derive(Deserialize)]
  struct FetchResponse {
    status: u16,
    body: String,
  }

  // 1. allow only specific hosts
  test_allow_net(
    // because google.com redirects to www.google.com
    Some(vec!["google.com", "www.google.com"]),
    "https://google.com",
    |resp| async move {
      let resp = resp.unwrap();

      assert_eq!(resp.status().as_u16(), StatusCode::OK);

      let payload = resp.json::<FetchResponse>().await.unwrap();

      assert_eq!(payload.status, StatusCode::OK);
      assert!(!payload.body.is_empty());
    },
  )
  .await;

  // 2. allow only specific host (but not considering the redirected host)
  test_allow_net(
      Some(vec!["google.com"]),
      "https://google.com",
      |resp| async move {
        let resp = resp.unwrap();

        assert_eq!(resp.status().as_u16(), StatusCode::INTERNAL_SERVER_ERROR);

        let msg = resp.text().await.unwrap();

        assert_eq!(
          msg.as_str(),
          // google.com redirects to www.google.com, but we didn't allow it
          "NotCapable: Requires net access to \"www.google.com:443\", run again with the --allow-net flag"
        );
      },
    )
    .await;

  // 3. deny all hosts
  test_allow_net(None, "https://google.com", |resp| async move {
    let resp = resp.unwrap();

    assert_eq!(resp.status().as_u16(), StatusCode::INTERNAL_SERVER_ERROR);

    let msg = resp.text().await.unwrap();

    assert_eq!(
      msg.as_str(),
      "NotCapable: Requires net access to \"google.com:443\", run again with the --allow-net flag"
    );
  })
  .await;

  // 4. allow all hosts
  test_allow_net(Some(vec![]), "https://google.com", |resp| async move {
    let resp = resp.unwrap();

    assert_eq!(resp.status().as_u16(), StatusCode::OK);

    let payload = resp.json::<FetchResponse>().await.unwrap();

    assert_eq!(payload.status, StatusCode::OK);
    assert!(!payload.body.is_empty());
  })
  .await;
}

#[tokio::test]
#[serial]
async fn test_fastify_v4_package() {
  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "fastify-v4",
    None,
    None,
    None,
    (|resp| async {
      assert_eq!(resp.unwrap().text().await.unwrap(), "meow");
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_fastify_latest_package() {
  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "fastify-latest",
    None,
    None,
    None,
    (|resp| async {
      assert_eq!(resp.unwrap().text().await.unwrap(), "meow");
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_declarative_style_fetch_handler() {
  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "serve-declarative-style",
    None,
    None,
    None,
    (|resp| async {
      assert_eq!(resp.unwrap().text().await.unwrap(), "meow");
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_fetch_local_file_handler() {
  let (tx, mut rx) = mpsc::unbounded_channel();
  let tb = TestBedBuilder::new("./test_cases/main")
    .with_per_worker_policy(None)
    .with_worker_event_sender(Some(tx))
    .build()
    .await;

  let mut resp = tb
    .request(|b| {
      b.uri("/fetch-local-npm-file")
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  let status = resp.status().as_u16();
  let body = to_bytes(resp.body_mut()).await.unwrap();
  let body = String::from_utf8_lossy(&body).to_string();

  if status != 200 || body.is_empty() {
    rx.close();
    tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;

    while let Some(ev) = rx.recv().await {
      if let WorkerEvents::Log(ev) = ev.event {
        eprintln!("[worker-log] {}", ev.msg);
      }
    }
  }

  assert_eq!(status, 200);
  assert!(!body.is_empty());
}

// https://github.com/supabase/edge-runtime/issues/640
#[tokio::test]
#[serial]
async fn test_wasm_module() {
  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "wasm-module",
    None,
    None,
    None,
    (|resp| async {
      // Testing mod add(1, 2) === 3;
      assert_eq!(resp.unwrap().text().await.unwrap(), "3");
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_issue_208() {
  async fn create_simple_server(
    tls: Option<Tls>,
    token: CancellationToken,
  ) -> Result<(), AnyError> {
    let config = Arc::new(tls.server_config());
    let acceptor = TlsAcceptor::from(config);
    let listener =
      TcpListener::bind(format!("127.0.0.1:{}", tls.port())).await?;
    loop {
      let acceptor = acceptor.clone();
      tokio::select! {
        Ok((stream, _)) = listener.accept() => {
          tokio::spawn(async move {
            if let Ok(tls_stream) = acceptor.accept(stream).await {
              let _ = hyper::server::conn::Http::new().serve_connection(
                tls_stream,
                hyper::service::service_fn(|_req: _| async {
                  Ok::<_, hyper::Error>(hyper::Response::new(Body::from("meow")))
                })
              )
              .await
              .ok();
            }
          });
        }
        _ = token.cancelled() => {
          break;
        }
      }
    }
    Ok(())
  }

  let tls = new_localhost_tls(true);
  let port = tls.port();
  let token = CancellationToken::new();
  let server = tokio::spawn({
    let token = token.clone();
    async move {
      create_simple_server(tls, token).await.unwrap();
    }
  });

  {
    let client = Client::new();
    let builder = client
      .request(
        Method::POST,
        format!("http://localhost:{}/issue-208", NON_SECURE_PORT),
      )
      .header("x-port", port)
      .body(TLS_LOCALHOST_ROOT_CA);

    integration_test!(
      "./test_cases/main",
      NON_SECURE_PORT,
      "",
      None,
      Some(builder),
      None,
      (|resp| async {
        let resp = resp.unwrap();
        assert!(resp.status().as_u16() == 200);
        assert_eq!(resp.text().await.unwrap(), "meow");
      }),
      TerminationToken::new()
    );
  }

  // unknown issuer
  {
    let client = Client::new();
    let builder = client
      .request(
        Method::GET,
        format!("http://localhost:{}/issue-208", NON_SECURE_PORT),
      )
      .header("x-port", port);

    integration_test!(
      "./test_cases/main",
      NON_SECURE_PORT,
      "",
      None,
      Some(builder),
      None,
      (|resp| async {
        let resp = resp.unwrap();
        assert!(resp.status().as_u16() == 500);
        let reason = resp.text().await.unwrap();
        assert!(reason.contains("invalid peer certificate: UnknownIssuer"));
      }),
      TerminationToken::new()
    );
  }

  token.cancel();
  server.await.unwrap();
}

#[tokio::test]
#[serial]
async fn test_issue_420() {
  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "issue-420",
    None,
    None,
    None,
    (|resp| async {
      let text = resp.unwrap().text().await.unwrap();

      assert!(text.starts_with("file:///"));
      assert!(text.ends_with(
        "/node_modules/localhost/@imagemagick/magick-wasm/0.0.30/dist/index.js"
      ));
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_issue_456() {
  let tb = TestBedBuilder::new("./test_cases/main").build().await;
  let resp = tb
    .request(|b| {
      b.uri("/issue-456")
        .header("x-context-source-map", "true")
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  assert_eq!(resp.status().as_u16(), StatusCode::OK);
  tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;
}

#[tokio::test]
#[serial]
async fn test_issue_513() {
  let tb = TestBedBuilder::new("./test_cases/main").build().await;
  let resp = tb
    .request(|b| {
      b.uri("/issue-513")
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  assert_eq!(resp.status().as_u16(), StatusCode::OK);
  tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;
}

#[tokio::test]
#[serial]
async fn test_supabase_issue_29583() {
  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "supabase-issue-29583",
    None,
    None,
    None,
    (|resp| async {
      let resp = resp.unwrap();
      assert_eq!(resp.status().as_u16(), StatusCode::OK);
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_issue_func_205() {
  let (tx, mut rx) = mpsc::unbounded_channel();
  let tb = TestBedBuilder::new("./test_cases/main")
    .with_per_worker_policy(None)
    .with_worker_event_sender(Some(tx))
    .with_server_flags(ServerFlags {
      beforeunload_wall_clock_pct: Some(90),
      beforeunload_cpu_pct: Some(90),
      beforeunload_memory_pct: Some(90),
      ..Default::default()
    })
    .build()
    .await;

  let resp = tb
    .request(|b| {
      b.uri("/issue-func-205")
        .header("x-cpu-time-soft-limit-ms", HeaderValue::from_static("500"))
        .header("x-cpu-time-hard-limit-ms", HeaderValue::from_static("1000"))
        .header(
          "x-context-use-read-sync-file-api",
          HeaderValue::from_static("true"),
        )
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  assert_eq!(resp.status().as_u16(), StatusCode::INTERNAL_SERVER_ERROR);

  tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;

  while let Some(ev) = rx.recv().await {
    let WorkerEvents::Shutdown(ev) = ev.event else {
      continue;
    };
    assert_eq!(ev.reason, ShutdownReason::CPUTime);
    return;
  }

  unreachable!("test failed");
}

#[tokio::test]
#[serial]
async fn test_issue_func_280() {
  async fn run(func_name: &'static str, reason: ShutdownReason) {
    let (tx, mut rx) = mpsc::unbounded_channel();
    let tb = TestBedBuilder::new("./test_cases/main")
      .with_per_worker_policy(None)
      .with_worker_event_sender(Some(tx))
      .with_server_flags(ServerFlags {
        beforeunload_cpu_pct: Some(90),
        beforeunload_memory_pct: Some(90),
        ..Default::default()
      })
      .build()
      .await;

    let resp = tb
      .request(|b| {
        b.uri("/meow")
          .header("x-cpu-time-soft-limit-ms", HeaderValue::from_static("1000"))
          .header("x-cpu-time-hard-limit-ms", HeaderValue::from_static("2000"))
          .header("x-memory-limit-mb", "30")
          .header("x-service-path", format!("issue-func-280/{}", func_name))
          .body(Body::empty())
          .context("can't make request")
      })
      .await
      .unwrap();

    assert_eq!(resp.status().as_u16(), StatusCode::OK);

    while let Some(ev) = rx.recv().await {
      match ev.event {
        WorkerEvents::Log(ev) => {
          tracing::info!("{}", ev.msg);
          continue;
        }
        WorkerEvents::Shutdown(ev) => {
          tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;
          assert_eq!(ev.reason, reason);
          return;
        }
        _ => continue,
      }
    }

    unreachable!("test failed");
  }

  run("cpu", ShutdownReason::CPUTime).await;
  run("mem", ShutdownReason::Memory).await;
}

#[tokio::test]
#[serial]
async fn test_issue_func_284() {
  async fn find_boot_event(
    rx: &mut mpsc::UnboundedReceiver<WorkerEventWithMetadata>,
  ) -> Option<usize> {
    while let Some(ev) = rx.recv().await {
      match ev.event {
        WorkerEvents::Boot(ev) => return Some(ev.boot_time),
        _ => continue,
      }
    }

    None
  }

  let (tx, mut rx) = mpsc::unbounded_channel();
  let tb = TestBedBuilder::new("./test_cases/main")
    .with_per_worker_policy(None)
    .with_worker_event_sender(Some(tx))
    .build()
    .await;

  tokio::spawn({
    let tb = tb.clone();
    async move {
      tb.request(|b| {
        b.uri("/meow")
          .header("x-service-path", "issue-func-284/noisy")
          .body(Body::empty())
          .context("can't make request")
      })
      .await
      .unwrap();
    }
  });

  timeout(Duration::from_secs(1), find_boot_event(&mut rx))
    .await
    .unwrap()
    .unwrap();

  tokio::spawn({
    let tb = tb.clone();
    async move {
      tb.request(|b| {
        b.uri("/meow")
          .header("x-service-path", "issue-func-284/baseline")
          .body(Body::empty())
          .context("can't make request")
      })
      .await
      .unwrap();
    }
  });

  let boot_time = timeout(Duration::from_secs(1), find_boot_event(&mut rx))
    .await
    .unwrap()
    .unwrap();

  assert!(boot_time < 1000);
}

#[tokio::test]
#[serial]
async fn test_should_render_detailed_failed_to_create_graph_error() {
  {
    integration_test!(
      "./test_cases/main",
      NON_SECURE_PORT,
      "graph-error-1",
      None,
      None,
      None,
      (|resp| async {
        let (payload, status) =
          ErrorResponsePayload::assert_error_response(resp).await;

        assert_eq!(status, 500);
        assert!(payload.msg.starts_with(
          "InvalidWorkerCreation: worker boot error: \
          failed to bootstrap runtime: failed to create the graph: \
          Relative import path \"oak\" not prefixed with"
        ));
      }),
      TerminationToken::new()
    );
  }

  {
    integration_test!(
      "./test_cases/main",
      NON_SECURE_PORT,
      "graph-error-2",
      None,
      None,
      None,
      (|resp| async {
        let (payload, status) =
          ErrorResponsePayload::assert_error_response(resp).await;

        assert_eq!(status, 500);
        assert!(payload.msg.starts_with(
          "InvalidWorkerCreation: worker boot error: \
          failed to bootstrap runtime: failed to create the graph: \
          Module not found \"file://"
        ));
      }),
      TerminationToken::new()
    );
  }
}

#[tokio::test]
#[serial]
async fn test_js_entrypoint() {
  {
    integration_test!(
      "./test_cases/main",
      NON_SECURE_PORT,
      "serve-js",
      None,
      None,
      None,
      (|resp| async {
        let resp = resp.unwrap();
        assert_eq!(resp.status().as_u16(), 200);
        let msg = resp.text().await.unwrap();
        assert_eq!(msg, "meow");
      }),
      TerminationToken::new()
    );
  }

  {
    integration_test!(
      "./test_cases/main",
      NON_SECURE_PORT,
      "serve-declarative-style-js",
      None,
      None,
      None,
      (|resp| async {
        let resp = resp.unwrap();
        assert_eq!(resp.status().as_u16(), 200);
        let msg = resp.text().await.unwrap();
        assert_eq!(msg, "meow");
      }),
      TerminationToken::new()
    );
  }
}

#[tokio::test]
#[serial]
async fn test_should_be_able_to_bundle_against_various_exts() {
  let get_eszip_buf = |path: &str| {
    let path = path.to_string();
    let mut emitter_factory = EmitterFactory::new();

    emitter_factory.set_permissions_options(Some(get_default_permissions(
      WorkerKind::UserWorker,
    )));
    emitter_factory.set_deno_options(
      DenoOptionsBuilder::new()
        .entrypoint(PathBuf::from(path))
        .build()
        .unwrap(),
    );

    async {
      let mut metadata = Metadata::default();
      let eszip = generate_binary_eszip(
        &mut metadata,
        Arc::new(emitter_factory),
        None,
        None,
        None,
      )
      .await
      .unwrap();

      eszip.into_bytes()
    }
  };

  {
    let buf =
      get_eszip_buf("./test_cases/eszip-various-ext/npm-supabase/index.js")
        .await;

    let client = Client::new();
    let req = client
      .request(
        Method::POST,
        format!("http://localhost:{}/meow", NON_SECURE_PORT),
      )
      .body(buf);

    integration_test!(
      "./test_cases/main_eszip",
      NON_SECURE_PORT,
      "",
      None,
      Some(req),
      None,
      (|resp| async {
        let resp = resp.unwrap();
        assert_eq!(resp.status().as_u16(), 200);
        let msg = resp.text().await.unwrap();
        assert_eq!(msg, "function");
      }),
      TerminationToken::new()
    );
  }

  let test_serve_simple_fn = |ext: &'static str, expected: &'static [u8]| {
    let ext = ext.to_string();
    let expected = expected.to_vec();

    async move {
      let buf = get_eszip_buf(&format!(
        "./test_cases/eszip-various-ext/serve/index.{}",
        ext
      ))
      .await;

      let client = Client::new();
      let req = client
        .request(
          Method::POST,
          format!("http://localhost:{}/meow", NON_SECURE_PORT),
        )
        .body(buf);

      integration_test!(
        "./test_cases/main_eszip",
        NON_SECURE_PORT,
        "",
        None,
        Some(req),
        None,
        (|resp| async move {
          let resp = resp.unwrap();
          assert_eq!(resp.status().as_u16(), 200);
          let msg = resp.bytes().await.unwrap();
          assert_eq!(msg, expected);
        }),
        TerminationToken::new()
      );
    }
  };

  test_serve_simple_fn("ts", b"meow").await;
  test_serve_simple_fn("js", b"meow").await;
  test_serve_simple_fn("mjs", b"meow").await;

  static REACT_RESULT: &str = r#"{"type":"div","props":{"children":"meow"},"__k":null,"__":null,"__b":0,"__e":null,"__c":null,"__v":-1,"__i":-1,"__u":0}"#;

  test_serve_simple_fn("jsx", REACT_RESULT.as_bytes()).await;
  test_serve_simple_fn("tsx", REACT_RESULT.as_bytes()).await;
}

#[tokio::test]
#[serial]
async fn test_private_npm_package_import() {
  // Required because test_cases/main_with_registry/registry/registry-handler.ts:58
  std::env::set_var("EDGE_RUNTIME_PORT", NON_SECURE_PORT.to_string());
  let _guard = scopeguard::guard((), |_| {
    std::env::remove_var("EDGE_RUNTIME_PORT");
  });

  let client = Client::new();
  let run_server_fn = |main: &'static str, token| async move {
    let (tx, mut rx) = mpsc::channel(1);
    let handle = tokio::task::spawn({
      async move {
        let mut builder = Builder::new(
          SocketAddr::from_str(&format!("127.0.0.1:{NON_SECURE_PORT}"))
            .unwrap(),
          main,
        );

        builder.event_callback(tx).termination_token(token);
        builder.build().await.unwrap().listen().await.unwrap()
      }
    });

    let _ev = loop {
      match rx.recv().await {
        Some(health) => break health.into_listening().unwrap(),
        _ => continue,
      }
    };

    handle
  };

  {
    let token = TerminationToken::new();
    let handle =
      run_server_fn("./test_cases/main_with_registry", token.clone()).await;

    let resp = client
      .request(
        Method::GET,
        format!(
          "http://localhost:{}/private-npm-package-import",
          NON_SECURE_PORT
        ),
      )
      .send()
      .await
      .unwrap();

    assert_eq!(resp.status().as_u16(), 200);

    let body = resp.json::<serde_json::Value>().await.unwrap();
    let body = body.as_object().unwrap();

    assert_eq!(body.len(), 2);
    assert_eq!(body.get("meow"), Some(&json!("function")));
    assert_eq!(body.get("odd"), Some(&json!(true)));

    token.cancel();
    handle.await.unwrap();
  }

  {
    let token = TerminationToken::new();
    let handle =
      run_server_fn("./test_cases/main_with_registry", token.clone()).await;

    let resp = client
      .request(
        Method::GET,
        format!("http://localhost:{}/meow", NON_SECURE_PORT),
      )
      .header("x-service-path", "private-npm-package-import-2/inner")
      .send()
      .await
      .unwrap();

    assert_eq!(resp.status().as_u16(), 200);

    let body = resp.json::<serde_json::Value>().await.unwrap();
    let body = body.as_object().unwrap();

    assert_eq!(body.len(), 2);
    assert_eq!(body.get("meow"), Some(&json!("function")));
    assert_eq!(body.get("odd"), Some(&json!(true)));

    token.cancel();
    handle.await.unwrap();
  }

  {
    let token = TerminationToken::new();
    let handle = run_server_fn("./test_cases/main_eszip", token.clone()).await;

    let buf = {
      let mut emitter_factory = EmitterFactory::new();

      emitter_factory.set_deno_options(
        DenoOptionsBuilder::new()
          .entrypoint(PathBuf::from(
            "./test_cases/private-npm-package-import/index.js",
          ))
          .build()
          .unwrap(),
      );

      let mut metadata = Metadata::default();
      let eszip = generate_binary_eszip(
        &mut metadata,
        Arc::new(emitter_factory),
        None,
        None,
        None,
      )
      .await
      .unwrap();

      eszip.into_bytes()
    };

    let resp = client
      .request(
        Method::POST,
        format!("http://localhost:{}/meow", NON_SECURE_PORT),
      )
      .body(buf)
      .send()
      .await
      .unwrap();

    assert_eq!(resp.status().as_u16(), 200);

    let body = resp.json::<serde_json::Value>().await.unwrap();
    let body = body.as_object().unwrap();

    assert_eq!(body.len(), 2);
    assert_eq!(body.get("meow"), Some(&json!("function")));
    assert_eq!(body.get("odd"), Some(&json!(true)));

    token.cancel();
    handle.await.unwrap();
  }
}

#[tokio::test]
#[serial]
async fn test_tmp_fs_usage() {
  {
    integration_test!(
      "./test_cases/main",
      NON_SECURE_PORT,
      "use-tmp-fs",
      None,
      None,
      None,
      (|resp| async {
        let resp = resp.unwrap();

        assert_eq!(resp.status().as_u16(), 200);

        let body = resp.json::<serde_json::Value>().await.unwrap();
        let body = body.as_object().unwrap();

        assert_eq!(body.len(), 4);
        assert_eq!(body.get("written"), Some(&json!(8)));
        assert_eq!(body.get("content"), Some(&json!("meowmeow")));
        assert_eq!(body.get("deleted"), Some(&json!(true)));

        let steps = body.get("steps").unwrap().as_array().unwrap();

        assert_eq!(&steps[0], &json!(true));
        assert_eq!(&steps[1], &json!(false));
      }),
      TerminationToken::new()
    );
  }

  {
    integration_test!(
      "./test_cases/main",
      NON_SECURE_PORT,
      "use-tmp-fs-2",
      None,
      None,
      None,
      (|resp| async {
        let resp = resp.unwrap();

        assert_eq!(resp.status().as_u16(), 200);

        let body = resp.json::<serde_json::Value>().await.unwrap();
        let body = body.as_object().unwrap();

        assert_eq!(body.len(), 2);
        assert_eq!(body.get("hadExisted"), Some(&json!(true)));

        let path = body.get("path").unwrap().as_str().unwrap();
        let f = fs::read(path).await.unwrap();
        let mut cursor = Cursor::new(&f);

        let client = Client::new();
        let resp2 = client
          .request(Method::GET, "https://httpbin.org/stream/20".to_string())
          .send()
          .await
          .unwrap();

        assert_eq!(resp2.status().as_u16(), 200);

        let body2 = resp2.bytes().await.unwrap();
        let mut cursor2 = Cursor::new(&*body2);
        let mut count = 0;

        loop {
          use serde_json::*;

          let mut buf = String::new();

          cursor.read_line(&mut buf).unwrap();
          let mut msg = from_str::<Map<String, Value>>(&buf).unwrap();

          buf.clear();
          cursor2.read_line(&mut buf).unwrap();
          let mut msg2 = from_str::<Map<String, Value>>(&buf).unwrap();

          assert!(msg.remove("headers").is_some());
          assert!(msg2.remove("headers").is_some());
          assert_eq!(msg, msg2);

          count += 1;
          if count >= 20 {
            break;
          }
        }
      }),
      TerminationToken::new()
    );
  }

  {
    integration_test!(
      "./test_cases/main",
      NON_SECURE_PORT,
      "use-tmp-fs-3",
      None,
      None,
      None,
      (|resp| async {
        let resp = resp.unwrap();
        assert_eq!(resp.status().as_u16(), 200);
      }),
      TerminationToken::new()
    );
  }
}

#[tokio::test]
#[serial]
async fn test_tmp_fs_should_not_be_available_in_import_stmt() {
  // The s3 fs and tmp fs are not currently attached to the module loader, so the import statement
  // should not recognize their prefixes. (But, depending on the case, they may be attached in the
  // future)
  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "use-tmp-fs-in-import-stmt",
    None,
    None,
    None,
    (|resp| async {
      let (payload, status) =
        ErrorResponsePayload::assert_error_response(resp).await;

      assert_eq!(status, 500);
      dbg!(&payload.msg);
      assert!(payload.msg.starts_with(
        "InvalidWorkerResponse: event loop error while evaluating the module: \
        TypeError: Module not found: file:///tmp/meowmeow.ts"
      ));
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_commonjs() {
  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "commonjs",
    None,
    None,
    None,
    (|resp| async {
      let resp = resp.unwrap();
      assert_eq!(resp.status().as_u16(), 200);
      assert_eq!(resp.text().await.unwrap().as_str(), "meow");
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_commonjs_require_esm() {
  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "commonjs-require-esm",
    None,
    None,
    None,
    (|resp| async {
      let resp = resp.unwrap();
      assert_eq!(resp.status().as_u16(), 200);
      assert_eq!(resp.text().await.unwrap().as_str(), "cjs require esm ok");
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_commonjs_no_type_field_in_package_json() {
  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "commonjs-no-type-field",
    None,
    None,
    None,
    (|resp| async {
      let resp = resp.unwrap();
      assert_eq!(resp.status().as_u16(), 500);
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_commonjs_custom_main() {
  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "commonjs-custom-main",
    None,
    None,
    None,
    (|resp| async {
      let resp = resp.unwrap();
      assert_eq!(resp.status().as_u16(), 200);
      assert_eq!(resp.text().await.unwrap().as_str(), "meow");
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_commonjs_express() {
  ensure_npm_package_installed("./test_cases/commonjs-express").await;
  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "commonjs-express",
    None,
    None,
    None,
    (|resp| async {
      let resp = resp.unwrap();
      assert_eq!(resp.status().as_u16(), 200);
      assert_eq!(resp.text().await.unwrap().as_str(), "meow");
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_commonjs_hono() {
  ensure_npm_package_installed("./test_cases/commonjs-hono").await;
  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "commonjs-hono",
    None,
    None,
    None,
    (|resp| async {
      let resp = resp.unwrap();
      assert_eq!(resp.status().as_u16(), 200);
      assert_eq!(resp.text().await.unwrap().as_str(), "meow");
    }),
    TerminationToken::new()
  );
}

async fn test_commonjs_websocket(prefix: String) {
  ensure_npm_package_installed(format!(
    "./test_cases/commonjs-{}-websocket",
    prefix
  ))
  .await;
  let nonce = tungstenite::handshake::client::generate_key();
  let client = Client::new();
  let req = client
    .request(
      Method::GET,
      format!(
        "http://localhost:{}/commonjs-{}-websocket",
        NON_SECURE_PORT, prefix
      ),
    )
    .header(header::CONNECTION, "upgrade")
    .header(header::UPGRADE, "websocket")
    .header(header::SEC_WEBSOCKET_KEY, &nonce)
    .header(header::SEC_WEBSOCKET_VERSION, "13")
    .build()
    .unwrap();

  let original = RequestBuilder::from_parts(client, req);
  let request_builder = Some(original);

  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "",
    None,
    request_builder,
    None,
    (|resp| async {
      let res = resp.unwrap();
      let accepted = get_upgrade_type(res.headers());

      assert!(res.status().as_u16() == 101);
      assert!(accepted.is_some());
      assert_eq!(accepted.as_ref().unwrap(), "websocket");

      let upgraded = res.upgrade().await.unwrap();
      let mut ws = WebSocketStream::from_raw_socket(
        upgraded.compat(),
        tungstenite::protocol::Role::Client,
        None,
      )
      .await;

      assert_eq!(
        ws.next().await.unwrap().unwrap().into_text().unwrap(),
        "meow"
      );

      ws.send(Message::Text("meow!!".into())).await.unwrap();
      assert_eq!(
        ws.next().await.unwrap().unwrap().into_text().unwrap(),
        "meow!!"
      );
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_commonjs_ws_websocket() {
  test_commonjs_websocket(String::from("ws")).await;
}

#[tokio::test]
#[serial]
async fn test_commonjs_hono_websocket() {
  test_commonjs_websocket(String::from("hono")).await;
}

#[tokio::test]
#[serial]
async fn test_commonjs_express_websocket() {
  test_commonjs_websocket(String::from("express")).await;
}

#[tokio::test]
#[serial]
async fn test_commonjs_workspace() {
  ensure_npm_package_installed("./test_cases/commonjs-workspace").await;
  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "commonjs-workspace",
    None,
    None,
    None,
    (|resp| async {
      let resp = resp.unwrap();
      assert_eq!(resp.status().as_u16(), 200);

      let body = resp.json::<serde_json::Value>().await.unwrap();
      let body = body.as_object().unwrap();

      assert_eq!(body.len(), 2);
      assert_eq!(body.get("cat"), Some(&json!("meow")));
      assert_eq!(body.get("dog"), Some(&json!("bark")));
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_byonm_typescript() {
  ensure_npm_package_installed("./test_cases/byonm-typescript").await;
  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "byonm-typescript",
    None,
    None,
    None,
    (|resp| async {
      let resp = resp.unwrap();
      assert_eq!(resp.status().as_u16(), 200);
      assert_eq!(resp.text().await.unwrap().as_str(), "meow");
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_deno_workspace() {
  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "workspace",
    None,
    None,
    None,
    (|resp| async {
      let resp = resp.unwrap();
      assert_eq!(resp.status().as_u16(), 200);

      let body = resp.json::<serde_json::Value>().await.unwrap();
      let body = body.as_object().unwrap();

      assert_eq!(body.len(), 3);
      assert_eq!(body.get("cat"), Some(&json!("meow")));
      assert_eq!(body.get("dog"), Some(&json!("bark")));
      assert_eq!(body.get("sheep"), Some(&json!("howl")));
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_supabase_ai_gte() {
  let tb = TestBedBuilder::new("./test_cases/main")
    .with_per_worker_policy(None)
    .build()
    .await;

  let resp = tb
    .request(|b| {
      b.uri("/supabase-ai")
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  assert_eq!(resp.status().as_u16(), StatusCode::OK);
}

// -- ext_ai: ORT base api
#[tokio::test]
#[serial]
async fn test_ort_string_tensor() {
  let base_path = "./test_cases/ai-ort-rust-backend";
  let main_path = format!("{}/main", base_path);

  let tb = TestBedBuilder::new(main_path)
    .with_per_worker_policy(None)
    .build()
    .await;

  let resp = tb
    .request(|b| {
      b.uri("/string-tensor")
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  assert_eq!(resp.status().as_u16(), StatusCode::OK);
}

// -- ext_ai: ORT @huggingface/transformers
async fn test_ort_transformers_js(script_path: &str) {
  fn visit_json(value: &mut serde_json::Value) {
    use serde_json::Number;
    use serde_json::Value::*;

    match value {
      Array(vec) => {
        for v in vec {
          visit_json(v);
        }
      }
      Object(map) => {
        for (_, v) in map {
          visit_json(v);
        }
      }
      Number(number) => {
        if let Some(f) = number.as_f64() {
          *number =
            Number::from_f64((f * 1_000_000.0).round() / 1_000_000.0).unwrap();
        }
      }

      _ => {}
    }
  }

  use std::env::consts;

  let base_path = "./test_cases/ai-ort-rust-backend";
  let main_path = format!("{}/main", base_path);
  let script_path = format!("transformers-js/{}", script_path);
  let snapshot_path = PathBuf::from(base_path)
    .join(script_path.as_str())
    .join(format!("__snapshot__/{}_{}.json", consts::OS, consts::ARCH));

  let client = Client::new();
  let body = {
    if snapshot_path.exists() {
      tokio::fs::read(&snapshot_path).await.unwrap()
    } else {
      b"null".to_vec()
    }
  };

  let content_length = body.len();
  let req = client
    .request(
      Method::POST,
      format!(
        "http://localhost:{}/{}",
        NON_SECURE_PORT,
        script_path.as_str(),
      ),
    )
    .body(body)
    .header("Content-Type", "application/json")
    .header("Content-Length", content_length.to_string());

  integration_test!(
    main_path,
    NON_SECURE_PORT,
    "",
    None,
    Some(req),
    None,
    (|resp| async {
      let res = resp.unwrap();
      let status_code = res.status();

      assert!(matches!(status_code, StatusCode::OK | StatusCode::CREATED));

      if status_code == StatusCode::OK {
        return;
      }

      assert_eq!(std::env::var("CI").ok(), None);
      assert!(!snapshot_path.exists());

      tokio::fs::create_dir_all(snapshot_path.parent().unwrap())
        .await
        .unwrap();

      let mut body = res.json::<serde_json::Value>().await.unwrap();
      let mut file = fs::File::create(&snapshot_path).await.unwrap();

      visit_json(&mut body);

      let content = serde_json::to_vec(&body).unwrap();

      file.write_all(&content).await.unwrap();
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_ort_nlp_feature_extraction() {
  test_ort_transformers_js("feature-extraction").await;
}

async fn test_runtime_beforeunload_event(kind: &'static str, pct: u8) {
  let (tx, mut rx) = mpsc::unbounded_channel();
  let tb = TestBedBuilder::new("./test_cases/runtime-event")
    .with_per_worker_policy(None)
    .with_worker_event_sender(Some(tx))
    .with_server_flags(ServerFlags {
      beforeunload_wall_clock_pct: Some(pct),
      beforeunload_cpu_pct: Some(pct),
      beforeunload_memory_pct: Some(pct),
      ..Default::default()
    })
    .build()
    .await;

  let resp = tb
    .request(|b| {
      b.uri(format!("/{}", kind))
        .method("GET")
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  assert_ne!(resp.status().as_u16(), StatusCode::OK);

  tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;

  while let Some(ev) = rx.recv().await {
    let WorkerEvents::Log(ev) = ev.event else {
      continue;
    };
    if ev.level != LogLevel::Info {
      continue;
    }
    if ev
      .msg
      .contains(&format!("triggered {}", kind.replace('-', "_")))
    {
      return;
    }
  }

  unreachable!("test failed");
}

#[tokio::test]
#[serial]
async fn test_runtime_event_beforeunload_cpu() {
  test_runtime_beforeunload_event("cpu", 50).await;
}

#[tokio::test]
#[serial]
async fn test_runtime_event_beforeunload_wall_clock() {
  test_runtime_beforeunload_event("wall-clock", 50).await;
}

#[tokio::test]
#[serial]
async fn test_runtime_event_beforeunload_mem() {
  test_runtime_beforeunload_event("mem", 50).await;
}

// NOTE(Nyannyacha): We cannot enable this test unless we clarify the trigger point of the unload
// event.
//
// #[tokio::test]
// #[serial]
// async fn test_runtime_event_unload() {
//     let (tx, mut rx) = mpsc::unbounded_channel();
//     let tb = TestBedBuilder::new("./test_cases/runtime-event")
//         .with_per_worker_policy(None)
//         .with_worker_event_sender(Some(tx))
//         .build()
//         .await;
//
//     let resp = tb
//         .request(|b| {
//             b.uri("/unload")
//                 .method("GET")
//                 .body(Body::empty())
//                 .context("can't make request")
//         })
//         .await
//         .unwrap();
//
//     assert_eq!(resp.status().as_u16(), StatusCode::OK);
//
//     sleep(Duration::from_secs(8)).await;
//     tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;
//
//     while let Some(ev) = rx.recv().await {
//         let WorkerEvents::Log(ev) = ev.event else {
//             continue;
//         };
//         if ev.level != LogLevel::Info {
//             continue;
//         }
//         if ev.msg.contains("triggered unload") {
//             break;
//         }
//     }
//
//     unreachable!("test failed");
// }

#[tokio::test]
#[serial]
async fn test_should_wait_for_background_tests() {
  let (tx, mut rx) = mpsc::unbounded_channel();
  let tb = TestBedBuilder::new("./test_cases/main")
    // only the `per_worker` policy allows waiting for background tasks.
    .with_per_worker_policy(None)
    .with_worker_event_sender(Some(tx))
    .build()
    .await;

  let resp = tb
    .request(|b| {
      b.uri("/mark-background-task")
        .header("x-cpu-time-soft-limit-ms", HeaderValue::from_static("100"))
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  assert_eq!(resp.status().as_u16(), StatusCode::OK);

  tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;

  while let Some(ev) = rx.recv().await {
    let WorkerEvents::Log(ev) = ev.event else {
      continue;
    };
    if ev.level != LogLevel::Info {
      continue;
    }
    if ev.msg.contains("meow") {
      return;
    }
  }

  unreachable!("test failed");
}

#[tokio::test]
#[serial]
async fn test_should_not_wait_for_background_tests() {
  let (tx, mut rx) = mpsc::unbounded_channel();
  let tb = TestBedBuilder::new("./test_cases/main")
    // only the `per_worker` policy allows waiting for background tasks.
    .with_per_worker_policy(None)
    .with_worker_event_sender(Some(tx))
    .build()
    .await;

  let resp = tb
    .request(|b| {
      b.uri("/mark-background-task-2")
        .header("x-cpu-time-soft-limit-ms", HeaderValue::from_static("100"))
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  assert_eq!(resp.status().as_u16(), StatusCode::OK);

  tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;

  while let Some(ev) = rx.recv().await {
    let WorkerEvents::Log(ev) = ev.event else {
      continue;
    };
    if ev.level != LogLevel::Info {
      continue;
    }
    if ev.msg.contains("meow") {
      unreachable!("test failed");
    }
  }
}

#[tokio::test]
#[serial]
async fn test_should_be_able_to_trigger_early_drop_with_wall_clock() {
  let (tx, mut rx) = mpsc::unbounded_channel();
  let tb = TestBedBuilder::new("./test_cases/main")
    .with_per_worker_policy(None)
    .with_worker_event_sender(Some(tx))
    .build()
    .await;

  let resp = tb
    .request(|b| {
      b.uri("/early-drop-wall-clock")
        .header("x-worker-timeout-ms", HeaderValue::from_static("3000"))
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  assert_eq!(resp.status().as_u16(), StatusCode::OK);

  sleep(Duration::from_secs(2)).await;
  rx.close();
  tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;

  while let Some(ev) = rx.recv().await {
    let WorkerEvents::Log(ev) = ev.event else {
      continue;
    };
    if ev.level != LogLevel::Info {
      continue;
    }
    if ev.msg.contains("early_drop") {
      return;
    }
  }

  unreachable!("test failed");
}

#[tokio::test]
#[serial]
async fn test_should_be_able_to_trigger_early_drop_with_mem() {
  let (tx, mut rx) = mpsc::unbounded_channel();
  let tb = TestBedBuilder::new("./test_cases/main")
    .with_per_worker_policy(None)
    .with_worker_event_sender(Some(tx))
    .build()
    .await;

  let resp = tb
    .request(|b| {
      b.uri("/early-drop-mem")
        .header("x-memory-limit-mb", HeaderValue::from_static("30"))
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  assert_eq!(resp.status().as_u16(), StatusCode::OK);

  sleep(Duration::from_secs(2)).await;
  rx.close();
  tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;

  while let Some(ev) = rx.recv().await {
    let WorkerEvents::Log(ev) = ev.event else {
      continue;
    };
    if ev.level != LogLevel::Info {
      continue;
    }
    if ev.msg.contains("early_drop") {
      return;
    }
  }

  unreachable!("test failed");
}

#[tokio::test]
#[serial]
async fn test_eszip_wasm_import() {
  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "eszip-wasm",
    None,
    None,
    None,
    (|resp| async {
      let resp = resp.unwrap();
      assert_eq!(resp.status().as_u16(), 200);
      assert_eq!(resp.text().await.unwrap().as_str(), "meow");
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_request_absent_timeout() {
  let (tx, mut rx) = mpsc::unbounded_channel();
  let tb = TestBedBuilder::new("./test_cases/main")
    .with_per_worker_policy(None)
    .with_worker_event_sender(Some(tx))
    .build()
    .await;

  let resp = tb
    .request(|b| {
      b.uri("/sleep-5000ms")
        .header("x-worker-timeout-ms", HeaderValue::from_static("3600000"))
        .header(
          "x-context-supervisor-request-absent-timeout-ms",
          HeaderValue::from_static("1000"),
        )
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  assert_eq!(resp.status().as_u16(), StatusCode::OK);

  sleep(Duration::from_secs(3)).await;
  rx.close();
  tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;

  while let Some(ev) = rx.recv().await {
    let WorkerEvents::Shutdown(ev) = ev.event else {
      continue;
    };
    if ev.reason != ShutdownReason::EarlyDrop {
      break;
    }
    return;
  }

  unreachable!("test failed");
}

#[tokio::test]
#[serial]
async fn test_user_workers_cleanup_idle_workers() {
  let (tx, mut rx) = mpsc::unbounded_channel();
  let tb = TestBedBuilder::new("./test_cases/main")
    .with_per_worker_policy(None)
    .with_worker_event_sender(Some(tx))
    .build()
    .await;

  let resp = tb
    .request(|b| {
      b.uri("/sleep-5000ms")
        .header("x-worker-timeout-ms", HeaderValue::from_static("3600000"))
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  assert_eq!(resp.status().as_u16(), StatusCode::OK);

  let mut resp = tb
    .request(|b| {
      b.uri("/_internal/cleanup-idle-workers")
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  assert_eq!(resp.status().as_u16(), StatusCode::OK);

  let bytes = hyper_v014::body::HttpBody::collect(resp.body_mut())
    .await
    .unwrap()
    .to_bytes();

  let payload = serde_json::from_slice::<serde_json::Value>(&bytes).unwrap();
  let count = payload.get("count").unwrap().as_u64().unwrap();

  assert_eq!(count, 1);

  sleep(Duration::from_secs(3)).await;

  rx.close();
  tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;
  while let Some(ev) = rx.recv().await {
    let WorkerEvents::Shutdown(ev) = ev.event else {
      continue;
    };
    if ev.reason != ShutdownReason::EarlyDrop {
      break;
    }
    return;
  }

  unreachable!("test failed");
}

#[tokio::test]
#[serial]
async fn test_no_npm() {
  async fn send_it(
    no_npm: bool,
    tx: mpsc::UnboundedSender<WorkerEventWithMetadata>,
  ) -> (TestBed, u16) {
    let tb = TestBedBuilder::new("./test_cases/main")
      .with_per_worker_policy(None)
      .with_worker_event_sender(Some(tx))
      .build()
      .await;

    let resp = tb
      .request(|mut b| {
        b = b.uri("/npm-import-with-package-json");
        if no_npm {
          b = b.header("x-no-npm", HeaderValue::from_static("1"))
        }
        b.body(Body::empty()).context("can't make request")
      })
      .await
      .unwrap();

    (tb, resp.status().as_u16())
  }

  {
    // Since `noNpm` is configured, it will not discover package.json, and
    // `npm:is-even` will resolve normally using Deno's original module
    // resolution method.
    let (tx, mut rx) = mpsc::unbounded_channel();
    let (tb, status_code) = send_it(true, tx).await;

    assert_eq!(status_code, StatusCode::OK);

    rx.close();
    tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;
  }
  {
    // Note that `noNpm` is not set this time. In this case, it will try to
    // discover package.json and will eventually find it.
    //
    // This causes it to switch to Byonm mode and try to resolve modules from
    // the adjacent node_modules/.
    //
    // However, since node_modules/ does not exist anywhere, the attempt to
    // resolve `npm:is-even` will fail.
    let (tx, mut rx) = mpsc::unbounded_channel();
    let (tb, status_code) = send_it(false, tx).await;

    assert_eq!(status_code, StatusCode::INTERNAL_SERVER_ERROR);

    rx.close();
    tb.exit(Duration::from_secs(TESTBED_DEADLINE_SEC)).await;

    while let Some(ev) = rx.recv().await {
      let WorkerEvents::BootFailure(ev) = ev.event else {
        continue;
      };

      assert!(ev.msg.starts_with(
        "worker boot error: failed to bootstrap runtime: failed to create the \
graph: Could not find a matching package for 'npm:is-even' in the node_modules \
directory."
      ));

      return;
    }

    unreachable!("test failed");
  }
}

#[tokio::test]
#[serial]
async fn test_user_worker_with_import_map() {
  let assert_fn = |resp: Result<Response, reqwest::Error>| async {
    let res = resp.unwrap();
    let status = res.status().as_u16();

    let body_bytes = res.bytes().await.unwrap();
    let body_str = String::from_utf8_lossy(&body_bytes);

    assert_eq!(
      status, 200,
      "Expected 200, got {} with body: {}",
      status, body_str
    );

    assert!(
      body_str.contains("import map works!"),
      "Expected import map works!, got: {}",
      body_str
    );
  };
  {
    integration_test!(
      "./test_cases/user-worker-with-import-map",
      NON_SECURE_PORT,
      "import_map",
      None,
      None,
      None,
      (assert_fn),
      TerminationToken::new()
    );
  }
  {
    integration_test!(
      "./test_cases/user-worker-with-import-map",
      NON_SECURE_PORT,
      "inline_import_map",
      None,
      None,
      None,
      (assert_fn),
      TerminationToken::new()
    );
  }
}

#[tokio::test]
#[serial]
async fn test_pin_package_version_correctly() {
  integration_test!(
    "./test_cases/pin-package",
    NON_SECURE_PORT,
    "",
    None,
    None,
    None,
    (|resp| async {
      let res = resp.unwrap();
      assert!(res.status().as_u16() == 200);

      let body_bytes = res.bytes().await.unwrap();
      assert_eq!(body_bytes, r#"3.0.0"#);
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_drop_socket_when_http_handler_returns_an_invalid_value() {
  {
    integration_test!(
      "./test_cases/main",
      NON_SECURE_PORT,
      "return-invalid-resp",
      None,
      None,
      None,
      (|resp| async {
        let res = resp.unwrap();
        assert!(res.status().as_u16() == 502);
      }),
      TerminationToken::new()
    );
  }
  {
    integration_test!(
      "./test_cases/main",
      NON_SECURE_PORT,
      "return-invalid-resp-2",
      None,
      None,
      None,
      (|resp| async {
        let res = resp.unwrap();
        assert!(res.status().as_u16() == 502);
      }),
      TerminationToken::new()
    );
  }
}

#[tokio::test]
#[serial]
async fn test_brotli_async() {
  integration_test!(
    "./test_cases/main",
    NON_SECURE_PORT,
    "brotli-async",
    None,
    None,
    None,
    (|resp| async {
      let resp = resp.unwrap();
      assert_eq!(resp.status().as_u16(), 200);
      assert_eq!(resp.text().await.unwrap().as_str(), "meow");
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_pool_key_async() {
  let tb = TestBedBuilder::new("./test_cases/pool-key/main")
    .with_per_worker_policy(None)
    .build()
    .await;

  let resp = tb
    .request(|b| {
      b.uri("/hello-200")
        .header("x-pool-key", "key200")
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  assert_eq!(resp.status().as_u16(), StatusCode::OK);

  // The same key will not spawn a new Worker, even when 'service_path' changed
  let resp = tb
    .request(|b| {
      b.uri("/hello-201")
        .header("x-pool-key", "key200")
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  assert_eq!(resp.status().as_u16(), StatusCode::OK);

  // Using different key doesn't reuse the same Worker
  let resp = tb
    .request(|b| {
      b.uri("/hello-201")
        .header("x-pool-key", "key201")
        .body(Body::empty())
        .context("can't make request")
    })
    .await
    .unwrap();

  assert_eq!(resp.status().as_u16(), StatusCode::CREATED);
}

async fn assert_rate_limit_error(
  resp: Result<reqwest::Response, reqwest::Error>,
) {
  let res = resp.unwrap();
  assert_eq!(
    res.status().as_u16(),
    StatusCode::INTERNAL_SERVER_ERROR,
    "expected the chain to be rate-limited"
  );
  let body = res.text().await.unwrap();
  assert!(
    body.contains("RateLimitError"),
    "expected RateLimitError in body, got: {body}"
  );
}

/// Verifies that the local (traced) budget cuts off A→B→A circular chains.
async fn test_outbound_rate_limit_circular(http_mode: &'static str) {
  const TRACEPARENT: &str =
    "00-12345678901234567890123456789012-1234567890123456-01";

  init_otel();

  integration_test_with_server_flag!(
    ServerFlags {
      rate_limit_cleanup_interval_sec: 60,
      request_wait_timeout_ms: Some(30_000),
      ..Default::default()
    },
    "./test_cases/rate-limit-main",
    NON_SECURE_PORT,
    "rate-limit-a",
    None,
    Some(
      reqwest::Client::new()
        .get(format!("http://localhost:{}/rate-limit-a", NON_SECURE_PORT))
        .header("traceparent", TRACEPARENT)
        .header("x-http-mode", http_mode)
        .header(
          "x-test-server-url",
          format!("http://localhost:{}", NON_SECURE_PORT),
        )
    ),
    None::<Tls>,
    (|resp| async { assert_rate_limit_error(resp).await }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_outbound_rate_limit_circular_fetch() {
  test_outbound_rate_limit_circular("fetch").await;
}

#[tokio::test]
#[serial]
async fn test_outbound_rate_limit_circular_node_http() {
  test_outbound_rate_limit_circular("node").await;
}

/// Verifies that the global (untraced) budget cuts off a self-calling worker.
async fn test_outbound_rate_limit_global(http_mode: &'static str) {
  init_otel();

  integration_test_with_server_flag!(
    ServerFlags {
      rate_limit_cleanup_interval_sec: 60,
      request_wait_timeout_ms: Some(30_000),
      ..Default::default()
    },
    "./test_cases/rate-limit-main",
    NON_SECURE_PORT,
    "rate-limit-untraced",
    None,
    Some(
      reqwest::Client::new()
        .get(format!(
          "http://localhost:{}/rate-limit-untraced",
          NON_SECURE_PORT
        ))
        .header("x-http-mode", http_mode)
        .header(
          "x-test-server-url",
          format!("http://localhost:{}", NON_SECURE_PORT),
        )
    ),
    None::<Tls>,
    (|resp| async { assert_rate_limit_error(resp).await }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_outbound_rate_limit_global_budget_fetch() {
  test_outbound_rate_limit_global("fetch").await;
}

#[tokio::test]
#[serial]
async fn test_outbound_rate_limit_global_budget_node_http() {
  test_outbound_rate_limit_global("node").await;
}

/// Verifies that `AsyncVariable` isolates trace IDs per request.
///
/// Sends N concurrent requests to the `rate-limit-echo` worker, each carrying
/// a distinct `traceparent`.  The worker reads the `AsyncVariable` set by
/// `http.js` and echoes the trace ID back.  If any response contains a trace
/// ID that does not match the one sent in that request, context has leaked.
#[tokio::test]
#[serial]
async fn test_request_trace_id_isolation() {
  const N: usize = 20;

  init_otel();

  integration_test_with_server_flag!(
    ServerFlags {
      rate_limit_cleanup_interval_sec: 60,
      request_wait_timeout_ms: Some(30_000),
      ..Default::default()
    },
    "./test_cases/rate-limit-main",
    NON_SECURE_PORT,
    "rate-limit-echo",
    None,
    None::<reqwest::RequestBuilder>,
    None::<Tls>,
    (
      |(port, _url, _req_builder, _event_rx, _metric_src)| async move {
        let client = std::sync::Arc::new(reqwest::Client::new());
        let base = std::sync::Arc::new(format!(
          "http://localhost:{}/rate-limit-echo",
          port
        ));

        // Build N futures, each with a unique trace ID.
        let futs: Vec<_> = (0..N)
          .map(|i| {
            let client = client.clone();
            let base = base.clone();
            // Each trace ID is a 32-hex-char string unique to this request.
            let trace_id = format!("{:032x}", i);
            let traceparent = format!("00-{}-1234567890123456-01", trace_id);
            async move {
              let resp = client
                .get(base.as_str())
                .header("traceparent", &traceparent)
                .send()
                .await
                .unwrap();
              assert!(
                resp.status().is_success(),
                "request {i} failed with status {}",
                resp.status()
              );
              let body: serde_json::Value = resp.json().await.unwrap();
              let returned = body["traceId"].as_str().unwrap_or("").to_string();
              (trace_id, returned)
            }
          })
          .collect();

        // Run all requests concurrently.
        let results = futures_util::future::join_all(futs).await;

        for (expected, got) in &results {
          assert_eq!(
            expected, got,
            "AsyncVariable context leaked: expected trace_id={expected} but worker saw {got}"
          );
        }

        // Return the last response to satisfy the macro's type requirement.
        Some(Ok(
          reqwest::Client::new()
            .get(base.as_str())
            .send()
            .await
            .unwrap(),
        ))
      },
      |_resp| async {}
    ),
    TerminationToken::new()
  );
}

/// Verifies that `RateLimitError.retryAfterMs` is a positive number when the
/// global (untraced) budget is exhausted.
#[tokio::test]
#[serial]
async fn test_rate_limit_retry_after_ms() {
  init_otel();

  // The budget in rate-limit-main is 10.  Send 11 requests; the last one
  // should come back as 429 with a positive retryAfterMs value.
  const BUDGET: usize = 10;

  integration_test_with_server_flag!(
    ServerFlags {
      rate_limit_cleanup_interval_sec: 60,
      request_wait_timeout_ms: Some(30_000),
      ..Default::default()
    },
    "./test_cases/rate-limit-main",
    NON_SECURE_PORT,
    "rate-limit-retry-after",
    None,
    None::<reqwest::RequestBuilder>,
    None::<Tls>,
    (
      |(port, _url, _req_builder, _event_rx, _metric_src)| async move {
        let client = reqwest::Client::new();
        let url = format!("http://localhost:{}/rate-limit-retry-after", port);
        let server_url = format!("http://localhost:{}", port);

        // Exhaust the budget.
        for _ in 0..BUDGET {
          let resp = client
            .get(&url)
            .header("x-test-server-url", &server_url)
            .send()
            .await
            .unwrap();
          // Each of these may itself trigger an inner fetch that is counted
          // against the budget; we only care about the final one below.
          let _ = resp;
        }

        // This request should be rate-limited.
        let resp = client
          .get(&url)
          .header("x-test-server-url", &server_url)
          .send()
          .await;

        Some(resp)
      },
      |resp| async move {
        let res = resp.unwrap();
        assert_eq!(
          res.status().as_u16(),
          429,
          "expected 429 from rate-limited request"
        );
        let body: serde_json::Value = res.json().await.unwrap();
        assert_eq!(
          body["name"].as_str().unwrap_or(""),
          "RateLimitError",
          "expected RateLimitError in body, got: {body}"
        );
        let retry_after_ms = body["retryAfterMs"]
          .as_u64()
          .expect("retryAfterMs should be a non-null number");
        assert!(
          retry_after_ms > 0,
          "retryAfterMs should be positive, got {retry_after_ms}"
        );
      }
    ),
    TerminationToken::new()
  );
}

#[derive(Deserialize)]
struct ErrorResponsePayload {
  msg: String,
}

impl ErrorResponsePayload {
  async fn assert_error_response(
    resp: Result<Response, reqwest::Error>,
  ) -> (Self, u16) {
    let res = resp.unwrap();
    let status = res.status().as_u16();
    let res = res.json::<Self>().await;

    assert!(res.is_ok());

    (res.unwrap(), status)
  }
}

trait AsyncReadWrite: AsyncRead + AsyncWrite + Send + Unpin {}

impl<T> AsyncReadWrite for T where T: AsyncRead + AsyncWrite + Send + Unpin {}

trait TlsExt {
  fn client(&self) -> Client;
  fn schema(&self) -> &'static str;
  fn sock_addr(&self) -> SocketAddr;
  fn port(&self) -> u16;
  fn stream(&self) -> BoxFuture<'static, Box<dyn AsyncReadWrite>>;
  fn server_config(&self) -> rustls::ServerConfig;
}

impl TlsExt for Option<Tls> {
  fn client(&self) -> Client {
    if self.is_some() {
      Client::builder()
        .add_root_certificate(
          Certificate::from_pem(TLS_LOCALHOST_ROOT_CA).unwrap(),
        )
        .build()
        .unwrap()
    } else {
      Client::new()
    }
  }

  fn schema(&self) -> &'static str {
    if self.is_some() {
      "https"
    } else {
      "http"
    }
  }

  fn sock_addr(&self) -> SocketAddr {
    const SOCK_ADDR_SECURE: SocketAddr =
      SocketAddr::new(IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)), SECURE_PORT);

    const SOCK_ADDR_NON_SECURE: SocketAddr =
      SocketAddr::new(IpAddr::V4(Ipv4Addr::new(127, 0, 0, 1)), NON_SECURE_PORT);

    if self.is_some() {
      SOCK_ADDR_SECURE
    } else {
      SOCK_ADDR_NON_SECURE
    }
  }

  fn port(&self) -> u16 {
    if self.is_some() {
      SECURE_PORT
    } else {
      NON_SECURE_PORT
    }
  }

  fn stream(&self) -> BoxFuture<'static, Box<dyn AsyncReadWrite>> {
    let use_tls = self.is_some();
    let sock_addr = self.sock_addr();

    async move {
      if use_tls {
        let mut cursor = Cursor::new(Vec::from(TLS_LOCALHOST_ROOT_CA));
        let certs = rustls_pemfile::certs(&mut cursor)
          .collect::<Result<Vec<_>, _>>()
          .unwrap();

        let mut root_cert_store = RootCertStore::empty();
        let _ = root_cert_store.add_parsable_certificates(certs);

        let config = ClientConfig::builder()
          .with_root_certificates(root_cert_store)
          .with_no_client_auth();

        let connector = TlsConnector::from(Arc::new(config));
        let dnsname = ServerName::try_from("localhost").unwrap();

        let stream = TcpStream::connect(sock_addr).await.unwrap();
        let stream = connector.connect(dnsname, stream).await.unwrap();

        Box::new(stream) as Box<dyn AsyncReadWrite>
      } else {
        let stream = TcpStream::connect(sock_addr).await.unwrap();

        Box::new(stream) as Box<dyn AsyncReadWrite>
      }
    }
    .boxed()
  }

  fn server_config(&self) -> rustls::ServerConfig {
    assert!(self.is_some());
    let certs =
      rustls_pemfile::certs(&mut std::io::BufReader::new(TLS_LOCALHOST_CERT))
        .flatten()
        .collect();
    let key = rustls_pemfile::private_key(&mut std::io::BufReader::new(
      TLS_LOCALHOST_KEY,
    ))
    .into_iter()
    .flatten()
    .next()
    .unwrap();

    rustls::ServerConfig::builder()
      .with_no_client_auth()
      .with_single_cert(certs, key)
      .unwrap()
  }
}

fn new_localhost_tls(secure: bool) -> Option<Tls> {
  secure.then(|| {
    Tls::new(SECURE_PORT, TLS_LOCALHOST_KEY, TLS_LOCALHOST_CERT).unwrap()
  })
}

/// Every `User-Agent` the echo server has been sent, in arrival order. Requests
/// that never get a response of their own (a websocket handshake, say) are only
/// observable this way.
type SeenUserAgents = Arc<std::sync::Mutex<Vec<String>>>;

/// Starts a server that answers every request with the `User-Agent` it arrived
/// with, until the token is cancelled.
async fn start_echo_user_agent_server(
  token: CancellationToken,
) -> (String, SeenUserAgents, tokio::task::JoinHandle<()>) {
  let listener = TcpListener::bind("127.0.0.1:0").await.unwrap();
  let url = format!("http://{}", listener.local_addr().unwrap());
  let seen = SeenUserAgents::default();
  let server = tokio::spawn({
    let seen = seen.clone();
    async move {
      loop {
        tokio::select! {
          Ok((stream, _)) = listener.accept() => {
            let seen = seen.clone();
            tokio::spawn(async move {
              hyper::server::conn::Http::new()
                .serve_connection(
                  stream,
                  hyper::service::service_fn(move |req: Request<Body>| {
                    let seen = seen.clone();
                    async move {
                      let user_agent = req
                        .headers()
                        .get(header::USER_AGENT)
                        .and_then(|it| it.to_str().ok())
                        .unwrap_or_default()
                        .to_string();

                      seen.lock().unwrap().push(user_agent.clone());
                      Ok::<_, hyper::Error>(
                        HttpResponse::new(Body::from(user_agent)),
                      )
                    }
                  }),
                )
                .await
                .ok();
            });
          }
          _ = token.cancelled() => break,
        }
      }
    }
  });

  (url, seen, server)
}

/// Serves `path` from `main_with_project_ref` and asserts the function's
/// outbound request reached the echo server with `expected` as `User-Agent`.
async fn assert_echoed_user_agent(
  path: &str,
  echo_url: &str,
  project_ref: Option<&str>,
  user_agent: Option<&str>,
  expected: String,
) {
  let mut builder = Client::new()
    .request(
      Method::POST,
      format!("http://localhost:{}/{}", NON_SECURE_PORT, path),
    )
    .header("x-echo-url", echo_url);

  if let Some(project_ref) = project_ref {
    builder = builder.header("x-project-ref", project_ref);
  }
  if let Some(user_agent) = user_agent {
    builder = builder.header("x-set-user-agent", user_agent);
  }

  integration_test!(
    "./test_cases/main_with_project_ref",
    NON_SECURE_PORT,
    "",
    None,
    Some(builder),
    None,
    (|resp| async move {
      let resp = resp.unwrap();
      assert_eq!(resp.status().as_u16(), StatusCode::OK);
      assert_eq!(resp.text().await.unwrap(), expected);
    }),
    TerminationToken::new()
  );
}

#[tokio::test]
#[serial]
async fn test_outbound_user_agent_is_stamped_with_project_ref() {
  const PROJECT_REF: &str = "abcdefghijklmnopqrst";

  let token = CancellationToken::new();
  let (echo_url, _, server) = start_echo_user_agent_server(token.clone()).await;
  let ref_comment = deno::versions::user_agent_comment(Some(PROJECT_REF));

  // A function that sends no `User-Agent` of its own gets the runtime's, and
  // the project ref is part of it.
  assert_echoed_user_agent(
    "user-agent",
    &echo_url,
    Some(PROJECT_REF),
    None,
    deno::versions::user_agent(Some(PROJECT_REF)),
  )
  .await;

  // A function that sets its own `User-Agent` keeps it, but cannot drop the
  // project ref.
  assert_echoed_user_agent(
    "user-agent",
    &echo_url,
    Some(PROJECT_REF),
    Some("curl/8.7.1"),
    format!("curl/8.7.1 {ref_comment}"),
  )
  .await;

  // Without a project ref, nothing is stamped.
  assert_echoed_user_agent(
    "user-agent",
    &echo_url,
    None,
    Some("curl/8.7.1"),
    "curl/8.7.1".into(),
  )
  .await;

  token.cancel();
  server.await.unwrap();
}

#[tokio::test]
#[serial]
async fn test_outbound_node_http_user_agent_is_stamped_with_project_ref() {
  const PROJECT_REF: &str = "abcdefghijklmnopqrst";

  let token = CancellationToken::new();
  let (echo_url, _, server) = start_echo_user_agent_server(token.clone()).await;
  let ref_comment = deno::versions::user_agent_comment(Some(PROJECT_REF));

  // `node:http` sends no `User-Agent` of its own, so it gets the runtime's.
  assert_echoed_user_agent(
    "user-agent-node",
    &echo_url,
    Some(PROJECT_REF),
    None,
    deno::versions::user_agent(Some(PROJECT_REF)),
  )
  .await;

  // One the caller set is kept, with the project appended to it.
  assert_echoed_user_agent(
    "user-agent-node",
    &echo_url,
    Some(PROJECT_REF),
    Some("curl/8.7.1"),
    format!("curl/8.7.1 {ref_comment}"),
  )
  .await;

  token.cancel();
  server.await.unwrap();
}

#[tokio::test]
#[serial]
async fn test_outbound_node_http2_user_agent_is_stamped_with_project_ref() {
  const PROJECT_REF: &str = "abcdefghijklmnopqrst";

  let token = CancellationToken::new();
  let (echo_url, _, server) = start_echo_user_agent_server(token.clone()).await;
  let ref_comment = deno::versions::user_agent_comment(Some(PROJECT_REF));

  // `node:http2` sends no `User-Agent` of its own, so it gets the runtime's.
  assert_echoed_user_agent(
    "user-agent-http2",
    &echo_url,
    Some(PROJECT_REF),
    None,
    deno::versions::user_agent(Some(PROJECT_REF)),
  )
  .await;

  // One the caller set is kept, with the project appended to it.
  assert_echoed_user_agent(
    "user-agent-http2",
    &echo_url,
    Some(PROJECT_REF),
    Some("curl/8.7.1"),
    format!("curl/8.7.1 {ref_comment}"),
  )
  .await;

  token.cancel();
  server.await.unwrap();
}

#[tokio::test]
#[serial]
async fn test_websocket_handshake_user_agent_is_stamped_with_project_ref() {
  const PROJECT_REF: &str = "abcdefghijklmnopqrst";

  let token = CancellationToken::new();
  let (echo_url, seen, server) =
    start_echo_user_agent_server(token.clone()).await;

  let builder = Client::new()
    .request(
      Method::POST,
      format!("http://localhost:{}/user-agent-websocket", NON_SECURE_PORT),
    )
    .header("x-project-ref", PROJECT_REF)
    .header("x-echo-url", &echo_url);

  integration_test!(
    "./test_cases/main_with_project_ref",
    NON_SECURE_PORT,
    "",
    None,
    Some(builder),
    None,
    (|resp| async move {
      assert_eq!(resp.unwrap().status().as_u16(), StatusCode::OK);
    }),
    TerminationToken::new()
  );

  token.cancel();
  server.await.unwrap();

  assert_eq!(
    seen.lock().unwrap().as_slice(),
    [deno::versions::user_agent(Some(PROJECT_REF))]
  );
}
