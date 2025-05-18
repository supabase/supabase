// https://supabase.com/docs/guides/platform/performance#optimizing-the-number-of-connections
// https://github.com/supabase/infrastructure/blob/develop/worker/src/lib/constants.ts#L544-L596
// https://github.com/supabase/supabase-admin-api/blob/master/optimizations/pgbouncer.go
// [Joshen] This matches for both Supavisor and PgBouncer

export const POOLING_OPTIMIZATIONS = {
  ci_nano: {
    maxClientConn: 200,
    poolSize: 15,
  },
  ci_micro: {
    maxClientConn: 200,
    poolSize: 15,
  },
  ci_small: {
    maxClientConn: 400,
    poolSize: 15,
  },
  ci_medium: {
    maxClientConn: 600,
    poolSize: 15,
  },
  ci_large: {
    maxClientConn: 800,
    poolSize: 20,
  },
  ci_xlarge: {
    maxClientConn: 1000,
    poolSize: 20,
  },
  ci_2xlarge: {
    maxClientConn: 1500,
    poolSize: 25,
  },
  ci_4xlarge: {
    maxClientConn: 3000,
    poolSize: 32,
  },
  ci_8xlarge: {
    maxClientConn: 6000,
    poolSize: 64,
  },
  ci_12xlarge: {
    maxClientConn: 9000,
    poolSize: 96,
  },
  ci_16xlarge: {
    maxClientConn: 12000,
    poolSize: 128,
  },
  ci_24xlarge: {
    maxClientConn: 18000,
    poolSize: 192,
  },
  ci_24xlarge_optimized_cpu: {
    maxClientConn: 18000,
    poolSize: 192,
  },
  ci_24xlarge_optimized_memory: {
    maxClientConn: 18000,
    poolSize: 192,
  },
  ci_24xlarge_high_memory: {
    maxClientConn: 18000,
    poolSize: 192,
  },
  ci_48xlarge: {
    maxClientConn: 36000,
    poolSize: 384,
  },
  ci_48xlarge_optimized_cpu: {
    maxClientConn: 36000,
    poolSize: 384,
  },
  ci_48xlarge_optimized_memory: {
    maxClientConn: 36000,
    poolSize: 384,
  },
  ci_48xlarge_high_memory: {
    maxClientConn: 36000,
    poolSize: 384,
  },
}
