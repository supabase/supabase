import { z } from 'zod'

import { renderPageInputSchema } from './generated-page-schema'
import type { ToolContract } from './types'

/**
 * `render_page` — the assistant proposes an interactive HTML page; Studio renders it.
 *
 * Unlike every other tool, this one does no work on the server. It exists purely to carry a
 * validated proposal to the client: the page's markup plus the closed set of queries it is
 * allowed to run. The client shows that proposal for approval, and only the user's approval
 * click promotes each query's SQL and starts the sandboxed iframe (see `GeneratedPageRenderer`).
 *
 * The output is therefore `{ status: 'ready' }` and nothing else. Query results live in the
 * browser for as long as the page is mounted; they never enter the tool output, the message
 * history, or the model's context.
 */
const outputSchema = z.object({ status: z.literal('ready') })

export const contract = {
  name: 'render_page',
  description:
    'Asks the user to run an interactive page you have written — self-contained HTML, CSS, and JavaScript — directly in the chat. The page runs in a sandboxed frame and may only execute the database and logs queries you declare here, addressed by id. Requires user approval before it renders. Query results stay in the browser and are never returned to you, so use this to build something the user reads and interacts with, not to gather data for yourself.',
  inputSchema: renderPageInputSchema,
  outputSchema,
  minOptInLevel: 'schema',
  availability: {
    environments: new Set(['platform']),
    requires: new Set(['explorer']),
  },
  needsApproval: true,
  toModelOutput: ({ status }) => ({ status }),
} as const satisfies ToolContract
