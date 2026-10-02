use std::net::SocketAddr;
use std::path::PathBuf;

use clap::arg;
use clap::builder::BoolishValueParser;
use clap::builder::FalseyValueParser;
use clap::builder::TypedValueParser;
use clap::crate_version;
use clap::value_parser;
use clap::ArgAction;
use clap::ArgGroup;
use clap::Command;
use clap::ValueEnum;
use deno::deno_telemetry;
use deno_facade::Checksum;

#[derive(ValueEnum, Default, Clone, Copy)]
#[repr(u8)]
pub(super) enum EszipV2ChecksumKind {
  #[default]
  NoChecksum = 0,
  Sha256 = 1,
  XxHash3 = 2,
}

impl From<EszipV2ChecksumKind> for Option<Checksum> {
  fn from(value: EszipV2ChecksumKind) -> Self {
    Checksum::from_u8(value as u8)
  }
}

#[derive(ValueEnum, Clone, Copy)]
pub(super) enum OtelKind {
  Main,
  Event,
}

#[derive(ValueEnum, Default, Clone, Copy)]
pub(super) enum OtelConsoleConfig {
  #[default]
  Ignore,
  Capture,
  Replace,
}

impl From<OtelConsoleConfig> for deno_telemetry::OtelConsoleConfig {
  fn from(value: OtelConsoleConfig) -> Self {
    match value {
      OtelConsoleConfig::Ignore => Self::Ignore,
      OtelConsoleConfig::Capture => Self::Capture,
      OtelConsoleConfig::Replace => Self::Replace,
    }
  }
}

pub(super) fn get_cli() -> Command {
  Command::new(env!("CARGO_BIN_NAME"))
    .about(env!("CARGO_PKG_DESCRIPTION"))
    .version(format!(
      "{}\ndeno {} ({}, {})",
      crate_version!(),
      deno::version(),
      env!("PROFILE"),
      env!("TARGET")
    ))
    .arg_required_else_help(true)
    .arg(
      arg!(-v --verbose "Use verbose output")
        .conflicts_with("quiet")
        .global(true)
        .action(ArgAction::SetTrue),
    )
    .arg(
      arg!(-q --quiet "Do not print any log messages")
        .conflicts_with("verbose")
        .global(true)
        .action(ArgAction::SetTrue),
    )
    .arg(
      arg!(--"log-source")
        .help("Include source file and line in log messages")
        .global(true)
        .action(ArgAction::SetTrue),
    )
    .subcommand(get_start_command())
    .subcommand(get_bundle_command())
    .subcommand(get_unbundle_command())
}

