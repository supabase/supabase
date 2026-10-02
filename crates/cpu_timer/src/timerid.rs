pub struct TimerId(pub *mut libc::c_void);

#[cfg(target_os = "linux")]
impl Drop for TimerId {
  fn drop(&mut self) {
    unsafe {
      let tmspec: libc::itimerspec = std::mem::zeroed();

      libc::timer_settime(self.0, 0, &tmspec, std::ptr::null_mut());

      // NOTE: In observation, `timer_create` could return the `timerid`
      // as the zero value.
      libc::timer_delete(self.0);
    };
  }
}
