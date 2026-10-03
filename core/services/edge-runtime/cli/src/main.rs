use std::fs::File;
use std::io::Write;
use std::net::IpAddr;
use std::net::SocketAddr;
use std::path::PathBuf;
use std::process::ExitCode;
use std::str::FromStr;
use std::sync::Arc;
use std::time::Duration;

use anyhow::bail;
use anyhow::Context;
use anyhow::Error;
use base::server;
use base::server::Builder;
use base::server::RequestIdleTimeout;
use base::server::ServerFlags;
use base::server::Tls;
use base::utils::units::percentage_value;
use base::worker::pool::SupervisorPolicy;
use base::worker::pool::WorkerPoolPolicy;
use base::CacheSetting;
use base::InspectorOption;
use base::WorkerKind;
use deno::deno_telemetry;
use deno::deno_telemetry::OtelConfig;
use deno::ConfigMode;
use deno::DenoOptionsBuilder;
use deno_facade::extract_from_file;
use deno_facade::generate_binary_eszip;
use deno_facade::EmitterFactory;
use deno_facade::Metadata;
use env::resolve_deno_runtime_env;
use flags::get_cli;
use flags::EszipV2ChecksumKind;
use flags::OtelConsoleConfig;
use flags::OtelKind;
use log::warn;
use tokio::time::timeout;

mod env;
mod flags;

#[cfg(not(feature = "tracing"))]
mod logger;

