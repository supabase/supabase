// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use crate::create_host_defined_options;
use deno_core::op2;
use deno_core::serde_v8;
use deno_core::v8;
use deno_core::v8::MapFnTo;
use deno_core::JsBuffer;
use deno_core::OpState;
use deno_permissions::PermissionsContainer;
use std::sync::atomic::AtomicBool;
use std::sync::atomic::Ordering;
use std::time::Duration;

pub const PRIVATE_SYMBOL_NAME: v8::OneByteConst =
  v8::String::create_external_onebyte_const(b"node:contextify:context");

/// An unbounded script that can be run in a context.
pub struct ContextifyScript {
  script: v8::TracedReference<v8::UnboundScript>,
}

impl v8::cppgc::GarbageCollected for ContextifyScript {
  fn trace(&self, visitor: &v8::cppgc::Visitor) {
    visitor.trace(&self.script);
  }
}

impl ContextifyScript {
  #[allow(clippy::too_many_arguments)]
  fn create<'s>(
    scope: &mut v8::HandleScope<'s>,
    source: v8::Local<'s, v8::String>,
    filename: v8::Local<'s, v8::Value>,
    line_offset: i32,
    column_offset: i32,
    cached_data: Option<JsBuffer>,
    produce_cached_data: bool,
    parsing_context: Option<v8::Local<'s, v8::Object>>,
  ) -> Option<CompileResult<'s>> {
    let context = if let Some(parsing_context) = parsing_context {
      let Some(context) =
        ContextifyContext::from_sandbox_obj(scope, parsing_context)
      else {
        let message = v8::String::new_external_onebyte_static(
          scope,
          b"Invalid sandbox object",
        )
        .unwrap();
        let exception = v8::Exception::type_error(scope, message);
        scope.throw_exception(exception);
        return None;
      };
      context.context(scope)
    } else {
      scope.get_current_context()
    };

    let scope = &mut v8::ContextScope::new(scope, context);
    let host_defined_options = create_host_defined_options(scope);
    let origin = v8::ScriptOrigin::new(
      scope,
      filename,
      line_offset,
      column_offset,
      true,
      -1,
      None,
      false,
      false,
      false,
      Some(host_defined_options),
    );

    let mut source = if let Some(cached_data) = cached_data {
      let cached_data = v8::script_compiler::CachedData::new(&cached_data);
      v8::script_compiler::Source::new_with_cached_data(
        source,
        Some(&origin),
        cached_data,
      )
    } else {
      v8::script_compiler::Source::new(source, Some(&origin))
    };

    let options = if source.get_cached_data().is_some() {
      v8::script_compiler::CompileOptions::ConsumeCodeCache
    } else {
      v8::script_compiler::CompileOptions::NoCompileOptions
    };

    let scope = &mut v8::TryCatch::new(scope);

    let Some(unbound_script) = v8::script_compiler::compile_unbound_script(
      scope,
      &mut source,
      options,
      v8::script_compiler::NoCacheReason::NoReason,
    ) else {
      if !scope.has_terminated() {
        scope.rethrow();
      }
      return None;
    };

    let cached_data = if produce_cached_data {
      unbound_script.create_code_cache()
    } else {
      None
    };

    let script = v8::TracedReference::new(scope, unbound_script);
    let this = deno_core::cppgc::make_cppgc_object(scope, Self { script });

    Some(CompileResult {
      value: serde_v8::Value {
        v8_value: this.into(),
      },
      cached_data: cached_data.as_ref().map(|c| {
        let backing_store =
          v8::ArrayBuffer::new_backing_store_from_vec(c.to_vec());
        v8::ArrayBuffer::with_backing_store(scope, &backing_store.make_shared())
          .into()
      }),
      cached_data_rejected: source
        .get_cached_data()
        .map(|c| c.rejected())
        .unwrap_or(false),
      cached_data_produced: cached_data.is_some(),
    })
  }

  fn run_in_context<'s>(
    &self,
    scope: &mut v8::HandleScope<'s>,
    sandbox: Option<v8::Local<'s, v8::Object>>,
    timeout: i64,
    display_errors: bool,
    break_on_sigint: bool,
  ) -> Option<v8::Local<'s, v8::Value>> {
    let (context, microtask_queue) = if let Some(sandbox) = sandbox {
      let Some(context) = ContextifyContext::from_sandbox_obj(scope, sandbox)
      else {
        let message = v8::String::new_external_onebyte_static(
          scope,
          b"Invalid sandbox object",
        )
        .unwrap();
        let exception = v8::Exception::type_error(scope, message);
        scope.throw_exception(exception);
        return None;
      };
      (context.context(scope), context.microtask_queue())
    } else {
      (scope.get_current_context(), None)
    };

    self.eval_machine(
      scope,
      context,
      timeout,
      display_errors,
      break_on_sigint,
      microtask_queue,
    )
  }

  pub fn eval_machine<'s>(
    &self,
    scope: &mut v8::HandleScope<'s>,
    context: v8::Local<v8::Context>,
    timeout: i64,
    _display_errors: bool,
    _break_on_sigint: bool,
    microtask_queue: Option<&v8::MicrotaskQueue>,
  ) -> Option<v8::Local<'s, v8::Value>> {
    let context_scope = &mut v8::ContextScope::new(scope, context);
    let scope = &mut v8::EscapableHandleScope::new(context_scope);
    let scope = &mut v8::TryCatch::new(scope);

    let unbound_script = self.script.get(scope).unwrap();
    let script = unbound_script.bind_to_current_context(scope);

    let handle = scope.thread_safe_handle();

    let mut run = || {
      let r = script.run(scope);
      if r.is_some() {
        if let Some(mtask_queue) = microtask_queue {
          mtask_queue.perform_checkpoint(scope);
        }
      }
      r
    };

    #[allow(clippy::disallowed_types)]
    let timed_out = std::sync::Arc::new(AtomicBool::new(false));
    let result = if timeout != -1 {
      let timed_out = timed_out.clone();
      let (tx, rx) = std::sync::mpsc::channel();
      deno_core::unsync::spawn_blocking(move || {
        if rx
          .recv_timeout(Duration::from_millis(timeout as _))
          .is_err()
        {
          timed_out.store(true, Ordering::Relaxed);
          handle.terminate_execution();
        }
      });
      let r = run();
      let _ = tx.send(());
      r
    } else {
      run()
    };

    if timed_out.load(Ordering::Relaxed) {
      if scope.has_terminated() {
        scope.cancel_terminate_execution();
      }
      let message = v8::String::new(
        scope,
        &format!("Script execution timed out after {timeout}ms"),
      )
      .unwrap();
      let exception = v8::Exception::error(scope, message);
      let code_str =
        v8::String::new_external_onebyte_static(scope, b"code").unwrap();
      let code = v8::String::new_external_onebyte_static(
        scope,
        b"ERR_SCRIPT_EXECUTION_TIMEOUT",
      )
      .unwrap();
      exception
        .cast::<v8::Object>()
        .set(scope, code_str.into(), code.into());
      scope.throw_exception(exception);
    }

    if scope.has_caught() {
      // If there was an exception thrown during script execution, re-throw it.
      if !scope.has_terminated() {
        scope.rethrow();
      }

      return None;
    }

    Some(scope.escape(result?))
  }
}

