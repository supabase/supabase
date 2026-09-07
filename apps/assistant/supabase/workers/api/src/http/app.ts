import { createAgentWorker } from '@supabase/agent-runtime/workers'
import { bodyLimit } from 'hono/body-limit'

import type { Database } from '../db/database.types'
import { supabaseServerEnv } from '../env'
import { assistantCors } from './cors'
import { jsonError, toErrorResponse } from './errors'
import { routes } from './routes'

export const app = createAgentWorker<Database>({
  env: supabaseServerEnv(),
  routes,
  middleware: [
    assistantCors,
    bodyLimit({
      maxSize: 5 * 1024 * 1024,
      onError: () =>
        jsonError(413, 'invalid_request', 'Request is too large. Start a new conversation.'),
    }),
  ],
  onError: toErrorResponse,
})
