use std::sync::Once;

use deno_core::v8;

pub fn v8_init() {
  let platform = v8::new_unprotected_default_platform(0, false).make_shared();
  v8::V8::initialize_platform(platform);
  v8::V8::initialize();
}

pub fn v8_shutdown() {
  // SAFETY: this is safe, because all isolates have been shut down already.
  unsafe {
    v8::V8::dispose();
  }
  v8::V8::dispose_platform();
}

pub fn v8_do(f: impl FnOnce()) {
  static V8_INIT: Once = Once::new();
  V8_INIT.call_once(|| {
    v8_init();
  });
  f();
  // v8_shutdown();
}
