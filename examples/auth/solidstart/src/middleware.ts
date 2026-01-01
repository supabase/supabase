/**
 * SolidStart middleware for automatic Supabase session management.
 *
 * This middleware runs on every request before route handlers execute.
 * It ensures authentication tokens are automatically refreshed when expired,
 * maintaining seamless user sessions across the application.
 *
 * Execution flow:
 * 1. Request arrives
 * 2. Middleware calls updateSession()
 * 3. Session is validated and refreshed if needed
 * 4. Updated cookies are set in response
 * 5. Route handler executes with fresh session
 */
import { createMiddleware } from '@solidjs/start/middleware'
import { updateSession } from '~/lib/supabase/middleware'

export default createMiddleware({
  onRequest: [
    async (event) => {
      // Refresh session on every request
      await updateSession()
    },
  ],
})
