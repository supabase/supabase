import { afterAll, beforeAll, vi } from 'vitest'

// Prevent errors about importing server-only modules from Client Components.
// Must stay at module scope: Vitest hoists `vi.mock` above imports.
vi.mock('server-only', () => {
  return {}
})

let oldEnv: NodeJS.ProcessEnv

beforeAll(() => {
  // Use local Supabase to run e2e tests
  oldEnv = { ...process.env }
  process.env = {
    ...process.env,
    NEXT_PUBLIC_SUPABASE_URL: 'http://localhost:54321',
    NEXT_PUBLIC_SUPABASE_ANON_KEY:
      'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0',
  }
})

afterAll(() => {
  process.env = oldEnv
})
