use std::fs::File;
use std::io::ErrorKind;
use std::path::Path;

fn main() {
  let env_file = "tests/.env";
  let env_path = Path::new(env_file);

  println!("cargo::rustc-check-cfg=cfg(dotenv)");

  // Create-or-detect in one syscall so concurrent builds can't race.
  match File::create_new(env_path) {
    Ok(_) => {}
    Err(err) if err.kind() == ErrorKind::AlreadyExists => {
      println!("cargo:rustc-cfg=dotenv")
    }
    Err(err) => panic!("failed to create {env_file}: {err}"),
  }

  println!("cargo::rerun-if-changed={}", env_file);
}