pub struct ContextifyContext {
  microtask_queue: *mut v8::MicrotaskQueue,
  context: v8::TracedReference<v8::Context>,
  sandbox: v8::TracedReference<v8::Object>,
}

impl deno_core::GarbageCollected for ContextifyContext {
  fn trace(&self, visitor: &v8::cppgc::Visitor) {
    visitor.trace(&self.context);
    visitor.trace(&self.sandbox);
  }
}

impl Drop for ContextifyContext {
  fn drop(&mut self) {
    if !self.microtask_queue.is_null() {
      // SAFETY: If this isn't null, it is a valid MicrotaskQueue.
      unsafe {
        std::ptr::drop_in_place(self.microtask_queue);
      }
    }
  }
}

struct AllowCodeGenWasm(bool);

extern "C" fn allow_wasm_code_gen(
  context: v8::Local<v8::Context>,
  _source: v8::Local<v8::String>,
) -> bool {
  match context.get_slot::<AllowCodeGenWasm>() {
    Some(b) => b.0,
    None => true,
  }
}

impl ContextifyContext {
  pub fn attach(
    scope: &mut v8::HandleScope,
    sandbox_obj: v8::Local<v8::Object>,
    _name: String,
    _origin: String,
    allow_code_gen_strings: bool,
    allow_code_gen_wasm: bool,
    own_microtask_queue: bool,
  ) {
    let main_context = scope.get_current_context();

    let tmp = init_global_template(scope, ContextInitMode::UseSnapshot);

    let microtask_queue = if own_microtask_queue {
      v8::MicrotaskQueue::new(scope, v8::MicrotasksPolicy::Explicit).into_raw()
    } else {
      std::ptr::null_mut()
    };

    let context = create_v8_context(
      scope,
      tmp,
      ContextInitMode::UseSnapshot,
      microtask_queue,
    );

    let context_state = main_context.get_aligned_pointer_from_embedder_data(
      deno_core::CONTEXT_STATE_SLOT_INDEX,
    );
    let module_map = main_context
      .get_aligned_pointer_from_embedder_data(deno_core::MODULE_MAP_SLOT_INDEX);

    context.set_security_token(main_context.get_security_token(scope));
    // SAFETY: set embedder data from the creation context
    unsafe {
      context.set_aligned_pointer_in_embedder_data(
        deno_core::CONTEXT_STATE_SLOT_INDEX,
        context_state,
      );
      context.set_aligned_pointer_in_embedder_data(
        deno_core::MODULE_MAP_SLOT_INDEX,
        module_map,
      );
    }

    scope.set_allow_wasm_code_generation_callback(allow_wasm_code_gen);
    context.set_allow_generation_from_strings(allow_code_gen_strings);
    context.set_slot(AllowCodeGenWasm(allow_code_gen_wasm));

    let wrapper = {
      let context = v8::TracedReference::new(scope, context);
      let sandbox = v8::TracedReference::new(scope, sandbox_obj);
      deno_core::cppgc::make_cppgc_object(
        scope,
        Self {
          context,
          sandbox,
          microtask_queue,
        },
      )
    };
    let ptr =
      deno_core::cppgc::try_unwrap_cppgc_object::<Self>(scope, wrapper.into());

    // SAFETY: We are storing a pointer to the ContextifyContext
    // in the embedder data of the v8::Context. The contextified wrapper
    // lives longer than the execution context, so this should be safe.
    unsafe {
      context.set_aligned_pointer_in_embedder_data(
        3,
        &*ptr.unwrap() as *const ContextifyContext as _,
      );
    }

    let private_str =
      v8::String::new_from_onebyte_const(scope, &PRIVATE_SYMBOL_NAME);
    let private_symbol = v8::Private::for_api(scope, private_str);

    sandbox_obj.set_private(scope, private_symbol, wrapper.into());
  }

