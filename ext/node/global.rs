// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use deno_core::v8;
use deno_core::v8::GetPropertyNamesArgs;
use deno_core::v8::MapFnTo;

// NOTE(bartlomieju): somehow calling `.map_fn_to()` multiple times on a function
// returns two different pointers. That shouldn't be the case as `.map_fn_to()`
// creates a thin wrapper that is a pure function. @piscisaureus suggests it
// might be a bug in Rust compiler; so for now we just create and store
// these mapped functions per-thread. We should revisit it in the future and
// ideally remove altogether.
thread_local! {
  pub static GETTER_MAP_FN: v8::NamedPropertyGetterCallback<'static> = getter.map_fn_to();
  pub static SETTER_MAP_FN: v8::NamedPropertySetterCallback<'static> = setter.map_fn_to();
  pub static QUERY_MAP_FN: v8::NamedPropertyQueryCallback<'static> = query.map_fn_to();
  pub static DELETER_MAP_FN: v8::NamedPropertyDeleterCallback<'static> = deleter.map_fn_to();
  pub static ENUMERATOR_MAP_FN: v8::NamedPropertyEnumeratorCallback<'static> = enumerator.map_fn_to();
  pub static DEFINER_MAP_FN: v8::NamedPropertyDefinerCallback<'static> = definer.map_fn_to();
  pub static DESCRIPTOR_MAP_FN: v8::NamedPropertyGetterCallback<'static> = descriptor.map_fn_to();
}

/// Convert an ASCII string to a UTF-16 byte encoding of the string.
const fn str_to_utf16<const N: usize>(s: &str) -> [u16; N] {
  let mut out = [0_u16; N];
  let mut i = 0;
  let bytes = s.as_bytes();
  assert!(N == bytes.len());
  while i < bytes.len() {
    assert!(bytes[i] < 128, "only works for ASCII strings");
    out[i] = bytes[i] as u16;
    i += 1;
  }
  out
}

// ext/node changes the global object to be a proxy object that intercepts all
// property accesses for globals that are different between Node and Deno and
// dynamically returns a different value depending on if the accessing code is
// in node_modules/ or not.
//
// To make this performant, a v8 named property handler is used, that only
// intercepts property accesses for properties that are not already present on
// the global object (it is non-masking). This means that in the common case,
// when a user accesses a global that is the same between Node and Deno (like
// Uint8Array or fetch), the proxy overhead is avoided.
//
// The Deno and Node specific globals are stored in a struct in a context slot.
//
// These are the globals that are handled:
// - Buffer (node only)
// - clearImmediate (node only)
// - clearInterval (both, but different implementation)
// - clearTimeout (both, but different implementation)
// - global (node only)
// - performance (both, but different implementation)
// - setImmediate (node only)
// - setInterval (both, but different implementation)
// - setTimeout (both, but different implementation)
// - window (deno only)

// UTF-16 encodings of the managed globals. THIS LIST MUST BE SORTED.
#[rustfmt::skip]
const MANAGED_GLOBALS: [&[u16]; 12] = [
  &str_to_utf16::<6>("Buffer"),
  &str_to_utf16::<17>("WorkerGlobalScope"),
  &str_to_utf16::<14>("clearImmediate"),
  &str_to_utf16::<13>("clearInterval"),
  &str_to_utf16::<12>("clearTimeout"),
  &str_to_utf16::<6>("global"),
  &str_to_utf16::<11>("performance"),
  &str_to_utf16::<4>("self"),
  &str_to_utf16::<12>("setImmediate"),
  &str_to_utf16::<11>("setInterval"),
  &str_to_utf16::<10>("setTimeout"),
  &str_to_utf16::<6>("window"),
];

// Calculates the shortest & longest length of global var names
const MANAGED_GLOBALS_INFO: (usize, usize) = {
  let l = MANAGED_GLOBALS[0].len();
  let (mut longest, mut shortest, mut i) = (l, l, 1);
  while i < MANAGED_GLOBALS.len() {
    let l = MANAGED_GLOBALS[i].len();
    if l > longest {
      longest = l
    }
    if l < shortest {
      shortest = l
    }
    i += 1;
  }
  (shortest, longest)
};

const SHORTEST_MANAGED_GLOBAL: usize = MANAGED_GLOBALS_INFO.0;
const LONGEST_MANAGED_GLOBAL: usize = MANAGED_GLOBALS_INFO.1;

