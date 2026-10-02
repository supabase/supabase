pub mod errors;
pub mod ops;
pub mod shared;

pub fn exit(code: i32) -> ! {
  #[allow(clippy::disallowed_methods)]
  std::process::exit(code);
}