  pub fn from_sandbox_obj<'a>(
    scope: &mut v8::HandleScope<'a>,
    sandbox_obj: v8::Local<v8::Object>,
  ) -> Option<&'a Self> {
    let private_str =
      v8::String::new_from_onebyte_const(scope, &PRIVATE_SYMBOL_NAME);
    let private_symbol = v8::Private::for_api(scope, private_str);

    sandbox_obj
      .get_private(scope, private_symbol)
      .and_then(|wrapper| {
        deno_core::cppgc::try_unwrap_cppgc_object::<Self>(scope, wrapper)
          // SAFETY: the lifetime of the scope does not actually bind to
          // the lifetime of this reference at all, but the object we read
          // it from does, so it will be alive at least that long.
          .map(|r| unsafe { &*(&*r as *const _) })
      })
  }

  pub fn is_contextify_context(
    scope: &mut v8::HandleScope,
    object: v8::Local<v8::Object>,
  ) -> bool {
    Self::from_sandbox_obj(scope, object).is_some()
  }

  pub fn context<'a>(
    &self,
    scope: &mut v8::HandleScope<'a>,
  ) -> v8::Local<'a, v8::Context> {
    self.context.get(scope).unwrap()
  }

  fn global_proxy<'s>(
    &self,
    scope: &mut v8::HandleScope<'s>,
  ) -> v8::Local<'s, v8::Object> {
    let ctx = self.context(scope);
    ctx.global(scope)
  }

  fn sandbox<'a>(
    &self,
    scope: &mut v8::HandleScope<'a>,
  ) -> Option<v8::Local<'a, v8::Object>> {
    self.sandbox.get(scope)
  }

  fn microtask_queue(&self) -> Option<&v8::MicrotaskQueue> {
    if self.microtask_queue.is_null() {
      None
    } else {
      // SAFETY: If this isn't null, it is a valid MicrotaskQueue.
      Some(unsafe { &*self.microtask_queue })
    }
  }

  fn get<'a, 'c>(
    scope: &mut v8::HandleScope<'a>,
    object: v8::Local<'a, v8::Object>,
  ) -> Option<&'c ContextifyContext> {
    let context = object.get_creation_context(scope)?;

    let context_ptr = context.get_aligned_pointer_from_embedder_data(3);
    if context_ptr.is_null() {
      return None;
    }
    // SAFETY: We are storing a pointer to the ContextifyContext
    // in the embedder data of the v8::Context during creation.
    Some(unsafe { &*(context_ptr as *const ContextifyContext) })
  }
}

pub const VM_CONTEXT_INDEX: usize = 0;

#[derive(PartialEq)]
pub enum ContextInitMode {
  ForSnapshot,
  UseSnapshot,
}

pub fn create_v8_context<'a>(
  scope: &mut v8::HandleScope<'a, ()>,
  object_template: v8::Local<v8::ObjectTemplate>,
  mode: ContextInitMode,
  microtask_queue: *mut v8::MicrotaskQueue,
) -> v8::Local<'a, v8::Context> {
  let scope = &mut v8::EscapableHandleScope::new(scope);

  let context = if mode == ContextInitMode::UseSnapshot {
    v8::Context::from_snapshot(
      scope,
      VM_CONTEXT_INDEX,
      v8::ContextOptions {
        microtask_queue: Some(microtask_queue),
        ..Default::default()
      },
    )
    .unwrap()
  } else {
    let ctx = v8::Context::new(
      scope,
      v8::ContextOptions {
        global_template: Some(object_template),
        microtask_queue: Some(microtask_queue),
        ..Default::default()
      },
    );
    // SAFETY: ContextifyContexts will update this to a pointer to the native object
    unsafe {
      ctx.set_aligned_pointer_in_embedder_data(1, std::ptr::null_mut());
      ctx.set_aligned_pointer_in_embedder_data(2, std::ptr::null_mut());
      ctx.set_aligned_pointer_in_embedder_data(3, std::ptr::null_mut());
      ctx.clear_all_slots();
    };
    ctx
  };

  scope.escape(context)
}

#[derive(Debug, Clone)]
struct SlotContextifyGlobalTemplate(v8::Global<v8::ObjectTemplate>);

pub fn init_global_template<'a>(
  scope: &mut v8::HandleScope<'a, ()>,
  mode: ContextInitMode,
) -> v8::Local<'a, v8::ObjectTemplate> {
  let maybe_object_template_slot =
    scope.get_slot::<SlotContextifyGlobalTemplate>();

  if let Some(object_template_slot) = maybe_object_template_slot {
    let object_template_slot = object_template_slot.clone();
    v8::Local::new(scope, object_template_slot.0)
  } else {
    let global_object_template = init_global_template_inner(scope);

    if mode == ContextInitMode::UseSnapshot {
      let contextify_global_template_slot = SlotContextifyGlobalTemplate(
        v8::Global::new(scope, global_object_template),
      );
      scope.set_slot(contextify_global_template_slot);
    }
    global_object_template
  }
}

