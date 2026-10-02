// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use deno_core::op2;
use deno_core::v8;
use deno_core::FastString;
use deno_core::GarbageCollected;
use deno_core::ToJsBuffer;
use std::ptr::NonNull;
use v8::ValueDeserializerHelper;
use v8::ValueSerializerHelper;

#[op2(fast)]
pub fn op_v8_cached_data_version_tag() -> u32 {
  v8::script_compiler::cached_data_version_tag()
}

#[op2(fast)]
pub fn op_v8_get_heap_statistics(
  scope: &mut v8::HandleScope,
  #[buffer] buffer: &mut [f64],
) {
  let mut stats = v8::HeapStatistics::default();
  scope.get_heap_statistics(&mut stats);

  buffer[0] = stats.total_heap_size() as f64;
  buffer[1] = stats.total_heap_size_executable() as f64;
  buffer[2] = stats.total_physical_size() as f64;
  buffer[3] = stats.total_available_size() as f64;
  buffer[4] = stats.used_heap_size() as f64;
  buffer[5] = stats.heap_size_limit() as f64;
  buffer[6] = stats.malloced_memory() as f64;
  buffer[7] = stats.peak_malloced_memory() as f64;
  buffer[8] = stats.does_zap_garbage() as f64;
  buffer[9] = stats.number_of_native_contexts() as f64;
  buffer[10] = stats.number_of_detached_contexts() as f64;
  buffer[11] = stats.total_global_handles_size() as f64;
  buffer[12] = stats.used_global_handles_size() as f64;
  buffer[13] = stats.external_memory() as f64;
}

pub struct Serializer<'a> {
  inner: v8::ValueSerializer<'a>,
}

pub struct SerializerDelegate {
  obj: v8::Global<v8::Object>,
}

impl<'a> v8::cppgc::GarbageCollected for Serializer<'a> {
  fn trace(&self, _visitor: &v8::cppgc::Visitor) {}
}

impl SerializerDelegate {
  fn obj<'s>(
    &self,
    scope: &mut v8::HandleScope<'s>,
  ) -> v8::Local<'s, v8::Object> {
    v8::Local::new(scope, &self.obj)
  }
}

impl v8::ValueSerializerImpl for SerializerDelegate {
  fn get_shared_array_buffer_id<'s>(
    &self,
    scope: &mut v8::HandleScope<'s>,
    shared_array_buffer: v8::Local<'s, v8::SharedArrayBuffer>,
  ) -> Option<u32> {
    let obj = self.obj(scope);
    let key = FastString::from_static("_getSharedArrayBufferId")
      .v8_string(scope)
      .into();
    if let Some(v) = obj.get(scope, key) {
      if let Ok(fun) = v.try_cast::<v8::Function>() {
        return fun
          .call(scope, obj.into(), &[shared_array_buffer.into()])
          .and_then(|ret| ret.uint32_value(scope));
      }
    }
    None
  }
  fn has_custom_host_object(&self, _isolate: &mut v8::Isolate) -> bool {
    false
  }
  fn throw_data_clone_error<'s>(
    &self,
    scope: &mut v8::HandleScope<'s>,
    message: v8::Local<'s, v8::String>,
  ) {
    let obj = self.obj(scope);
    let key = FastString::from_static("_getDataCloneError")
      .v8_string(scope)
      .into();
    if let Some(v) = obj.get(scope, key) {
      let fun = v
        .try_cast::<v8::Function>()
        .expect("_getDataCloneError should be a function");
      if let Some(error) = fun.call(scope, obj.into(), &[message.into()]) {
        scope.throw_exception(error);
        return;
      }
    }
    let error = v8::Exception::type_error(scope, message);
    scope.throw_exception(error);
  }

  fn write_host_object<'s>(
    &self,
    scope: &mut v8::HandleScope<'s>,
    object: v8::Local<'s, v8::Object>,
    _value_serializer: &dyn ValueSerializerHelper,
  ) -> Option<bool> {
    let obj = self.obj(scope);
    let key = FastString::from_static("_writeHostObject")
      .v8_string(scope)
      .into();
    if let Some(v) = obj.get(scope, key) {
      if let Ok(v) = v.try_cast::<v8::Function>() {
        v.call(scope, obj.into(), &[object.into()])?;
        return Some(true);
      }
    }

    None
  }

  fn is_host_object<'s>(
    &self,
    _scope: &mut v8::HandleScope<'s>,
    _object: v8::Local<'s, v8::Object>,
  ) -> Option<bool> {
    // should never be called because has_custom_host_object returns false
    None
  }
}

