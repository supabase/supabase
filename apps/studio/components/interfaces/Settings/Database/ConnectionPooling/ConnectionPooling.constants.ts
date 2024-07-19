// https://supabase.com/docs/guides/platform/performance#optimizing-the-number-of-connections
// https://github.com/supabase/infrastructure/blob/develop/worker/src/lib/constants.ts#L544-L596

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
}
