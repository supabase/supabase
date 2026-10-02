use deno::PermissionsContainer;

deno_core::extension!(base_runtime_permissions,
  options = {
    permissions: PermissionsContainer,
  },
  state = |state, options| {
    state.put::<PermissionsContainer>(options.permissions);
  },
);
