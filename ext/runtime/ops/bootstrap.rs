// Copyright 2018-2024 the Deno authors. All rights reserved. MIT license.

use anyhow::Context;
use deno_core::error::AnyError;
use deno_core::op2;
use deno_core::ModuleSpecifier;
use deno_core::OpState;
use deno_fs::FsPermissions;

deno_core::extension!(runtime_bootstrap,
  parameters = [P: FsPermissions],
  ops = [
    op_main_module<P>,
    op_bootstrap_color_depth,
  ],
  options = {
    main_module: Option<ModuleSpecifier>
  },
  state = |state, options| {
    if let Some(module_init) = options.main_module {
      state.put::<ModuleSpecifier>(module_init);
    }
  },
);

#[op2]
#[string]
fn op_main_module<P>(state: &mut OpState) -> Result<String, AnyError>
where
  P: FsPermissions + 'static,
{
  let main = state.borrow::<ModuleSpecifier>().to_string();
  let main_url =
    deno_core::resolve_url_or_path(&main, std::env::current_dir()?.as_path())?;
  if main_url.scheme() == "file" {
    let main_path = std::env::current_dir()
      .context("Failed to get current working directory")?
      .join(main_url.to_string());
    state.borrow_mut::<P>().check_read_blind(
      &main_path,
      "main_module",
      "Deno.mainModule",
    )?;
  }

  Ok(main)
}

#[op2(fast)]
pub fn op_bootstrap_color_depth(_state: &mut OpState) -> i32 {
  1
}
