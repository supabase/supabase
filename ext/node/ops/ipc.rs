// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

pub use impl_::*;

pub struct ChildPipeFd(pub i64);

mod impl_ {
  use std::cell::RefCell;
  use std::future::Future;
  use std::io;
  use std::mem;
  use std::pin::Pin;
  use std::rc::Rc;
  use std::sync::atomic::AtomicBool;
  use std::sync::atomic::AtomicUsize;
  use std::task::ready;
  use std::task::Context;
  use std::task::Poll;

  use deno_core::op2;
  use deno_core::serde;
  use deno_core::serde::Serializer;
  use deno_core::serde_json;
  use deno_core::v8;
  use deno_core::AsyncRefCell;
  use deno_core::CancelFuture;
  use deno_core::CancelHandle;
  use deno_core::ExternalOpsTracker;
  use deno_core::OpState;
  use deno_core::RcRef;
  use deno_core::ResourceId;
  use deno_core::ToV8;
  use memchr::memchr;
  use pin_project_lite::pin_project;
  use serde::Serialize;
  use tokio::io::AsyncRead;
  use tokio::io::AsyncWriteExt;
  use tokio::io::ReadBuf;

  use deno_io::BiPipe;
  use deno_io::BiPipeRead;
  use deno_io::BiPipeWrite;

  /// Wrapper around v8 value that implements Serialize.
  struct SerializeWrapper<'a, 'b>(
    RefCell<&'b mut v8::HandleScope<'a>>,
    v8::Local<'a, v8::Value>,
  );

  impl<'a, 'b> Serialize for SerializeWrapper<'a, 'b> {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
      S: Serializer,
    {
      serialize_v8_value(*self.0.borrow_mut(), self.1, serializer)
    }
  }