fn main() -> Result<ExitCode, anyhow::Error> {
  resolve_deno_runtime_env();

  let runtime = tokio::runtime::Builder::new_current_thread()
    .enable_all()
    .thread_name("sb-main")
    .build()
    .unwrap();

  // TODO: Tokio runtime shouldn't be needed here (Address later)
  let local = tokio::task::LocalSet::new();
  let res: Result<ExitCode, Error> = local.block_on(&runtime, async {
    let matches = get_cli().get_matches();
    let verbose = matches.get_flag("verbose");

    if !matches.get_flag("quiet") {
      #[cfg(feature = "tracing")]
      {
        use tracing_subscriber::fmt::format::FmtSpan;
        use tracing_subscriber::EnvFilter;

        tracing_subscriber::fmt()
          .with_env_filter(EnvFilter::from_default_env())
          .with_thread_names(true)
          .with_span_events(if verbose {
            FmtSpan::FULL
          } else {
            FmtSpan::NONE
          })
          .init()
      }

      #[cfg(not(feature = "tracing"))]
      {
        let include_source = matches.get_flag("log-source");
        logger::init(verbose, include_source);
      }
    }

    #[allow(clippy::single_match)]
    #[allow(clippy::arc_with_non_send_sync)]
    let exit_code = match matches.subcommand() {
      Some(("start", sub_matches)) => {
        deno_telemetry::init(
          deno::versions::otel_runtime_config(),
          OtelConfig::default(),
        )?;
        base::runtime::otel::init_if_needed();

        let ip = sub_matches.get_one::<String>("ip").cloned().unwrap();
        let ip = IpAddr::from_str(&ip)
          .context("failed to parse the IP address to bind the server")?;

        let port = sub_matches.get_one::<u16>("port").copied().unwrap();

        let addr = SocketAddr::new(ip, port);

        let maybe_tls =
          if let Some(port) = sub_matches.get_one::<u16>("tls").copied() {
            let Some((key_slice, cert_slice)) = sub_matches
              .get_one::<PathBuf>("key")
              .and_then(|it| std::fs::read(it).ok())
              .zip(
                sub_matches
                  .get_one::<PathBuf>("cert")
                  .and_then(|it| std::fs::read(it).ok()),
              )
            else {
              bail!("unable to load the key file or cert file");
            };

            Some(Tls::new(port, &key_slice, &cert_slice)?)
          } else {
            None
          };

        let main_service_path = sub_matches
          .get_one::<String>("main-service")
          .cloned()
          .unwrap();

        let no_module_cache = sub_matches
          .get_one::<bool>("disable-module-cache")
          .cloned()
          .unwrap();

        let allow_main_inspector = sub_matches
          .get_one::<bool>("inspect-main")
          .cloned()
          .unwrap();

        let enable_otel = sub_matches
          .get_many::<OtelKind>("enable-otel")
          .unwrap_or_default()
          .cloned()
          .collect::<Vec<_>>();

        let otel_console = sub_matches
          .get_one::<OtelConsoleConfig>("otel-console")
          .cloned()
          .map(Into::into);

        let event_service_manager_path =
          sub_matches.get_one::<String>("event-worker").cloned();
        let maybe_main_entrypoint =
          sub_matches.get_one::<String>("main-entrypoint").cloned();
        let maybe_events_entrypoint =
          sub_matches.get_one::<String>("events-entrypoint").cloned();

        let maybe_supervisor_policy = sub_matches
          .get_one::<String>("policy")
          .map(|it| it.parse::<SupervisorPolicy>().unwrap());

        let graceful_exit_deadline_sec = sub_matches
          .get_one::<u64>("graceful-exit-timeout")
          .cloned()
          .unwrap_or(0);

        let graceful_exit_keepalive_deadline_ms = sub_matches
          .get_one::<u64>("experimental-graceful-exit-keepalive-deadline-ratio")
          .cloned()
          .and_then(|it| {
            if it == 0 {
              return None;
            }

            percentage_value(graceful_exit_deadline_sec * 1000, it)
          });

        let event_worker_exit_deadline_sec = sub_matches
          .get_one::<u64>("event-worker-exit-timeout")
          .cloned()
          .unwrap_or(0);

        let maybe_max_parallelism =
          sub_matches.get_one::<usize>("max-parallelism").cloned();
        let maybe_request_wait_timeout =
          sub_matches.get_one::<u64>("request-wait-timeout").cloned();
        let maybe_main_worker_request_idle_timeout = sub_matches
          .get_one::<u64>("main-worker-request-idle-timeout")
          .cloned();
        let maybe_user_worker_request_idle_timeout = sub_matches
          .get_one::<u64>("user-worker-request-idle-timeout")
          .cloned();
        let maybe_request_read_timeout =
          sub_matches.get_one::<u64>("request-read-timeout").cloned();

        let maybe_beforeunload_wall_clock_pct = sub_matches
          .get_one::<u8>("dispatch-beforeunload-wall-clock-ratio")
          .cloned();
        let maybe_beforeunload_cpu_pct = sub_matches
          .get_one::<u8>("dispatch-beforeunload-cpu-ratio")
          .cloned();
        let maybe_beforeunload_memory_pct = sub_matches
          .get_one::<u8>("dispatch-beforeunload-memory-ratio")
          .cloned();

        let static_patterns =
          if let Some(val_ref) = sub_matches.get_many::<String>("static") {
            val_ref.map(|s| s.as_str()).collect::<Vec<&str>>()
          } else {
            vec![]
          };

        let static_patterns: Vec<String> =
          static_patterns.into_iter().map(|s| s.to_string()).collect();

        let inspector = sub_matches.get_one::<clap::Id>("inspector").zip(
          sub_matches
            .get_one("inspect")
            .or(sub_matches.get_one("inspect-brk"))
            .or(sub_matches.get_one::<SocketAddr>("inspect-wait")),
        );

        let maybe_inspector_option = if let Some((key, addr)) = inspector {
          Some(get_inspector_option(key.as_str(), addr).unwrap())
        } else {
          None
        };

        let tcp_nodelay =
          sub_matches.get_one::<bool>("tcp-nodelay").copied().unwrap();
        let request_buffer_size = sub_matches
          .get_one::<u64>("request-buffer-size")
          .copied()
          .unwrap();
        let rate_limit_cleanup_interval_sec = sub_matches
          .get_one::<u64>("rate-limit-table-cleanup-interval")
          .copied()
          .unwrap_or(60);
        if rate_limit_cleanup_interval_sec == 0 {
          bail!("--rate-limit-table-cleanup-interval must be >= 1 second");
        }
        let flags = ServerFlags {
          otel: if !enable_otel.is_empty() {
            if enable_otel.len() > 1 {
              Some(server::OtelKind::Both)
            } else {
              match enable_otel.first() {
                Some(OtelKind::Main) => Some(server::OtelKind::Main),
                Some(OtelKind::Event) => Some(server::OtelKind::Event),
                None => None,
              }
            }
          } else {
            None
          },
          otel_console,

          no_module_cache,
          allow_main_inspector,
          tcp_nodelay,

          graceful_exit_deadline_sec,
          graceful_exit_keepalive_deadline_ms,
          event_worker_exit_deadline_sec,
          request_wait_timeout_ms: maybe_request_wait_timeout,
          request_idle_timeout: RequestIdleTimeout::from_millis(
            maybe_main_worker_request_idle_timeout,
            maybe_user_worker_request_idle_timeout,
          ),
          request_read_timeout_ms: maybe_request_read_timeout,
          request_buffer_size: Some(request_buffer_size),

          beforeunload_wall_clock_pct: maybe_beforeunload_wall_clock_pct,
          beforeunload_cpu_pct: maybe_beforeunload_cpu_pct,
          beforeunload_memory_pct: maybe_beforeunload_memory_pct,

          rate_limit_cleanup_interval_sec,
        };

        let mut builder = Builder::new(addr, &main_service_path);

        builder.user_worker_policy(WorkerPoolPolicy::new(
          maybe_supervisor_policy,
          if let Some(true) = maybe_supervisor_policy
            .as_ref()
            .map(SupervisorPolicy::is_oneshot)
          {
            if let Some(parallelism) = maybe_max_parallelism {
              if parallelism == 0 || parallelism > 1 {
                warn!(
                  "{}",
                  concat!(
                    "if `oneshot` policy is enabled, the maximum ",
                    "parallelism is fixed to `1` as forcibly ^^"
                  )
                );
              }
            }

            Some(1)
          } else {
            maybe_max_parallelism
          },
          flags,
        ));

        if let Some(tls) = maybe_tls {
          builder.tls(tls);
        }
        if let Some(worker_path) = event_service_manager_path {
          builder.event_worker_path(&worker_path);
        }
        if let Some(inspector_option) = maybe_inspector_option {
          builder.inspector(inspector_option);
        }

        builder.extend_static_patterns(static_patterns);
        builder.entrypoints_mut().main = maybe_main_entrypoint;
        builder.entrypoints_mut().events = maybe_events_entrypoint;

        *builder.flags_mut() = flags;

        let maybe_received_signum_or_exit_code =
          builder.build().await?.listen().await?;

        maybe_received_signum_or_exit_code
          .map(|it| it.map_left(|it| ExitCode::from(it as u8)).into_inner())
          .unwrap_or_default()
      }

      Some(("bundle", sub_matches)) => {
        let output_path =
          sub_matches.get_one::<String>("output").cloned().unwrap();
        let import_map_path =
          sub_matches.get_one::<String>("import-map").cloned();
        let decorator = sub_matches.get_one::<String>("decorator").cloned();
        let static_patterns =
          if let Some(val_ref) = sub_matches.get_many::<String>("static") {
            val_ref.map(|s| s.as_str()).collect::<Vec<&str>>()
          } else {
            vec![]
          };
        let timeout_dur = sub_matches
          .get_one::<u64>("timeout")
          .cloned()
          .map(Duration::from_secs);

        if import_map_path.is_some() {
          warn!(concat!(
            "Specifying import_map through flags is no longer supported. ",
            "Please use deno.json instead."
          ))
        }
        if decorator.is_some() {
          warn!(concat!(
            "Specifying decorator through flags is no longer supported. ",
            "Please use deno.json instead."
          ))
        }

        let entrypoint_script_path = sub_matches
          .get_one::<String>("entrypoint")
          .cloned()
          .unwrap();

        let entrypoint_script_path =
          PathBuf::from(entrypoint_script_path.as_str());
        if !entrypoint_script_path.is_file() {
          bail!(
            "entrypoint path does not exist ({})",
            entrypoint_script_path.display()
          );
        }

        let entrypoint_script_path =
          entrypoint_script_path.canonicalize().unwrap();

        let mut emitter_factory = EmitterFactory::new();

        if sub_matches
          .get_one::<bool>("disable-module-cache")
          .cloned()
          .unwrap()
        {
          emitter_factory.set_cache_strategy(Some(CacheSetting::ReloadAll));
        }

        let maybe_checksum_kind = sub_matches
          .get_one::<EszipV2ChecksumKind>("checksum")
          .copied()
          .and_then(EszipV2ChecksumKind::into);

        emitter_factory.set_permissions_options(Some(
          base::get_default_permissions(WorkerKind::MainWorker),
        ));

        let mut builder =
          DenoOptionsBuilder::new().entrypoint(entrypoint_script_path.clone());

        if let Some(path) = import_map_path {
          let path = PathBuf::from(path);
          if !path.exists() || !path.is_file() {
            bail!("import map path is incorrect");
          }
          builder.set_config(Some(ConfigMode::Path(path)));
        }
        emitter_factory.set_deno_options(builder.build()?);

        let mut metadata = Metadata::default();
        let eszip_fut = generate_binary_eszip(
          &mut metadata,
          Arc::new(emitter_factory),
          None,
          maybe_checksum_kind,
          Some(static_patterns),
        );

        let eszip = if let Some(dur) = timeout_dur {
          match timeout(dur, eszip_fut).await {
            Ok(eszip) => eszip,
            Err(_) => {
              bail!("Failed to complete the bundle within the given time.")
            }
          }
        } else {
          eszip_fut.await
        }?;

        let bin = eszip.into_bytes();

        if output_path == "-" {
          let stdout = std::io::stdout();
          let mut handle = stdout.lock();

          handle.write_all(&bin)?
        } else {
          let mut file = File::create(output_path.as_str())?;
          file.write_all(&bin)?
        }

        ExitCode::SUCCESS
      }

      Some(("unbundle", sub_matches)) => {
        let output_path =
          sub_matches.get_one::<String>("output").cloned().unwrap();
        let eszip_path =
          sub_matches.get_one::<String>("eszip").cloned().unwrap();

        let output_path = PathBuf::from(output_path.as_str());
        let eszip_path = PathBuf::from(eszip_path.as_str());

        if extract_from_file(eszip_path, output_path.clone()).await {
          println!(
            "Eszip extracted successfully inside path {}",
            output_path.to_str().unwrap()
          );
          ExitCode::SUCCESS
        } else {
          ExitCode::FAILURE
        }
      }

      _ => {
        // unrecognized command
        ExitCode::FAILURE
      }
    };

    Ok(exit_code)
  });

  res
}

fn get_inspector_option(
  key: &str,
  addr: &SocketAddr,
) -> Result<InspectorOption, anyhow::Error> {
  match key {
    "inspect" => Ok(InspectorOption::Inspect(*addr)),
    "inspect-brk" => Ok(InspectorOption::WithBreak(*addr)),
    "inspect-wait" => Ok(InspectorOption::WithWait(*addr)),
    key => bail!("invalid inspector key: {}", key),
  }
}
