import { z } from 'zod'

import type { ToolContract } from './types'

const inputSchema = z.object({
  newName: z.string().describe('The new name for the chat session. Five words or less.'),
})

export const contract = {
  name: 'rename_chat',
  description: `Rename the current chat session when the current chat name doesn't describe the conversation topic.`,
  inputSchema,
  outputSchema: z.object({ status: z.string() }),
  minOptInLevel: null,
  needsApproval: false,
  toModelOutput: ({ status }) => ({ status }),
} as const satisfies ToolContract
