// Using 'default' Supabase auth middleware
// Change to a specific provider by importing like that:
// import { AuthMiddleware } from "../_shared/jwt/clerk.ts";
import { withSupabase } from 'npm:@supabase/server@^1'

import { AuthMiddleware } from '../_shared/jwt/default.ts'

interface reqPayload {
  name: string
}

// Auth is handled by the custom AuthMiddleware below, so deploy with
// verify_jwt = false. withSupabase only handles CORS here.
export default {
  fetch: withSupabase({ auth: 'none' }, (req) =>
    AuthMiddleware(req, async (r) => {
      const { name }: reqPayload = await r.json()
      const data = {
        message: `Hello ${name} from foo!`,
      }

      return Response.json(data)
    })
  ),
}
