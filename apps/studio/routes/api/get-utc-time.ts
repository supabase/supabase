import { createFileRoute } from '@tanstack/react-router'

import { createApiHandlers } from '@/lib/api/apiWrapper'

// Returns the current UTC time in ISO format. Used to check if the client and server time are skewed. Clock skew causes
// issues with JWT verification.
export const Route = createFileRoute('/api/get-utc-time')({
  server: {
    handlers: createApiHandlers({
      GET: () => Response.json({ utcTime: new Date().toISOString() }),
    }),
  },
})