fn get_start_command() -> Command {
  Command::new("start")
    .about("Start the server")
    .arg(
      arg!(-i --ip <HOST>)
        .help("Host IP address to listen on")
        .default_value("0.0.0.0"),
    )
    .arg(
      arg!(-p --port <PORT>)
        .help("Port to listen on")
        .env("EDGE_RUNTIME_PORT")
        .default_value("9000")
        .value_parser(value_parser!(u16)),
    )
    .arg(
      arg!(--tls[PORT])
        .env("EDGE_RUNTIME_TLS")
        .num_args(0..=1)
        .default_missing_value("443")
        .value_parser(value_parser!(u16))
        .requires("key")
        .requires("cert"),
    )
    .arg(
      arg!(--key <Path>)
        .help("Path to PEM-encoded key to be used to TLS")
        .env("EDGE_RUNTIME_TLS_KEY_PATH")
        .value_parser(value_parser!(PathBuf)),
    )
    .arg(
      arg!(--cert <Path>)
        .help("Path to PEM-encoded X.509 certificate to be used to TLS")
        .env("EDGE_RUNTIME_TLS_CERT_PATH")
        .value_parser(value_parser!(PathBuf)),
    )
    .arg(
      arg!(--"main-service" <DIR>)
        .help("Path to main service directory or eszip")
        .default_value("examples/main"),
    )
    .arg(
      arg!(--"disable-module-cache")
        .help("Disable using module cache")
        .default_value("false")
        .value_parser(FalseyValueParser::new()),
    )
    .arg(arg!(--"event-worker" <Path>).help("Path to event worker directory"))
    .arg(
      arg!(--"main-entrypoint" <Path>)
        .help("Path to entrypoint in main service (only for eszips)"),
    )
    .arg(
      arg!(--"events-entrypoint" <Path>)
        .help("Path to entrypoint in events worker (only for eszips)"),
    )
    .arg(
      arg!(--"policy" <POLICY>)
        .help("Policy to enforce in the worker pool")
        .default_value("per_worker")
        .value_parser(["per_worker", "per_request", "oneshot"]),
    )
    .arg(
      arg!(--"graceful-exit-timeout"[SECONDS])
        .help(concat!(
          "Maximum time in seconds that can wait for workers before ",
          "terminating forcibly. If providing zero value, the runtime will ",
          "not try a graceful exit."
        ))
        // NOTE(Nyannyacha): Default timeout value follows the
        // value[1] defined in moby.
        //
        // [1]: https://github.com/moby/moby/blob/master/daemon/config/config.go#L45-L47
        .default_value("15")
        .value_parser(value_parser!(u64).range(..u64::MAX)),
    )
    .arg(
      arg!(--"event-worker-exit-timeout"[SECONDS])
        .help(concat!(
          "Maximum time in seconds that can wait for the event worker before ",
          "terminating forcibly. (graceful exit)"
        ))
        .default_value("10")
        .value_parser(value_parser!(u64).range(..u64::MAX)),
    )
    .arg(
      arg!(
        --"experimental-graceful-exit-keepalive-deadline-ratio"
        <PERCENTAGE>
      )
      .help(concat!(
        "(Experimental) Maximum period of time that incoming requests ",
        "can be processed over a pre-established keep-alive HTTP connection. ",
        "This is specified as a percentage of the `--graceful-exit-timeout` ",
        "value. The percentage cannot be greater than 95."
      ))
      .value_parser(value_parser!(u64).range(..=95)),
    )
    .arg(
      arg!(--"max-parallelism" <COUNT>)
        .help(concat!(
          "Maximum count of workers that can exist in the worker pool ",
          "simultaneously"
        ))
        .value_parser(
          // NOTE: Acceptable bounds were chosen arbitrarily.
          value_parser!(u32)
            .range(1..9999)
            .map(|it| -> usize { it as usize }),
        ),
    )
    .arg(
      arg!(--"request-wait-timeout" <MILLISECONDS>)
        .help(concat!(
          "Maximum time in milliseconds that can wait to establish a ",
          "connection with a worker"
        ))
        .default_value("10000")
        .value_parser(value_parser!(u64)),
    )
    .arg(
      arg!(--"main-worker-request-idle-timeout" <MILLISECONDS>)
        .help(concat!(
          "Maximum time in milliseconds that can be waited from when a ",
          "worker takes over the request (disabled by default)"
        ))
        .value_parser(value_parser!(u64)),
    )
    .arg(
      arg!(--"user-worker-request-idle-timeout" <MILLISECONDS>)
        .help(concat!(
          "Maximum time in milliseconds that can be waited from when a ",
          "worker takes over the request (disabled by default)"
        ))
        .value_parser(value_parser!(u64)),
    )
    .arg(
      arg!(--"request-read-timeout" <MILLISECONDS>)
        .help(concat!(
          "Maximum time in milliseconds that can be waited from when the ",
          "connection is accepted until the request body is fully read ",
          "(disabled by default)"
        ))
        .value_parser(value_parser!(u64)),
    )
    .arg(
      arg!(--"rate-limit-table-cleanup-interval" <SECONDS>)
        .help(concat!(
          "Interval in seconds between sweeps of the outbound rate-limit ",
          "table to remove expired entries (default: 60)"
        ))
        .default_value("60")
        .value_parser(value_parser!(u64)),
    )
    .arg(
      arg!(--"inspect"[HOST_AND_PORT])
        .help("Activate inspector on host:port")
        .num_args(0..=1)
        .value_parser(value_parser!(SocketAddr))
        .require_equals(true)
        .default_missing_value("127.0.0.1:9229"),
    )
    .arg(
      arg!(--"inspect-brk"[HOST_AND_PORT])
        .help(concat!(
          "Activate inspector on host:port, wait for debugger to connect ",
          "and break at the start of user script"
        ))
        .num_args(0..=1)
        .value_parser(value_parser!(SocketAddr))
        .require_equals(true)
        .default_missing_value("127.0.0.1:9229"),
    )
    .arg(
      arg!(--"inspect-wait"[HOST_AND_PORT])
        .help(concat!(
          "Activate inspector on host:port and wait for debugger to ",
          "connect before running user code"
        ))
        .num_args(0..=1)
        .value_parser(value_parser!(SocketAddr))
        .require_equals(true)
        .default_missing_value("127.0.0.1:9229"),
    )
    .group(ArgGroup::new("inspector").args([
      "inspect",
      "inspect-brk",
      "inspect-wait",
    ]))
    .arg(
      arg!(--"inspect-main")
        .help("Allow creating inspector for main worker")
        .requires("inspector")
        .action(ArgAction::SetTrue),
    )
    .arg(
      arg!(--"static" <Path>)
        .help("Glob pattern for static files to be included")
        .action(ArgAction::Append),
    )
    .arg(
      arg!(--"tcp-nodelay"[BOOL])
        .help("Disables Nagle's algorithm")
        .num_args(0..=1)
        .value_parser(BoolishValueParser::new())
        .require_equals(true)
        .default_value("true")
        .default_missing_value("true"),
    )
    .arg(
      arg!(--"request-buffer-size" <BYTES>)
        .help(concat!(
          "The buffer size of the stream that is used to forward a request ",
          "to the worker"
        ))
        .value_parser(value_parser!(u64))
        .default_value("16384"),
    )
    .arg(
      arg!(--"dispatch-beforeunload-wall-clock-ratio" <PERCENTAGE>)
        .value_parser(value_parser!(u8).range(..=99))
        .default_value("90"),
    )
    .arg(
      arg!(--"dispatch-beforeunload-cpu-ratio" <PERCENTAGE>)
        .value_parser(value_parser!(u8).range(..=99))
        .default_value("90"),
    )
    .arg(
      arg!(--"dispatch-beforeunload-memory-ratio" <PERCENTAGE>)
        .value_parser(value_parser!(u8).range(..=99))
        .default_value("90"),
    )
    .arg(
      arg!(--"enable-otel")
        .help("Enable OpenTelemetry in the main and event workers")
        .value_delimiter(',')
        .value_parser(value_parser!(OtelKind))
        .num_args(0..=1)
        .default_missing_value("main,event")
        .action(ArgAction::Append),
    )
    .arg(
      arg!(--"otel-console" <MODE>)
        // .env("OTEL_DENO_CONSOLE")
        .help("Configure console auto instrumentation for OpenTelemetry Logs")
        .value_parser(value_parser!(OtelConsoleConfig)),
    )
}

