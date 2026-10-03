pub static CLI_SNAPSHOT: &[u8] =
  include_bytes!(concat!(env!("OUT_DIR"), "/RUNTIME_SNAPSHOT.bin"));

pub fn snapshot() -> Option<&'static [u8]> {
  let data = CLI_SNAPSHOT;
  Some(data)
}
