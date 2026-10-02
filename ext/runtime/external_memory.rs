use std::ffi::c_void;
use std::sync::atomic::AtomicUsize;
use std::sync::atomic::Ordering;
use std::sync::Arc;
use std::sync::RwLock;

use deno_core::v8;
use deno_core::v8::UniqueRef;
use futures::task::AtomicWaker;

pub struct CustomAllocator {
  max: usize,
  count: AtomicUsize,
  waker: RwLock<Option<Arc<AtomicWaker>>>,
}

impl CustomAllocator {
  pub fn new(max: usize) -> Arc<Self> {
    Arc::new(Self {
      max,
      count: AtomicUsize::new(0),
      waker: RwLock::new(None),
    })
  }

  pub fn set_waker(&self, waker: Arc<AtomicWaker>) {
    _ = self.waker.try_write().unwrap().insert(waker);
  }

  pub fn into_v8_allocator(
    self: Arc<Self>,
  ) -> UniqueRef<deno_core::v8::Allocator> {
    let vtable: &'static v8::RustAllocatorVtable<CustomAllocator> =
      &v8::RustAllocatorVtable {
        allocate,
        allocate_uninitialized,
        free,
        reallocate,
        drop,
      };

    unsafe { v8::new_rust_allocator(Arc::into_raw(self), vtable) }
  }

  fn wake(&self) {
    if let Some(waker) = self.waker.try_read().ok().and_then(|it| it.clone()) {
      waker.wake();
    }
  }
}

#[allow(clippy::unnecessary_cast)]
unsafe extern "C" fn allocate(
  allocator: &CustomAllocator,
  n: usize,
) -> *mut c_void {
  allocator.count.fetch_add(n, Ordering::SeqCst);

  let count_loaded = allocator.count.load(Ordering::SeqCst);

  if count_loaded > allocator.max {
    allocator.count.fetch_sub(n, Ordering::SeqCst);
    return std::ptr::null::<*mut [u8]>() as *mut c_void;
  }

  allocator.wake();

  Box::into_raw(vec![0u8; n].into_boxed_slice()) as *mut [u8] as *mut c_void
}

#[allow(clippy::unnecessary_cast)]
#[allow(clippy::uninit_vec)]
unsafe extern "C" fn allocate_uninitialized(
  allocator: &CustomAllocator,
  n: usize,
) -> *mut c_void {
  allocator.count.fetch_add(n, Ordering::SeqCst);

  let count_loaded = allocator.count.load(Ordering::SeqCst);

  if count_loaded > allocator.max {
    allocator.count.fetch_sub(n, Ordering::SeqCst);
    return std::ptr::null::<*mut [u8]>() as *mut c_void;
  }

  let mut store = Vec::with_capacity(n);

  store.set_len(n);
  allocator.wake();

  Box::into_raw(store.into_boxed_slice()) as *mut [u8] as *mut c_void
}

unsafe extern "C" fn free(
  allocator: &CustomAllocator,
  data: *mut c_void,
  n: usize,
) {
  allocator.count.fetch_sub(n, Ordering::SeqCst);
  allocator.wake();

  let _ = Box::from_raw(std::ptr::slice_from_raw_parts_mut(data as *mut u8, n));
}

#[allow(clippy::unnecessary_cast)]
unsafe extern "C" fn reallocate(
  allocator: &CustomAllocator,
  prev: *mut c_void,
  oldlen: usize,
  newlen: usize,
) -> *mut c_void {
  allocator
    .count
    .fetch_add(newlen.wrapping_sub(oldlen), Ordering::SeqCst);

  let count_loaded = allocator.count.load(Ordering::SeqCst);

  if count_loaded > allocator.max {
    allocator
      .count
      .fetch_sub(newlen.wrapping_sub(oldlen), Ordering::SeqCst);
    return std::ptr::null::<*mut [u8]>() as *mut c_void;
  }

  let old_store =
    Box::from_raw(std::ptr::slice_from_raw_parts_mut(prev as *mut u8, oldlen));
  let mut new_store = Vec::with_capacity(newlen);
  let copy_len = oldlen.min(newlen);

  new_store.extend_from_slice(&old_store[..copy_len]);
  new_store.resize(newlen, 0u8);
  allocator.wake();

  Box::into_raw(new_store.into_boxed_slice()) as *mut [u8] as *mut c_void
}

unsafe extern "C" fn drop(allocator: *const CustomAllocator) {
  Arc::from_raw(allocator);
}