// Using thread_local! to get around compiler bug.
//
// See NOTE in ext/node/global.rs#L12
thread_local! {
  pub static QUERY_MAP_FN: v8::NamedPropertyQueryCallback<'static> = property_query.map_fn_to();
  pub static GETTER_MAP_FN: v8::NamedPropertyGetterCallback<'static> = property_getter.map_fn_to();
  pub static SETTER_MAP_FN: v8::NamedPropertySetterCallback<'static> = property_setter.map_fn_to();
  pub static DELETER_MAP_FN: v8::NamedPropertyDeleterCallback<'static> = property_deleter.map_fn_to();
  pub static ENUMERATOR_MAP_FN: v8::NamedPropertyEnumeratorCallback<'static> = property_enumerator.map_fn_to();
  pub static DEFINER_MAP_FN: v8::NamedPropertyDefinerCallback<'static> = property_definer.map_fn_to();
  pub static DESCRIPTOR_MAP_FN: v8::NamedPropertyDescriptorCallback<'static> = property_descriptor.map_fn_to();
}

thread_local! {
  pub static INDEXED_GETTER_MAP_FN: v8::IndexedPropertyGetterCallback<'static> = indexed_property_getter.map_fn_to();
  pub static INDEXED_SETTER_MAP_FN: v8::IndexedPropertySetterCallback<'static> = indexed_property_setter.map_fn_to();
  pub static INDEXED_DELETER_MAP_FN: v8::IndexedPropertyDeleterCallback<'static> = indexed_property_deleter.map_fn_to();
  pub static INDEXED_DEFINER_MAP_FN: v8::IndexedPropertyDefinerCallback<'static> = indexed_property_definer.map_fn_to();
  pub static INDEXED_DESCRIPTOR_MAP_FN: v8::IndexedPropertyDescriptorCallback<'static> = indexed_property_descriptor.map_fn_to();
  pub static INDEXED_ENUMERATOR_MAP_FN: v8::IndexedPropertyEnumeratorCallback<'static> = indexed_property_enumerator.map_fn_to();
  pub static INDEXED_QUERY_MAP_FN: v8::IndexedPropertyQueryCallback<'static> = indexed_property_query.map_fn_to();
}

pub fn init_global_template_inner<'a>(
  scope: &mut v8::HandleScope<'a, ()>,
) -> v8::Local<'a, v8::ObjectTemplate> {
  let global_object_template = v8::ObjectTemplate::new(scope);
  global_object_template.set_internal_field_count(3);

  let named_property_handler_config = {
    let mut config = v8::NamedPropertyHandlerConfiguration::new()
      .flags(v8::PropertyHandlerFlags::HAS_NO_SIDE_EFFECT);

    config = GETTER_MAP_FN.with(|getter| config.getter_raw(*getter));
    config = SETTER_MAP_FN.with(|setter| config.setter_raw(*setter));
    config = QUERY_MAP_FN.with(|query| config.query_raw(*query));
    config = DELETER_MAP_FN.with(|deleter| config.deleter_raw(*deleter));
    config =
      ENUMERATOR_MAP_FN.with(|enumerator| config.enumerator_raw(*enumerator));
    config = DEFINER_MAP_FN.with(|definer| config.definer_raw(*definer));
    config =
      DESCRIPTOR_MAP_FN.with(|descriptor| config.descriptor_raw(*descriptor));

    config
  };

  let indexed_property_handler_config = {
    let mut config = v8::IndexedPropertyHandlerConfiguration::new()
      .flags(v8::PropertyHandlerFlags::HAS_NO_SIDE_EFFECT);

    config = INDEXED_GETTER_MAP_FN.with(|getter| config.getter_raw(*getter));
    config = INDEXED_SETTER_MAP_FN.with(|setter| config.setter_raw(*setter));
    config = INDEXED_QUERY_MAP_FN.with(|query| config.query_raw(*query));
    config =
      INDEXED_DELETER_MAP_FN.with(|deleter| config.deleter_raw(*deleter));
    config = INDEXED_ENUMERATOR_MAP_FN
      .with(|enumerator| config.enumerator_raw(*enumerator));
    config =
      INDEXED_DEFINER_MAP_FN.with(|definer| config.definer_raw(*definer));
    config = INDEXED_DESCRIPTOR_MAP_FN
      .with(|descriptor| config.descriptor_raw(*descriptor));

    config
  };

  global_object_template
    .set_named_property_handler(named_property_handler_config);
  global_object_template
    .set_indexed_property_handler(indexed_property_handler_config);

  global_object_template
}

fn property_query<'s>(
  scope: &mut v8::HandleScope<'s>,
  property: v8::Local<'s, v8::Name>,
  args: v8::PropertyCallbackArguments<'s>,
  mut rv: v8::ReturnValue<v8::Integer>,
) -> v8::Intercepted {
  let Some(ctx) = ContextifyContext::get(scope, args.this()) else {
    return v8::Intercepted::No;
  };

  let context = ctx.context(scope);
  let scope = &mut v8::ContextScope::new(scope, context);
  let Some(sandbox) = ctx.sandbox(scope) else {
    return v8::Intercepted::No;
  };

  match sandbox.has_real_named_property(scope, property) {
    None => v8::Intercepted::No,
    Some(true) => {
      let Some(attr) =
        sandbox.get_real_named_property_attributes(scope, property)
      else {
        return v8::Intercepted::No;
      };
      rv.set_uint32(attr.as_u32());
      v8::Intercepted::Yes
    }
    Some(false) => {
      match ctx
        .global_proxy(scope)
        .has_real_named_property(scope, property)
      {
        None => v8::Intercepted::No,
        Some(true) => {
          let Some(attr) = ctx
            .global_proxy(scope)
            .get_real_named_property_attributes(scope, property)
          else {
            return v8::Intercepted::No;
          };
          rv.set_uint32(attr.as_u32());
          v8::Intercepted::Yes
        }
        Some(false) => v8::Intercepted::No,
      }
    }
  }
}

