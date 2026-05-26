import { registerTool } from '../registry.ts'

registerTool({
  name: 'echo',
  description: 'Echoes the provided message back. Useful for connectivity checks.',
  inputSchema: {
    type: 'object',
    properties: {
      message: { type: 'string', description: 'Text to echo back.' },
    },
    required: ['message'],
    additionalProperties: false,
  },
  async handler(args) {
    return { message: String(args.message ?? '') }
  },
})