  /// Serialize a v8 value directly into a serde serializer.
  /// This allows us to go from v8 values to JSON without having to
  /// deserialize into a `serde_json::Value` and then reserialize to JSON
  fn serialize_v8_value<'a, S: Serializer>(
    scope: &mut v8::HandleScope<'a>,
    value: v8::Local<'a, v8::Value>,
    ser: S,
  ) -> Result<S::Ok, S::Error> {
    use serde::ser::Error;
    if value.is_null_or_undefined() {
      ser.serialize_unit()
    } else if value.is_number() || value.is_number_object() {
      let num_value = value.number_value(scope).unwrap();
      if (num_value as i64 as f64) == num_value {
        ser.serialize_i64(num_value as i64)
      } else {
        ser.serialize_f64(num_value)
      }
    } else if value.is_string() {
      let str = deno_core::serde_v8::to_utf8(value.try_into().unwrap(), scope);
      ser.serialize_str(&str)
    } else if value.is_string_object() {
      let str = deno_core::serde_v8::to_utf8(
        value.to_string(scope).ok_or_else(|| {
          S::Error::custom(deno_core::error::generic_error(
            "toString on string object failed",
          ))
        })?,
        scope,
      );
      ser.serialize_str(&str)
    } else if value.is_boolean() {
      ser.serialize_bool(value.is_true())
    } else if value.is_boolean_object() {
      ser.serialize_bool(value.boolean_value(scope))
    } else if value.is_array() {
      use serde::ser::SerializeSeq;
      let array = value.cast::<v8::Array>();
      let length = array.length();
      let mut seq = ser.serialize_seq(Some(length as usize))?;
      for i in 0..length {
        let element = array.get_index(scope, i).unwrap();
        seq
          .serialize_element(&SerializeWrapper(RefCell::new(scope), element))?;
      }
      seq.end()
    } else if value.is_object() {
      use serde::ser::SerializeMap;
      if value.is_array_buffer_view() {
        let buffer = value.cast::<v8::ArrayBufferView>();
        let mut buf = vec![0u8; buffer.byte_length()];
        let copied = buffer.copy_contents(&mut buf);
        debug_assert_eq!(copied, buf.len());
        return ser.serialize_bytes(&buf);
      }
      let object = value.cast::<v8::Object>();
      // node uses `JSON.stringify`, so to match its behavior (and allow serializing custom objects)
      // we need to respect the `toJSON` method if it exists.
      let to_json_key = v8::String::new_from_utf8(
        scope,
        b"toJSON",
        v8::NewStringType::Internalized,
      )
      .unwrap()
      .into();
      if let Some(to_json) = object.get(scope, to_json_key) {
        if let Ok(to_json) = to_json.try_cast::<v8::Function>() {
          let json_value = to_json.call(scope, object.into(), &[]).unwrap();
          return serialize_v8_value(scope, json_value, ser);
        }
      }

      let keys = object
        .get_own_property_names(
          scope,
          v8::GetPropertyNamesArgs {
            ..Default::default()
          },
        )
        .unwrap();
      let num_keys = keys.length();
      let mut map = ser.serialize_map(Some(num_keys as usize))?;
      for i in 0..num_keys {
        let key = keys.get_index(scope, i).unwrap();
        let key_str = key.to_rust_string_lossy(scope);
        let value = object.get(scope, key).unwrap();
        if value.is_undefined() {
          continue;
        }
        map.serialize_entry(
          &key_str,
          &SerializeWrapper(RefCell::new(scope), value),
        )?;
      }
      map.end()
    } else {
      // TODO(nathanwhit): better error message
      Err(S::Error::custom(deno_core::error::type_error(format!(
        "Unsupported type: {}",
        value.type_repr()
      ))))
    }
  }

  // Open IPC pipe from bootstrap options.
  #[op2]
  #[smi]
  pub fn op_node_child_ipc_pipe(
    state: &mut OpState,
  ) -> Result<Option<ResourceId>, io::Error> {
    let fd = match state.try_borrow_mut::<crate::ChildPipeFd>() {
      Some(child_pipe_fd) => child_pipe_fd.0,
      None => return Ok(None),
    };
    let ref_tracker = IpcRefTracker::new(state.external_ops_tracker.clone());
    Ok(Some(
      state
        .resource_table
        .add(IpcJsonStreamResource::new(fd, ref_tracker)?),
    ))
  }

  #[derive(Debug, thiserror::Error)]
  pub enum IpcError {
    #[error(transparent)]
    Resource(deno_core::error::AnyError),
    #[error(transparent)]
    IpcJsonStream(#[from] IpcJsonStreamError),
    #[error(transparent)]
    Canceled(#[from] deno_core::Canceled),
    #[error("failed to serialize json value: {0}")]
    SerdeJson(serde_json::Error),
  }

  #[op2(async)]
  pub fn op_node_ipc_write<'a>(
    scope: &mut v8::HandleScope<'a>,
    state: Rc<RefCell<OpState>>,
    #[smi] rid: ResourceId,
    value: v8::Local<'a, v8::Value>,
    // using an array as an "out parameter".
    // index 0 is a boolean indicating whether the queue is under the limit.
    //
    // ideally we would just return `Result<(impl Future, bool), ..>`, but that's not
    // supported by `op2` currently.
    queue_ok: v8::Local<'a, v8::Array>,
  ) -> Result<impl Future<Output = Result<(), io::Error>>, IpcError> {
    let mut serialized = Vec::with_capacity(64);
    let mut ser = serde_json::Serializer::new(&mut serialized);
    serialize_v8_value(scope, value, &mut ser).map_err(IpcError::SerdeJson)?;
    serialized.push(b'\n');

    let stream = state
      .borrow()
      .resource_table
      .get::<IpcJsonStreamResource>(rid)
      .map_err(IpcError::Resource)?;
    let old = stream
      .queued_bytes
      .fetch_add(serialized.len(), std::sync::atomic::Ordering::Relaxed);
    if old + serialized.len() > 2 * INITIAL_CAPACITY {
      // sending messages too fast
      let v = false.to_v8(scope).unwrap(); // Infallible
      queue_ok.set_index(scope, 0, v);
    }
    Ok(async move {
      let cancel = stream.cancel.clone();
      let result = stream
        .clone()
        .write_msg_bytes(&serialized)
        .or_cancel(cancel)
        .await;
      // adjust count even on error
      stream
        .queued_bytes
        .fetch_sub(serialized.len(), std::sync::atomic::Ordering::Relaxed);
      result??;
      Ok(())
    })
  }

  /// Value signaling that the other end ipc channel has closed.
  ///
  /// Node reserves objects of this form (`{ "cmd": "NODE_<something>"`)
  /// for internal use, so we use it here as well to avoid breaking anyone.
  fn stop_sentinel() -> serde_json::Value {
    serde_json::json!({
      "cmd": "NODE_CLOSE"
    })
  }

  #[op2(async)]
  #[serde]
  pub async fn op_node_ipc_read(
    state: Rc<RefCell<OpState>>,
    #[smi] rid: ResourceId,
  ) -> Result<serde_json::Value, IpcError> {
    let stream = state
      .borrow()
      .resource_table
      .get::<IpcJsonStreamResource>(rid)
      .map_err(IpcError::Resource)?;

    let cancel = stream.cancel.clone();
    let mut stream = RcRef::map(stream, |r| &r.read_half).borrow_mut().await;
    let msgs = stream.read_msg().or_cancel(cancel).await??;
    if let Some(msg) = msgs {
      Ok(msg)
    } else {
      Ok(stop_sentinel())
    }
  }

  #[op2(fast)]
  pub fn op_node_ipc_ref(state: &mut OpState, #[smi] rid: ResourceId) {
    let stream = state
      .resource_table
      .get::<IpcJsonStreamResource>(rid)
      .expect("Invalid resource ID");
    stream.ref_tracker.ref_();
  }

  #[op2(fast)]
  pub fn op_node_ipc_unref(state: &mut OpState, #[smi] rid: ResourceId) {
    let stream = state
      .resource_table
      .get::<IpcJsonStreamResource>(rid)
      .expect("Invalid resource ID");
    stream.ref_tracker.unref();
  }

  /// Tracks whether the IPC resources is currently
  /// refed, and allows refing/unrefing it.
  pub struct IpcRefTracker {
    refed: AtomicBool,
    tracker: OpsTracker,
  }

  /// A little wrapper so we don't have to get an
  /// `ExternalOpsTracker` for tests. When we aren't
  /// cfg(test), this will get optimized out.
  enum OpsTracker {
    External(ExternalOpsTracker),
    #[cfg(test)]
    Test,
  }

  impl OpsTracker {
    fn ref_(&self) {
      match self {
        Self::External(tracker) => tracker.ref_op(),
        #[cfg(test)]
        Self::Test => {}
      }
    }

    fn unref(&self) {
      match self {
        Self::External(tracker) => tracker.unref_op(),
        #[cfg(test)]
        Self::Test => {}
      }
    }
  }

  impl IpcRefTracker {
    pub fn new(tracker: ExternalOpsTracker) -> Self {
      Self {
        refed: AtomicBool::new(false),
        tracker: OpsTracker::External(tracker),
      }
    }

    #[cfg(test)]
    fn new_test() -> Self {
      Self {
        refed: AtomicBool::new(false),
        tracker: OpsTracker::Test,
      }
    }

    fn ref_(&self) {
      if !self.refed.swap(true, std::sync::atomic::Ordering::AcqRel) {
        self.tracker.ref_();
      }
    }

    fn unref(&self) {
      if self.refed.swap(false, std::sync::atomic::Ordering::AcqRel) {
        self.tracker.unref();
      }
    }
  }

  pub struct IpcJsonStreamResource {
    read_half: AsyncRefCell<IpcJsonStream>,
    write_half: AsyncRefCell<BiPipeWrite>,
    cancel: Rc<CancelHandle>,
    queued_bytes: AtomicUsize,
    ref_tracker: IpcRefTracker,
  }

  impl deno_core::Resource for IpcJsonStreamResource {
    fn close(self: Rc<Self>) {
      self.cancel.cancel();
    }
  }

  impl IpcJsonStreamResource {
    pub fn new(
      stream: i64,
      ref_tracker: IpcRefTracker,
    ) -> Result<Self, std::io::Error> {
      let (read_half, write_half) = BiPipe::from_raw(stream as _)?.split();
      Ok(Self {
        read_half: AsyncRefCell::new(IpcJsonStream::new(read_half)),
        write_half: AsyncRefCell::new(write_half),
        cancel: Default::default(),
        queued_bytes: Default::default(),
        ref_tracker,
      })
    }

    #[cfg(all(unix, test))]
    fn from_stream(
      stream: tokio::net::UnixStream,
      ref_tracker: IpcRefTracker,
    ) -> Self {
      let (read_half, write_half) = stream.into_split();
      Self {
        read_half: AsyncRefCell::new(IpcJsonStream::new(read_half.into())),
        write_half: AsyncRefCell::new(write_half.into()),
        cancel: Default::default(),
        queued_bytes: Default::default(),
        ref_tracker,
      }
    }

    #[cfg(all(windows, test))]
    fn from_stream(
      pipe: tokio::net::windows::named_pipe::NamedPipeClient,
      ref_tracker: IpcRefTracker,
    ) -> Self {
      let (read_half, write_half) = tokio::io::split(pipe);
      Self {
        read_half: AsyncRefCell::new(IpcJsonStream::new(read_half.into())),
        write_half: AsyncRefCell::new(write_half.into()),
        cancel: Default::default(),
        queued_bytes: Default::default(),
        ref_tracker,
      }
    }

    /// writes _newline terminated_ JSON message to the IPC pipe.
    async fn write_msg_bytes(
      self: Rc<Self>,
      msg: &[u8],
    ) -> Result<(), io::Error> {
      let mut write_half =
        RcRef::map(self, |r| &r.write_half).borrow_mut().await;
      write_half.write_all(msg).await?;
      Ok(())
    }
  }

  // Initial capacity of the buffered reader and the JSON backing buffer.
  //
  // This is a tradeoff between memory usage and performance on large messages.
  //
  // 64kb has been chosen after benchmarking 64 to 66536 << 6 - 1 bytes per message.
  const INITIAL_CAPACITY: usize = 1024 * 64;

  /// A buffer for reading from the IPC pipe.
  /// Similar to the internal buffer of `tokio::io::BufReader`.
  ///
  /// This exists to provide buffered reading while granting mutable access
  /// to the internal buffer (which isn't exposed through `tokio::io::BufReader`
  /// or the `AsyncBufRead` trait). `simd_json` requires mutable access to an input
  /// buffer for parsing, so this allows us to use the read buffer directly as the
  /// input buffer without a copy (provided the message fits).
  struct ReadBuffer {
    buffer: Box<[u8]>,
    pos: usize,
    cap: usize,
  }

  impl ReadBuffer {
    fn new() -> Self {
      Self {
        buffer: vec![0; INITIAL_CAPACITY].into_boxed_slice(),
        pos: 0,
        cap: 0,
      }
    }

    fn get_mut(&mut self) -> &mut [u8] {
      &mut self.buffer
    }

    fn available_mut(&mut self) -> &mut [u8] {
      &mut self.buffer[self.pos..self.cap]
    }

    fn consume(&mut self, n: usize) {
      self.pos = std::cmp::min(self.pos + n, self.cap);
    }

    fn needs_fill(&self) -> bool {
      self.pos >= self.cap
    }
  }

  #[derive(Debug, thiserror::Error)]
  pub enum IpcJsonStreamError {
    #[error("{0}")]
    Io(#[source] std::io::Error),
    #[error("{0}")]
    SimdJson(#[source] simd_json::Error),
  }

  // JSON serialization stream over IPC pipe.
  //
  // `\n` is used as a delimiter between messages.
  struct IpcJsonStream {
    pipe: BiPipeRead,
    buffer: Vec<u8>,
    read_buffer: ReadBuffer,
  }

  impl IpcJsonStream {
    fn new(pipe: BiPipeRead) -> Self {
      Self {
        pipe,
        buffer: Vec::with_capacity(INITIAL_CAPACITY),
        read_buffer: ReadBuffer::new(),
      }
    }

    async fn read_msg(
      &mut self,
    ) -> Result<Option<serde_json::Value>, IpcJsonStreamError> {
      let mut json = None;
      let nread = read_msg_inner(
        &mut self.pipe,
        &mut self.buffer,
        &mut json,
        &mut self.read_buffer,
      )
      .await
      .map_err(IpcJsonStreamError::Io)?;
      if nread == 0 {
        // EOF.
        return Ok(None);
      }

      let json = match json {
        Some(v) => v,
        None => {
          // Took more than a single read and some buffering.
          simd_json::from_slice(&mut self.buffer[..nread])
            .map_err(IpcJsonStreamError::SimdJson)?
        }
      };

      // Safety: Same as `Vec::clear` but without the `drop_in_place` for
      // each element (nop for u8). Capacity remains the same.
      unsafe {
        self.buffer.set_len(0);
      }

      Ok(Some(json))
    }
  }

  pin_project! {
      #[must_use = "futures do nothing unless you `.await` or poll them"]
      struct ReadMsgInner<'a, R: ?Sized> {
          reader: &'a mut R,
          buf: &'a mut Vec<u8>,
          json: &'a mut Option<serde_json::Value>,
          // The number of bytes appended to buf. This can be less than buf.len() if
          // the buffer was not empty when the operation was started.
          read: usize,
          read_buffer: &'a mut ReadBuffer,
      }
  }

  fn read_msg_inner<'a, R>(
    reader: &'a mut R,
    buf: &'a mut Vec<u8>,
    json: &'a mut Option<serde_json::Value>,
    read_buffer: &'a mut ReadBuffer,
  ) -> ReadMsgInner<'a, R>
  where
    R: AsyncRead + ?Sized + Unpin,
  {
    ReadMsgInner {
      reader,
      buf,
      json,
      read: 0,
      read_buffer,
    }
  }

  fn read_msg_internal<R: AsyncRead + ?Sized>(
    mut reader: Pin<&mut R>,
    cx: &mut Context<'_>,
    buf: &mut Vec<u8>,
    read_buffer: &mut ReadBuffer,
    json: &mut Option<serde_json::Value>,
    read: &mut usize,
  ) -> Poll<io::Result<usize>> {
    loop {
      let (done, used) = {
        // effectively a tiny `poll_fill_buf`, but allows us to get a mutable reference to the buffer.
        if read_buffer.needs_fill() {
          let mut read_buf = ReadBuf::new(read_buffer.get_mut());
          ready!(reader.as_mut().poll_read(cx, &mut read_buf))?;
          read_buffer.cap = read_buf.filled().len();
          read_buffer.pos = 0;
        }
        let available = read_buffer.available_mut();
        if let Some(i) = memchr(b'\n', available) {
          if *read == 0 {
            // Fast path: parse and put into the json slot directly.
            json.replace(
              simd_json::from_slice(&mut available[..i + 1])
                .map_err(|e| io::Error::new(io::ErrorKind::InvalidData, e))?,
            );
          } else {
            // This is not the first read, so we have to copy the data
            // to make it contiguous.
            buf.extend_from_slice(&available[..=i]);
          }
          (true, i + 1)
        } else {
          buf.extend_from_slice(available);
          (false, available.len())
        }
      };

      read_buffer.consume(used);
      *read += used;
      if done || used == 0 {
        return Poll::Ready(Ok(mem::replace(read, 0)));
      }
    }
  }

  impl<R: AsyncRead + ?Sized + Unpin> Future for ReadMsgInner<'_, R> {
    type Output = io::Result<usize>;

    fn poll(self: Pin<&mut Self>, cx: &mut Context<'_>) -> Poll<Self::Output> {
      let me = self.project();
      read_msg_internal(
        Pin::new(*me.reader),
        cx,
        me.buf,
        me.read_buffer,
        me.json,
        me.read,
      )
    }
  }

  #[cfg(test)]
  mod tests {
    use super::IpcJsonStreamResource;
    use deno_core::serde_json::json;
    use deno_core::v8;
    use deno_core::JsRuntime;
    use deno_core::RcRef;
    use deno_core::RuntimeOptions;
    use std::rc::Rc;

    #[allow(clippy::unused_async)]
    #[cfg(unix)]
    pub async fn pair() -> (Rc<IpcJsonStreamResource>, tokio::net::UnixStream) {
      let (a, b) = tokio::net::UnixStream::pair().unwrap();

      /* Similar to how ops would use the resource */
      let a = Rc::new(IpcJsonStreamResource::from_stream(
        a,
        super::IpcRefTracker::new_test(),
      ));
      (a, b)
    }

    #[cfg(windows)]
    pub async fn pair() -> (
      Rc<IpcJsonStreamResource>,
      tokio::net::windows::named_pipe::NamedPipeServer,
    ) {
      use tokio::net::windows::named_pipe::ClientOptions;
      use tokio::net::windows::named_pipe::ServerOptions;

      let name =
        format!(r"\\.\pipe\deno-named-pipe-test-{}", rand::random::<u32>());

      let server = ServerOptions::new().create(name.clone()).unwrap();
      let client = ClientOptions::new().open(name).unwrap();

      server.connect().await.unwrap();
      /* Similar to how ops would use the resource */
      let client = Rc::new(IpcJsonStreamResource::from_stream(
        client,
        super::IpcRefTracker::new_test(),
      ));
      (client, server)
    }

    #[allow(clippy::print_stdout)]
    #[tokio::test]
    async fn bench_ipc() -> Result<(), Box<dyn std::error::Error>> {
      // A simple round trip benchmark for quick dev feedback.
      //
      // Only ran when the env var is set.
      if std::env::var_os("BENCH_IPC_DENO").is_none() {
        return Ok(());
      }

      let (ipc, mut fd2) = pair().await;
      let child = tokio::spawn(async move {
        use tokio::io::AsyncWriteExt;

        let size = 1024 * 1024;

        let stri = "x".repeat(size);
        let data = format!("\"{}\"\n", stri);
        for _ in 0..100 {
          fd2.write_all(data.as_bytes()).await?;
        }
        Ok::<_, std::io::Error>(())
      });

      let start = std::time::Instant::now();
      let mut bytes = 0;

      let mut ipc = RcRef::map(ipc, |r| &r.read_half).borrow_mut().await;
      loop {
        let Some(msgs) = ipc.read_msg().await? else {
          break;
        };
        bytes += msgs.as_str().unwrap().len();
        if start.elapsed().as_secs() > 5 {
          break;
        }
      }
      let elapsed = start.elapsed();
      let mb = bytes as f64 / 1024.0 / 1024.0;
      println!("{} mb/s", mb / elapsed.as_secs_f64());

      child.await??;

      Ok(())
    }

    #[tokio::test]
    async fn unix_ipc_json() -> Result<(), Box<dyn std::error::Error>> {
      let (ipc, mut fd2) = pair().await;
      let child = tokio::spawn(async move {
        use tokio::io::AsyncReadExt;
        use tokio::io::AsyncWriteExt;

        const EXPECTED: &[u8] = b"\"hello\"\n";
        let mut buf = [0u8; EXPECTED.len()];
        let n = fd2.read_exact(&mut buf).await?;
        assert_eq!(&buf[..n], EXPECTED);
        fd2.write_all(b"\"world\"\n").await?;

        Ok::<_, std::io::Error>(())
      });

      ipc
        .clone()
        .write_msg_bytes(&json_to_bytes(json!("hello")))
        .await?;

      let mut ipc = RcRef::map(ipc, |r| &r.read_half).borrow_mut().await;
      let msgs = ipc.read_msg().await?.unwrap();
      assert_eq!(msgs, json!("world"));

      child.await??;

      Ok(())
    }

    fn json_to_bytes(v: deno_core::serde_json::Value) -> Vec<u8> {
      let mut buf = deno_core::serde_json::to_vec(&v).unwrap();
      buf.push(b'\n');
      buf
    }

    #[tokio::test]
    async fn unix_ipc_json_multi() -> Result<(), Box<dyn std::error::Error>> {
      let (ipc, mut fd2) = pair().await;
      let child = tokio::spawn(async move {
        use tokio::io::AsyncReadExt;
        use tokio::io::AsyncWriteExt;

        const EXPECTED: &[u8] = b"\"hello\"\n\"world\"\n";
        let mut buf = [0u8; EXPECTED.len()];
        let n = fd2.read_exact(&mut buf).await?;
        assert_eq!(&buf[..n], EXPECTED);
        fd2.write_all(b"\"foo\"\n\"bar\"\n").await?;
        Ok::<_, std::io::Error>(())
      });

      ipc
        .clone()
        .write_msg_bytes(&json_to_bytes(json!("hello")))
        .await?;
      ipc
        .clone()
        .write_msg_bytes(&json_to_bytes(json!("world")))
        .await?;

      let mut ipc = RcRef::map(ipc, |r| &r.read_half).borrow_mut().await;
      let msgs = ipc.read_msg().await?.unwrap();
      assert_eq!(msgs, json!("foo"));

      child.await??;

      Ok(())
    }

    #[tokio::test]
    async fn unix_ipc_json_invalid() -> Result<(), Box<dyn std::error::Error>> {
      let (ipc, mut fd2) = pair().await;
      let child = tokio::spawn(async move {
        tokio::io::AsyncWriteExt::write_all(&mut fd2, b"\n\n").await?;
        Ok::<_, std::io::Error>(())
      });

      let mut ipc = RcRef::map(ipc, |r| &r.read_half).borrow_mut().await;
      let _err = ipc.read_msg().await.unwrap_err();

      child.await??;

      Ok(())
    }

    #[test]
    fn memchr() {
      let str = b"hello world";
      assert_eq!(super::memchr(b'h', str), Some(0));
      assert_eq!(super::memchr(b'w', str), Some(6));
      assert_eq!(super::memchr(b'd', str), Some(10));
      assert_eq!(super::memchr(b'x', str), None);

      let empty = b"";
      assert_eq!(super::memchr(b'\n', empty), None);
    }

    fn wrap_expr(s: &str) -> String {
      format!("(function () {{ return {s}; }})()")
    }

    fn serialize_js_to_json(runtime: &mut JsRuntime, js: String) -> String {
      let val = runtime.execute_script("", js).unwrap();
      let scope = &mut runtime.handle_scope();
      let val = v8::Local::new(scope, val);
      let mut buf = Vec::new();
      let mut ser = deno_core::serde_json::Serializer::new(&mut buf);
      super::serialize_v8_value(scope, val, &mut ser).unwrap();
      String::from_utf8(buf).unwrap()
    }

    #[test]
    fn ipc_serialization() {
      let mut runtime = JsRuntime::new(RuntimeOptions::default());

      let cases = [
        ("'hello'", "\"hello\""),
        ("1", "1"),
        ("1.5", "1.5"),
        ("Number.NaN", "null"),
        ("Infinity", "null"),
        ("Number.MAX_SAFE_INTEGER", &(2i64.pow(53) - 1).to_string()),
        (
          "Number.MIN_SAFE_INTEGER",
          &(-(2i64.pow(53) - 1)).to_string(),
        ),
        ("[1, 2, 3]", "[1,2,3]"),
        ("new Uint8Array([1,2,3])", "[1,2,3]"),
        (
          "{ a: 1.5, b: { c: new ArrayBuffer(5) }}",
          r#"{"a":1.5,"b":{"c":{}}}"#,
        ),
        ("new Number(1)", "1"),
        ("new Boolean(true)", "true"),
        ("true", "true"),
        (r#"new String("foo")"#, "\"foo\""),
        ("null", "null"),
        (
          r#"{ a: "field", toJSON() { return "custom"; } }"#,
          "\"custom\"",
        ),
        (r#"{ a: undefined, b: 1 }"#, "{\"b\":1}"),
      ];

      for (input, expect) in cases {
        let js = wrap_expr(input);
        let actual = serialize_js_to_json(&mut runtime, js);
        assert_eq!(actual, expect);
      }
    }
  }
}