fn property_getter<'s>(
  scope: &mut v8::HandleScope<'s>,
  key: v8::Local<'s, v8::Name>,
  args: v8::PropertyCallbackArguments<'s>,
  mut ret: v8::ReturnValue,
) -> v8::Intercepted {
  let Some(ctx) = ContextifyContext::get(scope, args.this()) else {
    return v8::Intercepted::No;
  };

  let Some(sandbox) = ctx.sandbox(scope) else {
    return v8::Intercepted::No;
  };

  let tc_scope = &mut v8::TryCatch::new(scope);
  let maybe_rv = sandbox.get_real_named_property(tc_scope, key).or_else(|| {
    ctx
      .global_proxy(tc_scope)
      .get_real_named_property(tc_scope, key)
  });

  if let Some(mut rv) = maybe_rv {
    if tc_scope.has_caught() && !tc_scope.has_terminated() {
      tc_scope.rethrow();
    }

    if rv == sandbox {
      rv = ctx.global_proxy(tc_scope).into();
    }

    ret.set(rv);
    return v8::Intercepted::Yes;
  }

  v8::Intercepted::No
}

fn property_setter<'s>(
  scope: &mut v8::HandleScope<'s>,
  key: v8::Local<'s, v8::Name>,
  value: v8::Local<'s, v8::Value>,
  args: v8::PropertyCallbackArguments<'s>,
  _rv: v8::ReturnValue<()>,
) -> v8::Intercepted {
  let Some(ctx) = ContextifyContext::get(scope, args.this()) else {
    return v8::Intercepted::No;
  };

  let (attributes, is_declared_on_global_proxy) = match ctx
    .global_proxy(scope)
    .get_real_named_property_attributes(scope, key)
  {
    Some(attr) => (attr, true),
    None => (v8::PropertyAttribute::NONE, false),
  };
  let mut read_only = attributes.is_read_only();
  let Some(sandbox) = ctx.sandbox(scope) else {
    return v8::Intercepted::No;
  };
  let (attributes, is_declared_on_sandbox) =
    match sandbox.get_real_named_property_attributes(scope, key) {
      Some(attr) => (attr, true),
      None => (v8::PropertyAttribute::NONE, false),
    };
  read_only |= attributes.is_read_only();

  if read_only {
    return v8::Intercepted::No;
  }

  // true for x = 5
  // false for this.x = 5
  // false for Object.defineProperty(this, 'foo', ...)
  // false for vmResult.x = 5 where vmResult = vm.runInContext();
  let is_contextual_store = ctx.global_proxy(scope) != args.this();

  // Indicator to not return before setting (undeclared) function declarations
  // on the sandbox in strict mode, i.e. args.ShouldThrowOnError() = true.
  // True for 'function f() {}', 'this.f = function() {}',
  // 'var f = function()'.
  // In effect only for 'function f() {}' because
  // var f = function(), is_declared = true
  // this.f = function() {}, is_contextual_store = false.
  let is_function = value.is_function();

  let is_declared = is_declared_on_global_proxy || is_declared_on_sandbox;
  if !is_declared
    && args.should_throw_on_error()
    && is_contextual_store
    && !is_function
  {
    return v8::Intercepted::No;
  }

  if !is_declared && key.is_symbol() {
    return v8::Intercepted::No;
  };

  if sandbox.set(scope, key.into(), value).is_none() {
    return v8::Intercepted::No;
  }

  if is_declared_on_sandbox {
    if let Some(desc) = sandbox.get_own_property_descriptor(scope, key) {
      if !desc.is_undefined() {
        let desc_obj: v8::Local<v8::Object> = desc.try_into().unwrap();
        // We have to specify the return value for any contextual or get/set
        // property
        let get_key =
          v8::String::new_external_onebyte_static(scope, b"get").unwrap();
        let set_key =
          v8::String::new_external_onebyte_static(scope, b"set").unwrap();
        if desc_obj
          .has_own_property(scope, get_key.into())
          .unwrap_or(false)
          || desc_obj
            .has_own_property(scope, set_key.into())
            .unwrap_or(false)
        {
          return v8::Intercepted::Yes;
        }
      }
    }
  }

  v8::Intercepted::No
}

fn property_descriptor<'s>(
  scope: &mut v8::HandleScope<'s>,
  key: v8::Local<'s, v8::Name>,
  args: v8::PropertyCallbackArguments<'s>,
  mut rv: v8::ReturnValue,
) -> v8::Intercepted {
  let Some(ctx) = ContextifyContext::get(scope, args.this()) else {
    return v8::Intercepted::No;
  };

  let context = ctx.context(scope);
  let Some(sandbox) = ctx.sandbox(scope) else {
    return v8::Intercepted::No;
  };
  let scope = &mut v8::ContextScope::new(scope, context);

  if sandbox.has_own_property(scope, key).unwrap_or(false) {
    if let Some(desc) = sandbox.get_own_property_descriptor(scope, key) {
      rv.set(desc);
      return v8::Intercepted::Yes;
    }
  }

  v8::Intercepted::No
}

