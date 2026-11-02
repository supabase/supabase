// Shared between ShellFallback (TanStack) and BootTimeoutFallback (Next.js) —
// same "stuck loading" message, different markup per runtime (see FE-4460).
export const BOOT_FALLBACK_REVEAL_DELAY_SECONDS = 7
export const BOOT_FALLBACK_SUPPORT_EMAIL = 'support@supabase.io'
export const BOOT_FALLBACK_MESSAGE =
  'Taking longer than expected? Try clearing your browser cookies and reloading the page.'
