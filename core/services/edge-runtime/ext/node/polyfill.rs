// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

/// e.g. `is_builtin_node_module("assert")`
pub fn is_builtin_node_module(module_name: &str) -> bool {
  SUPPORTED_BUILTIN_NODE_MODULES.contains(&module_name)
}

macro_rules! generate_builtin_node_module_lists {
  ($( $module_name:literal ,)+) => {
    pub static SUPPORTED_BUILTIN_NODE_MODULES: &[&str] = &[
      $(
        $module_name,
      )+
    ];

    pub static SUPPORTED_BUILTIN_NODE_MODULES_WITH_PREFIX: &[&str] = &[
      $(
        concat!("node:", $module_name),
      )+
    ];
  };
}

// NOTE(bartlomieju): keep this list in sync with `ext/node/polyfills/01_require.js`
generate_builtin_node_module_lists! {
  "_http_agent",
  "_http_common",
  "_http_outgoing",
  "_http_server",
  "_stream_duplex",
  "_stream_passthrough",
  "_stream_readable",
  "_stream_transform",
  "_stream_writable",
  "_tls_common",
  "_tls_wrap",
  "assert",
  "assert/strict",
  "async_hooks",
  "buffer",
  "child_process",
  "cluster",
  "console",
  "constants",
  "crypto",
  "dgram",
  "diagnostics_channel",
  "dns",
  "dns/promises",
  "domain",
  "events",
  "fs",
  "fs/promises",
  "http",
  "http2",
  "https",
  "inspector",
  "module",
  "net",
  "os",
  "path",
  "path/posix",
  "path/win32",
  "perf_hooks",
  "process",
  "punycode",
  "querystring",
  "repl",
  "readline",
  "readline/promises",
  "stream",
  "stream/consumers",
  "stream/promises",
  "stream/web",
  "string_decoder",
  "sys",
  "test",
  "timers",
  "timers/promises",
  "tls",
  "tty",
  "url",
  "util",
  "util/types",
  "v8",
  // "vm",
  "wasi",
  "worker_threads",
  "zlib",
}