#[op2]
#[cppgc]
pub fn op_v8_new_serializer(
  scope: &mut v8::HandleScope,
  obj: v8::Local<v8::Object>,
) -> Serializer<'static> {
  let obj = v8::Global::new(scope, obj);
  let inner =
    v8::ValueSerializer::new(scope, Box::new(SerializerDelegate { obj }));
  Serializer { inner }
}

#[op2(fast)]
pub fn op_v8_set_treat_array_buffer_views_as_host_objects(
  #[cppgc] ser: &Serializer,
  value: bool,
) {
  ser
    .inner
    .set_treat_array_buffer_views_as_host_objects(value);
}

#[op2]
#[serde]
pub fn op_v8_release_buffer(#[cppgc] ser: &Serializer) -> ToJsBuffer {
  ser.inner.release().into()
}

#[op2(fast)]
pub fn op_v8_transfer_array_buffer(
  #[cppgc] ser: &Serializer,
  #[smi] id: u32,
  array_buffer: v8::Local<v8::ArrayBuffer>,
) {
  ser.inner.transfer_array_buffer(id, array_buffer);
}

#[op2(fast)]
pub fn op_v8_write_double(#[cppgc] ser: &Serializer, double: f64) {
  ser.inner.write_double(double);
}

#[op2(fast)]
pub fn op_v8_write_header(#[cppgc] ser: &Serializer) {
  ser.inner.write_header();
}

#[op2]
pub fn op_v8_write_raw_bytes(
  #[cppgc] ser: &Serializer,
  #[anybuffer] source: &[u8],
) {
  ser.inner.write_raw_bytes(source);
}

#[op2(fast)]
pub fn op_v8_write_uint32(#[cppgc] ser: &Serializer, num: u32) {
  ser.inner.write_uint32(num);
}

#[op2(fast)]
pub fn op_v8_write_uint64(#[cppgc] ser: &Serializer, hi: u32, lo: u32) {
  let num = ((hi as u64) << 32) | (lo as u64);
  ser.inner.write_uint64(num);
}

#[op2(nofast, reentrant)]
pub fn op_v8_write_value(
  scope: &mut v8::HandleScope,
  #[cppgc] ser: &Serializer,
  value: v8::Local<v8::Value>,
) {
  let context = scope.get_current_context();
  ser.inner.write_value(context, value);
}

struct DeserBuffer {
  ptr: Option<NonNull<u8>>,
  // Hold onto backing store to keep the underlying buffer
  // alive while we hold a reference to it.
  _backing_store: v8::SharedRef<v8::BackingStore>,
}

pub struct Deserializer<'a> {
  buf: DeserBuffer,
  inner: v8::ValueDeserializer<'a>,
}

impl<'a> deno_core::GarbageCollected for Deserializer<'a> {}

pub struct DeserializerDelegate {
  obj: v8::Global<v8::Object>,
}

impl GarbageCollected for DeserializerDelegate {
  fn trace(&self, _visitor: &v8::cppgc::Visitor) {}
}

impl v8::ValueDeserializerImpl for DeserializerDelegate {
  fn read_host_object<'s>(
    &self,
    scope: &mut v8::HandleScope<'s>,
    _value_deserializer: &dyn v8::ValueDeserializerHelper,
  ) -> Option<v8::Local<'s, v8::Object>> {
    let obj = v8::Local::new(scope, &self.obj);
    let key = FastString::from_static("_readHostObject")
      .v8_string(scope)
      .into();
    let scope = &mut v8::AllowJavascriptExecutionScope::new(scope);
    if let Some(v) = obj.get(scope, key) {
      if let Ok(v) = v.try_cast::<v8::Function>() {
        let result = v.call(scope, obj.into(), &[])?;
        match result.try_cast() {
          Ok(res) => return Some(res),
          Err(_) => {
            let msg =
              FastString::from_static("readHostObject must return an object")
                .v8_string(scope);
            let error = v8::Exception::type_error(scope, msg);
            scope.throw_exception(error);
            return None;
          }
        }
      }
    }
    None
  }
}