fn property_definer<'s>(
  scope: &mut v8::HandleScope<'s>,
  key: v8::Local<'s, v8::Name>,
  desc: &v8::PropertyDescriptor,
  args: v8::PropertyCallbackArguments<'s>,
  _: v8::ReturnValue<()>,
) -> v8::Intercepted {
  let Some(ctx) = ContextifyContext::get(scope, args.this()) else {
    return v8::Intercepted::No;
  };

  let context = ctx.context(scope);
  let scope = &mut v8::ContextScope::new(scope, context);

  let (attributes, is_declared) = match ctx
    .global_proxy(scope)
    .get_real_named_property_attributes(scope, key)
  {
    Some(attr) => (attr, true),
    None => (v8::PropertyAttribute::NONE, false),
  };

  let read_only = attributes.is_read_only();
  let dont_delete = attributes.is_dont_delete();

  // If the property is set on the global as read_only, don't change it on
  // the global or sandbox.
  if is_declared && read_only && dont_delete {
    return v8::Intercepted::No;
  }

  let Some(sandbox) = ctx.sandbox(scope) else {
    return v8::Intercepted::No;
  };

  let define_prop_on_sandbox =
    |scope: &mut v8::HandleScope,
     desc_for_sandbox: &mut v8::PropertyDescriptor| {
      if desc.has_enumerable() {
        desc_for_sandbox.set_enumerable(desc.enumerable());
      }

      if desc.has_configurable() {
        desc_for_sandbox.set_configurable(desc.configurable());
      }

      sandbox.define_property(scope, key, desc_for_sandbox);
    };

  if desc.has_get() || desc.has_set() {
    let mut desc_for_sandbox = v8::PropertyDescriptor::new_from_get_set(
      if desc.has_get() {
        desc.get()
      } else {
        v8::undefined(scope).into()
      },
      if desc.has_set() {
        desc.set()
      } else {
        v8::undefined(scope).into()
      },
    );

    define_prop_on_sandbox(scope, &mut desc_for_sandbox);
  } else {
    let value = if desc.has_value() {
      desc.value()
    } else {
      v8::undefined(scope).into()
    };

    if desc.has_writable() {
      let mut desc_for_sandbox =
        v8::PropertyDescriptor::new_from_value_writable(value, desc.writable());
      define_prop_on_sandbox(scope, &mut desc_for_sandbox);
    } else {
      let mut desc_for_sandbox = v8::PropertyDescriptor::new_from_value(value);
      define_prop_on_sandbox(scope, &mut desc_for_sandbox);
    }
  }

  v8::Intercepted::Yes
}

fn property_deleter<'s>(
  scope: &mut v8::HandleScope<'s>,
  key: v8::Local<'s, v8::Name>,
  args: v8::PropertyCallbackArguments<'s>,
  mut rv: v8::ReturnValue<v8::Boolean>,
) -> v8::Intercepted {
  let Some(ctx) = ContextifyContext::get(scope, args.this()) else {
    return v8::Intercepted::No;
  };

  let context = ctx.context(scope);
  let Some(sandbox) = ctx.sandbox(scope) else {
    return v8::Intercepted::No;
  };

  let context_scope = &mut v8::ContextScope::new(scope, context);
  if sandbox.delete(context_scope, key.into()).unwrap_or(false) {
    return v8::Intercepted::No;
  }

  rv.set_bool(false);
  v8::Intercepted::Yes
}

fn property_enumerator<'s>(
  scope: &mut v8::HandleScope<'s>,
  args: v8::PropertyCallbackArguments<'s>,
  mut rv: v8::ReturnValue<v8::Array>,
) {
  let Some(ctx) = ContextifyContext::get(scope, args.this()) else {
    return;
  };

  let context = ctx.context(scope);
  let Some(sandbox) = ctx.sandbox(scope) else {
    return;
  };

  let context_scope = &mut v8::ContextScope::new(scope, context);
  let Some(properties) = sandbox
    .get_property_names(context_scope, v8::GetPropertyNamesArgs::default())
  else {
    return;
  };

  rv.set(properties);
}

fn indexed_property_enumerator<'s>(
  scope: &mut v8::HandleScope<'s>,
  args: v8::PropertyCallbackArguments<'s>,
  mut rv: v8::ReturnValue<v8::Array>,
) {
  let Some(ctx) = ContextifyContext::get(scope, args.this()) else {
    return;
  };
  let context = ctx.context(scope);
  let scope = &mut v8::ContextScope::new(scope, context);
  let Some(sandbox) = ctx.sandbox(scope) else {
    return;
  };

  // By default, GetPropertyNames returns string and number property names, and
  // doesn't convert the numbers to strings.
  let Some(properties) =
    sandbox.get_property_names(scope, v8::GetPropertyNamesArgs::default())
  else {
    return;
  };

  let Ok(properties_vec) =
    serde_v8::from_v8::<Vec<serde_v8::Value>>(scope, properties.into())
  else {
    return;
  };

  let mut indices = vec![];
  for prop in properties_vec {
    if prop.v8_value.is_number() {
      indices.push(prop.v8_value);
    }
  }

  rv.set(v8::Array::new_with_elements(scope, &indices));
}

fn uint32_to_name<'s>(
  scope: &mut v8::HandleScope<'s>,
  index: u32,
) -> v8::Local<'s, v8::Name> {
  let int = v8::Integer::new_from_unsigned(scope, index);
  let u32 = v8::Local::<v8::Uint32>::try_from(int).unwrap();
  u32.to_string(scope).unwrap().into()
}

