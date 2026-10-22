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

// Uses the real SDKs, since the mask, span customizer and `prepareStep` depend on how they
// record tool spans and pass errors along. Starts the way a chat resumes after the user clicks Run.
//   approved [rows, error] → both execute → one model step
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
  // A project name skips the logger's network lookup of the project
  braintrust.initLogger({ projectId: process.env.BRAINTRUST_PROJECT_ID, projectName: 'test' })

  const queryError = new Error('invalid input syntax for type integer: "Buy milk"')
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
  const toolCall = (toolCallId: string, fail: boolean) => ({
    type: 'tool-call' as const,
    toolCallId,
    toolName: 'execute_sql',
    input: { fail },
  })
  const { streamText } = braintrust.wrapAISDK(ai)
  const result = streamText({
    model: new MockLanguageModelV4({ doStream }),
    messages: [
      { role: 'user', content: 'Count signups' },
      {
        role: 'assistant',
        content: [
          toolCall('rows', false),
          { type: 'tool-approval-request', approvalId: 'approve-rows', toolCallId: 'rows' },
          toolCall('error', true),
          { type: 'tool-approval-request', approvalId: 'approve-error', toolCallId: 'error' },
        ],
      },
      {
        role: 'tool',
        content: [
          { type: 'tool-approval-response', approvalId: 'approve-rows', approved: true },
          { type: 'tool-approval-response', approvalId: 'approve-error', approved: true },
        ],
      },
    ],
    prepareStep: ({ messages }) => ({ messages: hideToolErrorsFromModel(messages, 'schema') }),
    tools: {
      execute_sql: ai.tool({
        inputSchema: z.object({ fail: z.boolean() }),
        needsApproval: true,
        execute: async ({ fail }) => {
          if (!fail) return { rows: [{ title: 'Buy milk' }], totalRows: 1, optInLevel: 'schema' }
          hideSpanErrorFromTrace()
          throw queryError
        },
        toModelOutput: () => ({ type: 'text', value: 'rows hidden' }),
      }),
    },
  })
  const streamParts = []
  for await (const part of result.fullStream) streamParts.push(part)
  await braintrust.flush()

  // The UI still gets the real error
  expect(streamParts).toContainEqual(
    expect.objectContaining({ type: 'tool-error', error: queryError })
  )
  expect(prompts).toHaveLength(1)
  expect(JSON.stringify(prompts)).not.toContain('Buy milk')
  expect(JSON.stringify(await uploads.drain())).not.toContain('Buy milk')
})