#[derive(Debug, Clone, Copy)]
enum Mode {
  Deno,
  Node,
}

struct GlobalsStorage {
  deno_globals: v8::Global<v8::Object>,
  node_globals: v8::Global<v8::Object>,
}

impl GlobalsStorage {
  fn inner_for_mode(&self, mode: Mode) -> v8::Global<v8::Object> {
    match mode {
      Mode::Deno => &self.deno_globals,
      Mode::Node => &self.node_globals,
    }
    .clone()
  }
}

pub fn global_template_middleware<'s>(
  _scope: &mut v8::HandleScope<'s, ()>,
  template: v8::Local<'s, v8::ObjectTemplate>,
) -> v8::Local<'s, v8::ObjectTemplate> {
  let mut config = v8::NamedPropertyHandlerConfiguration::new().flags(
    v8::PropertyHandlerFlags::NON_MASKING
      | v8::PropertyHandlerFlags::HAS_NO_SIDE_EFFECT,
  );

  config = GETTER_MAP_FN.with(|getter| config.getter_raw(*getter));
  config = SETTER_MAP_FN.with(|setter| config.setter_raw(*setter));
  config = QUERY_MAP_FN.with(|query| config.query_raw(*query));
  config = DELETER_MAP_FN.with(|deleter| config.deleter_raw(*deleter));
  config =
    ENUMERATOR_MAP_FN.with(|enumerator| config.enumerator_raw(*enumerator));
  config = DEFINER_MAP_FN.with(|definer| config.definer_raw(*definer));
  config =
    DESCRIPTOR_MAP_FN.with(|descriptor| config.descriptor_raw(*descriptor));

  template.set_named_property_handler(config);

  template
}

pub fn global_object_middleware<'s>(
  scope: &mut v8::HandleScope<'s>,
  global: v8::Local<'s, v8::Object>,
) {
  // ensure the global object is not Object.prototype
  let object_key =
    v8::String::new_external_onebyte_static(scope, b"Object").unwrap();
  let object = global
    .get(scope, object_key.into())
    .unwrap()
    .to_object(scope)
    .unwrap();
  let prototype_key =
    v8::String::new_external_onebyte_static(scope, b"prototype").unwrap();
  let object_prototype = object
    .get(scope, prototype_key.into())
    .unwrap()
    .to_object(scope)
    .unwrap();
  assert_ne!(global, object_prototype);

  // globalThis.__bootstrap.ext_node_denoGlobals and
  // globalThis.__bootstrap.ext_node_nodeGlobals are the objects that contain
  // the Deno and Node specific globals respectively. If they do not yet exist
  // on the global object, create them as null prototype objects.
  let bootstrap_key =
    v8::String::new_external_onebyte_static(scope, b"__bootstrap").unwrap();
  let bootstrap = match global.get(scope, bootstrap_key.into()) {
    Some(value) if value.is_object() => value.to_object(scope).unwrap(),
    Some(value) if value.is_undefined() => {
      let null = v8::null(scope);
      let obj =
        v8::Object::with_prototype_and_properties(scope, null.into(), &[], &[]);
      global.set(scope, bootstrap_key.into(), obj.into());
      obj
    }
    _ => panic!("__bootstrap should not be tampered with"),
  };
  let deno_globals_key =
    v8::String::new_external_onebyte_static(scope, b"ext_node_denoGlobals")
      .unwrap();
  let deno_globals = match bootstrap.get(scope, deno_globals_key.into()) {
    Some(value) if value.is_object() => value,
    Some(value) if value.is_undefined() => {
      let null = v8::null(scope);
      let obj =
        v8::Object::with_prototype_and_properties(scope, null.into(), &[], &[])
          .into();
      bootstrap.set(scope, deno_globals_key.into(), obj);
      obj
    }
    _ => panic!("__bootstrap.ext_node_denoGlobals should not be tampered with"),
  };
  let deno_globals_obj: v8::Local<v8::Object> =
    deno_globals.try_into().unwrap();
  let deno_globals = v8::Global::new(scope, deno_globals_obj);
  let node_globals_key =
    v8::String::new_external_onebyte_static(scope, b"ext_node_nodeGlobals")
      .unwrap();
  let node_globals = match bootstrap.get(scope, node_globals_key.into()) {
    Some(value) if value.is_object() => value,
    Some(value) if value.is_undefined() => {
      let null = v8::null(scope);
      let obj =
        v8::Object::with_prototype_and_properties(scope, null.into(), &[], &[])
          .into();
      bootstrap.set(scope, node_globals_key.into(), obj);
      obj
    }
    _ => panic!("__bootstrap.ext_node_nodeGlobals should not be tampered with"),
  };
  let node_globals_obj: v8::Local<v8::Object> =
    node_globals.try_into().unwrap();
  let node_globals = v8::Global::new(scope, node_globals_obj);

  // Create the storage struct and store it in a context slot.
  let storage = GlobalsStorage {
    deno_globals,
    node_globals,
  };
  scope.get_current_context().set_slot(storage);
}