fn indexed_property_query<'s>(
  scope: &mut v8::HandleScope<'s>,
  index: u32,
  args: v8::PropertyCallbackArguments<'s>,
  rv: v8::ReturnValue<v8::Integer>,
) -> v8::Intercepted {
  let name = uint32_to_name(scope, index);
  property_query(scope, name, args, rv)
}

fn indexed_property_getter<'s>(
  scope: &mut v8::HandleScope<'s>,
  index: u32,
  args: v8::PropertyCallbackArguments<'s>,
  rv: v8::ReturnValue,
) -> v8::Intercepted {
  let key = uint32_to_name(scope, index);
  property_getter(scope, key, args, rv)
}

fn indexed_property_setter<'s>(
  scope: &mut v8::HandleScope<'s>,
  index: u32,
  value: v8::Local<'s, v8::Value>,
  args: v8::PropertyCallbackArguments<'s>,
  rv: v8::ReturnValue<()>,
) -> v8::Intercepted {
  let key = uint32_to_name(scope, index);
  property_setter(scope, key, value, args, rv)
}

fn indexed_property_descriptor<'s>(
  scope: &mut v8::HandleScope<'s>,
  index: u32,
  args: v8::PropertyCallbackArguments<'s>,
  rv: v8::ReturnValue,
) -> v8::Intercepted {
  let key = uint32_to_name(scope, index);
  property_descriptor(scope, key, args, rv)
}

fn indexed_property_definer<'s>(
  scope: &mut v8::HandleScope<'s>,
  index: u32,
  descriptor: &v8::PropertyDescriptor,
  args: v8::PropertyCallbackArguments<'s>,
  rv: v8::ReturnValue<()>,
) -> v8::Intercepted {
  let key = uint32_to_name(scope, index);
  property_definer(scope, key, descriptor, args, rv)
}

fn indexed_property_deleter<'s>(
  scope: &mut v8::HandleScope<'s>,
  index: u32,
  args: v8::PropertyCallbackArguments<'s>,
  mut rv: v8::ReturnValue<v8::Boolean>,
) -> v8::Intercepted {
  let Some(ctx) = ContextifyContext::get(scope, args.this()) else {
    return v8::Intercepted::No;
  };

  let context = ctx.context(scope);
  let Some(sandbox) = ctx.sandbox(scope) else {
    return v8::Intercepted::No;
  };

  let context_scope = &mut v8::ContextScope::new(scope, context);
  if !sandbox.delete_index(context_scope, index).unwrap_or(false) {
    return v8::Intercepted::No;
  }

  // Delete failed on the sandbox, intercept and do not delete on
  // the global object.
  rv.set_bool(false);
  v8::Intercepted::No
}

#[allow(clippy::too_many_arguments)]
#[op2]
#[serde]
pub fn op_vm_create_script<'a>(
  scope: &mut v8::HandleScope<'a>,
  state: &mut OpState,
  source: v8::Local<'a, v8::String>,
  filename: v8::Local<'a, v8::Value>,
  line_offset: i32,
  column_offset: i32,
  #[buffer] cached_data: Option<JsBuffer>,
  produce_cached_data: bool,
  parsing_context: Option<v8::Local<'a, v8::Object>>,
) -> Option<CompileResult<'a>> {
  if state
    .borrow_mut::<PermissionsContainer>()
    .check_run_all("node:vm")
    .is_err()
  {
    return None;
  }

  ContextifyScript::create(
    scope,
    source,
    filename,
    line_offset,
    column_offset,
    cached_data,
    produce_cached_data,
    parsing_context,
  )
}

#[op2(reentrant)]
pub fn op_vm_script_run_in_context<'a>(
  scope: &mut v8::HandleScope<'a>,
  state: &mut OpState,
  #[cppgc] script: &ContextifyScript,
  sandbox: Option<v8::Local<'a, v8::Object>>,
  #[serde] timeout: i64,
  display_errors: bool,
  break_on_sigint: bool,
) -> Option<v8::Local<'a, v8::Value>> {
  if state
    .borrow_mut::<PermissionsContainer>()
    .check_run_all("node:vm")
    .is_err()
  {
    return None;
  }

  script.run_in_context(
    scope,
    sandbox,
    timeout,
    display_errors,
    break_on_sigint,
  )
}

#[allow(clippy::too_many_arguments)]
#[op2(fast)]
pub fn op_vm_create_context(
  scope: &mut v8::HandleScope,
  state: &mut OpState,
  sandbox_obj: v8::Local<v8::Object>,
  #[string] name: String,
  #[string] origin: String,
  allow_code_gen_strings: bool,
  allow_code_gen_wasm: bool,
  own_microtask_queue: bool,
) {
  if state
    .borrow_mut::<PermissionsContainer>()
    .check_run_all("node:vm")
    .is_err()
  {
    return;
  }

  // Don't allow contextifying a sandbox multiple times.
  assert!(!ContextifyContext::is_contextify_context(
    scope,
    sandbox_obj
  ));

  ContextifyContext::attach(
    scope,
    sandbox_obj,
    name,
    origin,
    allow_code_gen_strings,
    allow_code_gen_wasm,
    own_microtask_queue,
  );
}

#[op2(fast)]
pub fn op_vm_is_context(
  scope: &mut v8::HandleScope,
  state: &mut OpState,
  sandbox_obj: v8::Local<v8::Value>,
) -> Result<bool, deno_core::error::AnyError> {
  state
    .borrow_mut::<PermissionsContainer>()
    .check_run_all("node:vm")?;

  Ok(
    sandbox_obj
      .try_into()
      .map(|sandbox_obj| {
        ContextifyContext::is_contextify_context(scope, sandbox_obj)
      })
      .unwrap_or(false),
  )
}

