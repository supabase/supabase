import type { JitExpiryMode } from './JitDbAccess.types'

export const JIT_EXPIRY_MODE_OPTIONS: Array<{ value: JitExpiryMode; label: string }> = [
  { value: '1h', label: '1 hour' },
  { value: '1d', label: '1 day' },
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: 'custom', label: 'Custom' },
  { value: 'never', label: 'Never' },
]

export const JIT_MAX_CUSTOM_EXPIRY_YEARS = 1