fn is_managed_key(
  scope: &mut v8::HandleScope,
  key: v8::Local<v8::Name>,
) -> bool {
  let Ok(str): Result<v8::Local<v8::String>, _> = key.try_into() else {
    return false;
  };
  let len = str.length();

  #[allow(clippy::manual_range_contains)]
  if len < SHORTEST_MANAGED_GLOBAL || len > LONGEST_MANAGED_GLOBAL {
    return false;
  }
  let buf = &mut [0u16; LONGEST_MANAGED_GLOBAL];
  let written = str.write(
    scope,
    buf.as_mut_slice(),
    0,
    v8::WriteOptions::NO_NULL_TERMINATION,
  );
  assert_eq!(written, len);
  MANAGED_GLOBALS.binary_search(&&buf[..len]).is_ok()
}

fn current_mode(scope: &mut v8::HandleScope) -> Mode {
  let Some(host_defined_options) = scope.get_current_host_defined_options()
  else {
    return Mode::Deno;
  };
  // SAFETY: host defined options must always be a PrimitiveArray in current V8.
  let host_defined_options = unsafe {
    v8::Local::<v8::PrimitiveArray>::cast_unchecked(host_defined_options)
  };
  if host_defined_options.length() < 1 {
    return Mode::Deno;
  }
  let is_node = host_defined_options.get(scope, 0).is_true();
  if is_node {
    Mode::Node
  } else {
    Mode::Deno
  }
}

pub fn getter<'s>(
  scope: &mut v8::HandleScope<'s>,
  key: v8::Local<'s, v8::Name>,
  args: v8::PropertyCallbackArguments<'s>,
  mut rv: v8::ReturnValue,
) -> v8::Intercepted {
  if !is_managed_key(scope, key) {
    return v8::Intercepted::No;
  };

  let this = args.this();
  let mode = current_mode(scope);

  let context = scope.get_current_context();
  let inner = {
    let storage = context.get_slot::<GlobalsStorage>().unwrap();
    storage.inner_for_mode(mode)
  };
  let inner = v8::Local::new(scope, inner);

  if !inner.has_own_property(scope, key).unwrap_or(false) {
    return v8::Intercepted::No;
  }

  let Some(value) = inner.get_with_receiver(scope, key.into(), this) else {
    return v8::Intercepted::No;
  };

  rv.set(value);
  v8::Intercepted::Yes
}

pub fn setter<'s>(
  scope: &mut v8::HandleScope<'s>,
  key: v8::Local<'s, v8::Name>,
  value: v8::Local<'s, v8::Value>,
  args: v8::PropertyCallbackArguments<'s>,
  mut rv: v8::ReturnValue<()>,
) -> v8::Intercepted {
  if !is_managed_key(scope, key) {
    return v8::Intercepted::No;
  };

  let this = args.this();
  let mode = current_mode(scope);

  let context = scope.get_current_context();
  let inner = {
    let storage = context.get_slot::<GlobalsStorage>().unwrap();
    storage.inner_for_mode(mode)
  };
  let inner = v8::Local::new(scope, inner);

  let Some(success) = inner.set_with_receiver(scope, key.into(), value, this)
  else {
    return v8::Intercepted::No;
  };

  rv.set_bool(success);
  v8::Intercepted::Yes
}

pub fn query<'s>(
  scope: &mut v8::HandleScope<'s>,
  key: v8::Local<'s, v8::Name>,
  _args: v8::PropertyCallbackArguments<'s>,
  mut rv: v8::ReturnValue<v8::Integer>,
) -> v8::Intercepted {
  if !is_managed_key(scope, key) {
    return v8::Intercepted::No;
  };
  let mode = current_mode(scope);

  let context = scope.get_current_context();
  let inner = {
    let storage = context.get_slot::<GlobalsStorage>().unwrap();
    storage.inner_for_mode(mode)
  };
  let inner = v8::Local::new(scope, inner);

  let Some(true) = inner.has_own_property(scope, key) else {
    return v8::Intercepted::No;
  };

  let Some(attributes) = inner.get_property_attributes(scope, key.into())
  else {
    return v8::Intercepted::No;
  };

  rv.set_uint32(attributes.as_u32());
  v8::Intercepted::Yes
}

