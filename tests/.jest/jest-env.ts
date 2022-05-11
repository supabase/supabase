export default () => {
  process.env.SUPABASE_DB_HOST = process.env.SUPABASE_DB_HOST ?? 'localhost'
  process.env.SUPABASE_DB_PORT = process.env.SUPABASE_DB_PORT ?? '5432'
  process.env.SUPABASE_DB_PASS =
    process.env.SUPABASE_DB_PASS ?? 'your-super-secret-and-long-postgres-password'
  process.env.SUPABASE_GOTRUE = process.env.SUPABASE_GOTRUE ?? 'http://localhost:8000/auth/v1'
  process.env.SUPABASE_URL = process.env.SUPABASE_URL ?? 'http://localhost:8000'
  process.env.SUPABASE_KEY_ANON =
    process.env.SUPABASE_KEY_ANON ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJhbm9uIiwKICAgICJpc3MiOiAic3VwYWJhc2UtZGVtbyIsCiAgICAiaWF0IjogMTY0MTc2OTIwMCwKICAgICJleHAiOiAxNzk5NTM1NjAwCn0.dc_X5iR_VP_qT0zsiyj_I_OZ2T9FtRU2BBNWN8Bu4GE'
  process.env.SUPABASE_KEY_ADMIN =
    process.env.SUPABASE_KEY_ADMIN ??
    'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyAgCiAgICAicm9sZSI6ICJzZXJ2aWNlX3JvbGUiLAogICAgImlzcyI6ICJzdXBhYmFzZS1kZW1vIiwKICAgICJpYXQiOiAxNjQxNzY5MjAwLAogICAgImV4cCI6IDE3OTk1MzU2MDAKfQ.DaYlNEoUrrEn2Ig7tqibS-PHK5vgusbcbo7X36XVt4Q'
}