#[derive(serde::Serialize)]
struct CompileResult<'s> {
  value: serde_v8::Value<'s>,
  cached_data: Option<serde_v8::Value<'s>>,
  cached_data_rejected: bool,
  cached_data_produced: bool,
}

#[allow(clippy::too_many_arguments)]
#[op2]
#[serde]
pub fn op_vm_compile_function<'s>(
  scope: &mut v8::HandleScope<'s>,
  state: &mut OpState,
  source: v8::Local<'s, v8::String>,
  filename: v8::Local<'s, v8::Value>,
  line_offset: i32,
  column_offset: i32,
  #[buffer] cached_data: Option<JsBuffer>,
  produce_cached_data: bool,
  parsing_context: Option<v8::Local<'s, v8::Object>>,
  context_extensions: Option<v8::Local<'s, v8::Array>>,
  params: Option<v8::Local<'s, v8::Array>>,
) -> Option<CompileResult<'s>> {
  if state
    .borrow_mut::<PermissionsContainer>()
    .check_run_all("node:vm")
    .is_err()
  {
    return None;
  }

  let context = if let Some(parsing_context) = parsing_context {
    let Some(context) =
      ContextifyContext::from_sandbox_obj(scope, parsing_context)
    else {
      let message = v8::String::new(scope, "Invalid sandbox object").unwrap();
      let exception = v8::Exception::type_error(scope, message);
      scope.throw_exception(exception);
      return None;
    };
    context.context(scope)
  } else {
    scope.get_current_context()
  };

  let scope = &mut v8::ContextScope::new(scope, context);
  let host_defined_options = create_host_defined_options(scope);
  let origin = v8::ScriptOrigin::new(
    scope,
    filename,
    line_offset,
    column_offset,
    true,
    -1,
    None,
    false,
    false,
    false,
    Some(host_defined_options),
  );

  let mut source = if let Some(cached_data) = cached_data {
    let cached_data = v8::script_compiler::CachedData::new(&cached_data);
    v8::script_compiler::Source::new_with_cached_data(
      source,
      Some(&origin),
      cached_data,
    )
  } else {
    v8::script_compiler::Source::new(source, Some(&origin))
  };

  let context_extensions = if let Some(context_extensions) = context_extensions
  {
    let mut exts = Vec::with_capacity(context_extensions.length() as _);
    for i in 0..context_extensions.length() {
      let ext = context_extensions.get_index(scope, i)?.try_into().ok()?;
      exts.push(ext);
    }
    exts
  } else {
    vec![]
  };

  let params = if let Some(params) = params {
    let mut exts = Vec::with_capacity(params.length() as _);
    for i in 0..params.length() {
      let ext = params.get_index(scope, i)?.try_into().ok()?;
      exts.push(ext);
    }
    exts
  } else {
    vec![]
  };

  let options = if source.get_cached_data().is_some() {
    v8::script_compiler::CompileOptions::ConsumeCodeCache
  } else {
    v8::script_compiler::CompileOptions::NoCompileOptions
  };

  let scope = &mut v8::TryCatch::new(scope);

  let Some(function) = v8::script_compiler::compile_function(
    scope,
    &mut source,
    &params,
    &context_extensions,
    options,
    v8::script_compiler::NoCacheReason::NoReason,
  ) else {
    if scope.has_caught() && !scope.has_terminated() {
      scope.rethrow();
    }
    return None;
  };

  let cached_data = if produce_cached_data {
    function.create_code_cache()
  } else {
    None
  };

  Some(CompileResult {
    value: serde_v8::Value {
      v8_value: function.into(),
    },
    cached_data: cached_data.as_ref().map(|c| {
      let backing_store =
        v8::ArrayBuffer::new_backing_store_from_vec(c.to_vec());
      v8::ArrayBuffer::with_backing_store(scope, &backing_store.make_shared())
        .into()
    }),
    cached_data_rejected: source
      .get_cached_data()
      .map(|c| c.rejected())
      .unwrap_or(false),
    cached_data_produced: cached_data.is_some(),
  })
}

#[op2]
pub fn op_vm_script_get_source_map_url<'s>(
  scope: &mut v8::HandleScope<'s>,
  state: &mut OpState,
  #[cppgc] script: &ContextifyScript,
) -> Result<v8::Local<'s, v8::Value>, deno_core::error::AnyError> {
  state
    .borrow_mut::<PermissionsContainer>()
    .check_run_all("node:vm")?;

  let unbound_script = script.script.get(scope).unwrap();
  Ok(unbound_script.get_source_mapping_url(scope))
}

#[op2]
pub fn op_vm_script_create_cached_data<'s>(
  scope: &mut v8::HandleScope<'s>,
  state: &mut OpState,
  #[cppgc] script: &ContextifyScript,
) -> Result<v8::Local<'s, v8::Value>, deno_core::error::AnyError> {
  state
    .borrow_mut::<PermissionsContainer>()
    .check_run_all("node:vm")?;

  let unbound_script = script.script.get(scope).unwrap();
  let data = match unbound_script.create_code_cache() {
    Some(c) => c.to_vec(),
    None => vec![],
  };
  let backing_store = v8::ArrayBuffer::new_backing_store_from_vec(data);
  Ok(
    v8::ArrayBuffer::with_backing_store(scope, &backing_store.make_shared())
      .into(),
  )
}
