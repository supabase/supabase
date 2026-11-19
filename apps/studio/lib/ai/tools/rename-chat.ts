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
  availability: {
    environments: new Set(['platform', 'self-hosted']),
  },
  needsApproval: false,
  promptGuidance: `- At the start of each conversation, if the chat is unnamed, call \`rename_chat\` with a succinct 2–4 word descriptive name (e.g., "User Authentication Setup", "Sales Data Analysis", "Product Table Creation").`,
  toModelOutput: ({ status }) => ({ status }),
} as const satisfies ToolContract
