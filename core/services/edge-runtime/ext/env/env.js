const { ops } = globalThis.__bootstrap.core;

class SupaEnv {
  setEnv(key, value) {
    ops.op_set_env(key, value);
  }

  getEnv(key) {
    return ops.op_get_env(key) ?? undefined;
  }

  deleteEnv(key) {
    ops.op_delete_env(key);
  }
}

const supaEnvInstance = new SupaEnv();

const SUPABASE_ENV = {
  get: supaEnvInstance.getEnv,
  toObject() {
    return ops.op_env();
  },
  set: supaEnvInstance.setEnv,
  has(key) {
    return supaEnvInstance.getEnv(key) !== undefined;
  },
  delete: supaEnvInstance.deleteEnv,
};

export { SUPABASE_ENV };
