// Leaves time to finish the stream before the hosting platform's 300-second cutoff, set by
// `maxDuration` in pages/api/ai/sql/generate-v4.ts (Next.js) and vite.config.ts (TanStack Start).
export const ASSISTANT_TIMEOUT_MS = 270_000
export const ASSISTANT_TIMEOUT_MESSAGE =
  'The Assistant took too long to respond. Retry, or ask for a smaller change.'
