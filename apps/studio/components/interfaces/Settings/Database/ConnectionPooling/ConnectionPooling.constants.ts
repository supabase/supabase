// https://supabase.com/docs/guides/platform/performance#optimizing-the-number-of-connections
// https://github.com/supabase/infrastructure/blob/develop/worker/src/lib/constants.ts#L544-L596

export const POOLING_OPTIMIZATIONS = {
  ci_small: {
    maxClientConn: 200,
    maxDirectConn: 90,
    poolSize: 15,
  },
  ci_medium: {
    maxClientConn: 200,
    maxDirectConn: 120,
    poolSize: 15,
  },
  ci_large: {
    maxClientConn: 300,
    maxDirectConn: 160,
    poolSize: 15,
  },
  ci_xlarge: {
    maxClientConn: 700,
    maxDirectConn: 240,
    poolSize: 20,
  },
  ci_2xlarge: {
    maxClientConn: 1500,
    maxDirectConn: 380,
    poolSize: 25,
  },
  ci_4xlarge: {
    maxClientConn: 3000,
    maxDirectConn: 480,
    poolSize: 32,
  },
  ci_8xlarge: {
    maxClientConn: 6000,
    maxDirectConn: 490,
    poolSize: 64,
  },
  ci_12xlarge: {
    maxClientConn: 9000,
    maxDirectConn: 500,
    poolSize: 96,
  },
  ci_16xlarge: {
    maxClientConn: 12000,
    maxDirectConn: 500,
    poolSize: 128,
  },
}
