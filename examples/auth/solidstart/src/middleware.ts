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