pub fn deleter<'s>(
  scope: &mut v8::HandleScope<'s>,
  key: v8::Local<'s, v8::Name>,
  args: v8::PropertyCallbackArguments<'s>,
  mut rv: v8::ReturnValue<v8::Boolean>,
) -> v8::Intercepted {
  if !is_managed_key(scope, key) {
    return v8::Intercepted::No;
  };

  let mode = current_mode(scope);

  let context = scope.get_current_context();
  let inner = {
    let storage = context.get_slot::<GlobalsStorage>().unwrap();
    storage.inner_for_mode(mode)
  };
  let inner = v8::Local::new(scope, inner);

  let Some(success) = inner.delete(scope, key.into()) else {
    return v8::Intercepted::No;
  };

  if args.should_throw_on_error() && !success {
    let message = v8::String::new(scope, "Cannot delete property").unwrap();
    let exception = v8::Exception::type_error(scope, message);
    scope.throw_exception(exception);
    return v8::Intercepted::Yes;
  }

  rv.set_bool(success);
  v8::Intercepted::Yes
}

pub fn enumerator<'s>(
  scope: &mut v8::HandleScope<'s>,
  _args: v8::PropertyCallbackArguments<'s>,
  mut rv: v8::ReturnValue<v8::Array>,
) {
  let mode = current_mode(scope);

  let context = scope.get_current_context();
  let inner = {
    let storage = context.get_slot::<GlobalsStorage>().unwrap();
    storage.inner_for_mode(mode)
  };
  let inner = v8::Local::new(scope, inner);

  let Some(array) = inner.get_property_names(
    scope,
    GetPropertyNamesArgs {
      mode: v8::KeyCollectionMode::OwnOnly,
      property_filter: v8::PropertyFilter::ALL_PROPERTIES,
      ..Default::default()
    },
  ) else {
    return;
  };

  rv.set(array);
}

pub fn definer<'s>(
  scope: &mut v8::HandleScope<'s>,
  key: v8::Local<'s, v8::Name>,
  descriptor: &v8::PropertyDescriptor,
  args: v8::PropertyCallbackArguments<'s>,
  _rv: v8::ReturnValue<()>,
) -> v8::Intercepted {
  if !is_managed_key(scope, key) {
    return v8::Intercepted::No;
  };

  let mode = current_mode(scope);

  let context = scope.get_current_context();
  let inner = {
    let storage = context.get_slot::<GlobalsStorage>().unwrap();
    storage.inner_for_mode(mode)
  };
  let inner = v8::Local::new(scope, inner);

  let Some(success) = inner.define_property(scope, key, descriptor) else {
    return v8::Intercepted::No;
  };

  if args.should_throw_on_error() && !success {
    let message = v8::String::new(scope, "Cannot define property").unwrap();
    let exception = v8::Exception::type_error(scope, message);
    scope.throw_exception(exception);
  }

  v8::Intercepted::Yes
}

pub fn descriptor<'s>(
  scope: &mut v8::HandleScope<'s>,
  key: v8::Local<'s, v8::Name>,
  _args: v8::PropertyCallbackArguments<'s>,
  mut rv: v8::ReturnValue,
) -> v8::Intercepted {
  if !is_managed_key(scope, key) {
    return v8::Intercepted::No;
  };

  let mode = current_mode(scope);

  let scope = &mut v8::TryCatch::new(scope);

  let context = scope.get_current_context();
  let inner = {
    let storage = context.get_slot::<GlobalsStorage>().unwrap();
    storage.inner_for_mode(mode)
  };
  let inner = v8::Local::new(scope, inner);

  let Some(descriptor) = inner.get_own_property_descriptor(scope, key) else {
    scope.rethrow().expect("to have caught an exception");
    return v8::Intercepted::Yes;
  };

  if descriptor.is_undefined() {
    return v8::Intercepted::No;
  }

  rv.set(descriptor);
  v8::Intercepted::Yes
}