fn get_bundle_command() -> Command {
  Command::new("bundle")
    .about(concat!(
      "Creates an 'eszip' file that can be executed by the EdgeRuntime. ",
      "Such file contains all the modules in contained in a single binary."
    ))
    .arg(
      arg!(--"output" <DIR>)
        .help("Path to output eszip file")
        .default_value("bin.eszip"),
    )
    .arg(
      arg!(--"entrypoint" <Path>)
        .help("Path to entrypoint to bundle as an eszip")
        .required(true),
    )
    .arg(
      arg!(--"static" <Path>)
        .help("Glob pattern for static files to be included")
        .action(ArgAction::Append),
    )
    .arg(
      arg!(--"import-map" <Path>).help("(DEPRECATED) Path to import map file"),
    )
    .arg(
      arg!(--"decorator" <TYPE>)
        .help(concat!(
          "(DEPRECATED) Type of decorator to use on the main worker and event worker. ",
          "If not specified, the decorator feature is disabled."
        ))
        .value_parser(["tc39", "typescript", "typescript_with_metadata"]),
    )
    .arg(
      arg!(--"checksum" <KIND>)
        .env("EDGE_RUNTIME_BUNDLE_CHECKSUM")
        .help("Hash function to use when checksum the contents")
        .value_parser(value_parser!(EszipV2ChecksumKind)),
    )
    .arg(
      arg!(--"disable-module-cache")
        .help("Disable using module cache")
        .default_value("false")
        .value_parser(FalseyValueParser::new()),
    )
    .arg(
      arg!(--"timeout" <SECONDS>)
        .help("Maximum time in seconds that can be waited for the bundle to complete.")
        .value_parser(value_parser!(u64).range(..u64::MAX))
    )
}

fn get_unbundle_command() -> Command {
  Command::new("unbundle")
    .about("Unbundles an .eszip file into the specified directory")
    .arg(
      arg!(--"output" <DIR>)
        .help("Path to extract the ESZIP content")
        .default_value("./"),
    )
    .arg(
      arg!(--"eszip" <Path>)
        .help("Path of eszip to extract")
        .required(true),
    )
}
