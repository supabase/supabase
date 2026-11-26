import { createFileRoute } from '@tanstack/react-router'

import { createAuthSenderHandlers } from '@/lib/api/self-hosted/auth-senders'

export const Route = createFileRoute('/api/platform/auth/$ref/otp')({
  server: { handlers: createAuthSenderHandlers('otp', 'phone') },
})
