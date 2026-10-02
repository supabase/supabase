use base::runtime;
use clap::builder::BoolishValueParser;
use clap::builder::TypedValueParser;
use clap::value_parser;
use once_cell::sync::OnceCell;

pub(super) fn resolve_deno_runtime_env() {
  let boolish_parser = BoolishValueParser::new();
  let u64_parser = value_parser!(u64);
  let dumb_command = clap::Command::new(env!("CARGO_BIN_NAME"));
  let resolve_boolish_env =
    |key: &'static str, cell: &'static OnceCell<bool>| {
      cell.get_or_init(|| {
        std::env::var_os(key)
          .map(|it| {
            boolish_parser
              .parse_ref(&dumb_command, None, &it)
              .unwrap_or_default()
          })
          .unwrap_or_default()
      })
    };

  let resolve_u64_env = |key: &'static str, cell: &'static OnceCell<u64>| {
    cell.get_or_init(|| {
      std::env::var_os(key)
        .map(|it| {
          u64_parser
            .parse_ref(&dumb_command, None, &it)
            .unwrap_or_default()
        })
        .unwrap_or_default()
    })
  };

  resolve_boolish_env(
    "DENO_NO_DEPRECATION_WARNINGS",
    &runtime::SHOULD_DISABLE_DEPRECATED_API_WARNING,
  );

  resolve_boolish_env(
    "DENO_VERBOSE_WARNINGS",
    &runtime::SHOULD_USE_VERBOSE_DEPRECATED_API_WARNING,
  );

  resolve_boolish_env(
    "EDGE_RUNTIME_INCLUDE_MALLOCED_MEMORY_ON_MEMCHECK",
    &runtime::SHOULD_INCLUDE_MALLOCED_MEMORY_ON_MEMCHECK,
  );

  resolve_u64_env(
    "EDGE_RUNTIME_MAIN_WORKER_INITIAL_HEAP_SIZE_MIB",
    &runtime::MAIN_WORKER_INITIAL_HEAP_SIZE_MIB,
  );

  resolve_u64_env(
    "EDGE_RUNTIME_MAIN_WORKER_MAX_HEAP_SIZE_MIB",
    &runtime::MAIN_WORKER_MAX_HEAP_SIZE_MIB,
  );

  resolve_u64_env(
    "EDGE_RUNTIME_EVENT_WORKER_INITIAL_HEAP_SIZE_MIB",
    &runtime::EVENT_WORKER_INITIAL_HEAP_SIZE_MIB,
  );

  resolve_u64_env(
    "EDGE_RUNTIME_EVENT_WORKER_MAX_HEAP_SIZE_MIB",
    &runtime::EVENT_WORKER_MAX_HEAP_SIZE_MIB,
  );
}