#[op2]
#[cppgc]
pub fn op_v8_new_deserializer(
  scope: &mut v8::HandleScope,
  obj: v8::Local<v8::Object>,
  buffer: v8::Local<v8::ArrayBufferView>,
) -> Result<Deserializer<'static>, deno_core::error::AnyError> {
  let offset = buffer.byte_offset();
  let len = buffer.byte_length();
  let backing_store = buffer.get_backing_store().ok_or_else(|| {
    deno_core::error::generic_error(
      "deserialization buffer has no backing store",
    )
  })?;
  let (buf_slice, buf_ptr) = if let Some(data) = backing_store.data() {
    // SAFETY: the offset is valid for the underlying buffer because we're getting it directly from v8
    let data_ptr = unsafe { data.as_ptr().cast::<u8>().add(offset) };
    (
      // SAFETY: the len is valid, from v8, and the data_ptr is valid (as above)
      unsafe { std::slice::from_raw_parts(data_ptr.cast_const().cast(), len) },
      Some(data.cast()),
    )
  } else {
    (&[] as &[u8], None::<NonNull<u8>>)
  };
  let obj = v8::Global::new(scope, obj);
  let inner = v8::ValueDeserializer::new(
    scope,
    Box::new(DeserializerDelegate { obj }),
    buf_slice,
  );
  Ok(Deserializer {
    inner,
    buf: DeserBuffer {
      _backing_store: backing_store,
      ptr: buf_ptr,
    },
  })
}

#[op2(fast)]
pub fn op_v8_transfer_array_buffer_de(
  #[cppgc] deser: &Deserializer,
  #[smi] id: u32,
  array_buffer: v8::Local<v8::ArrayBuffer>,
) {
  // TODO(nathanwhit): also need binding for TransferSharedArrayBuffer, then call that if
  // array_buffer is shared
  deser.inner.transfer_array_buffer(id, array_buffer);
}

#[op2(fast)]
pub fn op_v8_read_double(
  #[cppgc] deser: &Deserializer,
) -> Result<f64, deno_core::error::AnyError> {
  let mut double = 0f64;
  if !deser.inner.read_double(&mut double) {
    return Err(deno_core::error::type_error("ReadDouble() failed"));
  }
  Ok(double)
}

#[op2(nofast)]
pub fn op_v8_read_header(
  scope: &mut v8::HandleScope,
  #[cppgc] deser: &Deserializer,
) -> bool {
  let context = scope.get_current_context();
  let res = deser.inner.read_header(context);
  res.unwrap_or_default()
}

#[op2(fast)]
#[number]
pub fn op_v8_read_raw_bytes(
  #[cppgc] deser: &Deserializer,
  #[number] length: usize,
) -> usize {
  let Some(buf_ptr) = deser.buf.ptr else {
    return 0;
  };
  if let Some(buf) = deser.inner.read_raw_bytes(length) {
    let ptr = buf.as_ptr();
    (ptr as usize) - (buf_ptr.as_ptr() as usize)
  } else {
    0
  }
}

#[op2(fast)]
pub fn op_v8_read_uint32(
  #[cppgc] deser: &Deserializer,
) -> Result<u32, deno_core::error::AnyError> {
  let mut value = 0;
  if !deser.inner.read_uint32(&mut value) {
    return Err(deno_core::error::type_error("ReadUint32() failed"));
  }

  Ok(value)
}

#[op2]
#[serde]
pub fn op_v8_read_uint64(
  #[cppgc] deser: &Deserializer,
) -> Result<(u32, u32), deno_core::error::AnyError> {
  let mut val = 0;
  if !deser.inner.read_uint64(&mut val) {
    return Err(deno_core::error::type_error("ReadUint64() failed"));
  }

  Ok(((val >> 32) as u32, val as u32))
}

#[op2(fast)]
pub fn op_v8_get_wire_format_version(#[cppgc] deser: &Deserializer) -> u32 {
  deser.inner.get_wire_format_version()
}

#[op2(reentrant)]
pub fn op_v8_read_value<'s>(
  scope: &mut v8::HandleScope<'s>,
  #[cppgc] deser: &Deserializer,
) -> v8::Local<'s, v8::Value> {
  let context = scope.get_current_context();
  let val = deser.inner.read_value(context);
  val.unwrap_or_else(|| v8::null(scope).into())
}
