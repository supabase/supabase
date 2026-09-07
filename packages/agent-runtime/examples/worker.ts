import type { SupabaseEnv } from '@supabase/server'
import { tool, type LanguageModel } from 'ai'
import { z } from 'zod'

import { createAgentStreamResponse, defineAgent, type AgentToolPolicy } from '../src'
import { createAgentWorker } from '../src/workers'

type IdentityContext = { userId: string; canShareIdentity: boolean }

const permissions: Record<string, AgentToolPolicy<IdentityContext>> = {
  get_identity: {
    canExecute: ({ userId }) => userId.length > 0,
    modelOutput: (output, { canShareIdentity }) =>
      canShareIdentity ? output : 'The user has not enabled identity sharing.',
  },
  load_skill: {},
}

const identityAgent = defineAgent<IdentityContext>({
  name: 'identity-helper',
  instructions: 'Help the user understand their sign-in identity. Load the identity skill first.',
  maxSteps: 3,
  permissions,
  skills: [
    {
      name: 'identity',
      description: 'Explaining Supabase user identities.',
      load: () =>
        'A user ID identifies an authenticated Supabase user. Never ask for passwords or tokens.',
    },
  ],
  tools: ({ userId }) => ({
    tools: {
      get_identity: tool({
        description: 'Get the authenticated user ID.',
        inputSchema: z.object({}),
        execute: async () => ({ userId }),
      }),
    },
  }),
})

/** A stateless example. The Assistant app demonstrates persisted, approval-capable conversations. */
export function createExampleWorker(options: { model: LanguageModel; env: Partial<SupabaseEnv> }) {
  return createAgentWorker({
    env: options.env,
    routes: [
      {
        method: 'POST',
        pattern: '/chat',
        auth: 'user',
        handler: async (request, context) => {
          const input = z
            .object({ message: z.string().trim().min(1).max(4000) })
            .strict()
            .safeParse(await request.json().catch(() => null))
          if (!input.success)
            return Response.json(
              { message: 'Provide a message of 1–4,000 characters.' },
              { status: 400 }
            )
          const session = await identityAgent.prepare({
            context: {
              userId: context.userClaims!.id,
              // Application policy: results stay visible in the UI, but IDs are withheld from the model.
              canShareIdentity: false,
            },
            abortSignal: AbortSignal.any([request.signal, AbortSignal.timeout(30_000)]),
          })
          try {
            const messages = [
              {
                id: crypto.randomUUID(),
                role: 'user' as const,
                parts: [{ type: 'text' as const, text: input.data.message }],
              },
            ]
            const result = await session.stream({ model: options.model, messages })
            return await createAgentStreamResponse(result, {
              originalMessages: messages,
              onFinish: () => {},
              onSettled: session.close,
            })
          } catch (error) {
            await session.close()
            throw error
          }
        },
      },
    ],
  })
}
