import * as ai from 'ai'
import { convertArrayToReadableStream, MockLanguageModelV4 } from 'ai/test'
import { expect, it } from 'vitest'
import { z } from 'zod'

import { hideToolErrorsFromModel } from './generate-assistant-response.utils'

type DoStream = Extract<
  NonNullable<ConstructorParameters<typeof MockLanguageModelV4>[0]>['doStream'],
  (...args: never[]) => unknown
>
type StreamPart =
  Awaited<ReturnType<DoStream>>['stream'] extends ReadableStream<infer Part> ? Part : never

// Exercise SDK span exports and approval continuation together.
// approved [rows, error, error] → parallel execution → model step
it('hides rows and errors from the model and Braintrust', async () => {
  process.env.BRAINTRUST_API_KEY = 'test'
  process.env.BRAINTRUST_PROJECT_ID = '00000000-0000-4000-8000-000000000000'
  const braintrust = await import('braintrust')
  const { setInitialTestState, simulateLoginForTests, useTestBackgroundLogger } =
    braintrust._exportsForTestingOnly
  setInitialTestState()
  await simulateLoginForTests()
  const uploads = useTestBackgroundLogger()
  const { hideSpanErrorFromTrace } = await import('./braintrust-logger')
  // Use a named test project to avoid a network lookup.
  braintrust.initLogger({ projectId: process.env.BRAINTRUST_PROJECT_ID, projectName: 'test' })

  const queryErrors = [
    new Error('invalid input syntax for type integer: "Walk dog"'),
    new Error('invalid input syntax for type integer: "Feed cat"'),
  ]
  const usage = {
    inputTokens: { total: 1, noCache: undefined, cacheRead: undefined, cacheWrite: undefined },
    outputTokens: { total: 1, text: undefined, reasoning: undefined },
  }
  const prompts: unknown[] = []
  const doStream: DoStream = async ({ prompt }) => {
    prompts.push(prompt)
    return {
      stream: convertArrayToReadableStream<StreamPart>([
        { type: 'text-start', id: 'text' },
        { type: 'text-delta', id: 'text', delta: 'done' },
        { type: 'text-end', id: 'text' },
        { type: 'finish', finishReason: { unified: 'stop', raw: undefined }, usage },
      ]),
    }
  }
  const toolCall = (toolCallId: string, failure: number | null) => ({
    type: 'tool-call' as const,
    toolCallId,
    toolName: 'execute_sql',
    input: { failure },
  })
  const { streamText } = braintrust.wrapAISDK(ai)
  const result = streamText({
    model: new MockLanguageModelV4({ doStream }),
    messages: [
      { role: 'user', content: 'Count signups' },
      {
        role: 'assistant',
        content: [
          toolCall('rows', null),
          { type: 'tool-approval-request', approvalId: 'approve-rows', toolCallId: 'rows' },
          toolCall('error-0', 0),
          { type: 'tool-approval-request', approvalId: 'approve-error-0', toolCallId: 'error-0' },
          toolCall('error-1', 1),
          { type: 'tool-approval-request', approvalId: 'approve-error-1', toolCallId: 'error-1' },
        ],
      },
      {
        role: 'tool',
        content: [
          { type: 'tool-approval-response', approvalId: 'approve-rows', approved: true },
          { type: 'tool-approval-response', approvalId: 'approve-error-0', approved: true },
          { type: 'tool-approval-response', approvalId: 'approve-error-1', approved: true },
        ],
      },
    ],
    prepareStep: ({ messages }) => ({ messages: hideToolErrorsFromModel(messages, 'schema') }),
    tools: {
      execute_sql: ai.tool({
        inputSchema: z.object({ failure: z.number().nullable() }),
        needsApproval: true,
        execute: async ({ failure }) => {
          if (failure === null) {
            return { rows: [{ title: 'Buy milk' }], totalRows: 1, optInLevel: 'schema' }
          }
          hideSpanErrorFromTrace()
          throw queryErrors[failure]
        },
        toModelOutput: () => ({ type: 'text', value: 'rows hidden' }),
      }),
    },
  })
  const streamParts = []
  for await (const part of result.fullStream) streamParts.push(part)
  await braintrust.flush()

  // Redaction must preserve the errors streamed to the UI.
  for (const error of queryErrors) {
    expect(streamParts).toContainEqual(expect.objectContaining({ type: 'tool-error', error }))
  }
  expect(prompts).toHaveLength(1)
  const promptsJson = JSON.stringify(prompts)
  const uploadsJson = JSON.stringify(await uploads.drain())
  for (const secret of ['Buy milk', 'Walk dog', 'Feed cat']) {
    expect(promptsJson).not.toContain(secret)
    expect(uploadsJson).not.toContain(secret)
  }
})
