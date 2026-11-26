import { convertArrayToReadableStream, MockLanguageModelV4 } from 'ai/test'
import { expect, it } from 'vitest'

it('exports project region on the root trace', async () => {
  const braintrust = await import('braintrust')
  const { setInitialTestState, simulateLoginForTests, useTestBackgroundLogger } =
    braintrust._exportsForTestingOnly
  setInitialTestState()
  await simulateLoginForTests()
  const uploads = useTestBackgroundLogger()
  braintrust.initLogger({
    projectId: '00000000-0000-4000-8000-000000000000',
    projectName: 'test',
  })
  const { generateAssistantResponse } = await import('./generate-assistant-response')
  const result = await generateAssistantResponse({
    model: new MockLanguageModelV4({
      doStream: async () => ({
        stream: convertArrayToReadableStream([
          { type: 'text-start', id: 'text' },
          { type: 'text-delta', id: 'text', delta: 'Hello!' },
          { type: 'text-end', id: 'text' },
          {
            type: 'finish',
            finishReason: { unified: 'stop', raw: undefined },
            usage: {
              inputTokens: { total: 1, noCache: 1, cacheRead: 0, cacheWrite: 0 },
              outputTokens: { total: 1, text: 1, reasoning: 0 },
            },
          },
        ]),
      }),
    }),
    messages: [{ id: 'message', role: 'user', parts: [{ type: 'text', text: 'Hi!' }] }],
    tools: {},
    projectRef: 'test-project',
    projectRegion: 'eu-west-1',
    allowTracing: true,
  })
  await result.consumeStream()
  await braintrust.flush()

  expect(await uploads.drain()).toContainEqual(
    expect.objectContaining({
      span_attributes: expect.objectContaining({ name: 'generateAssistantResponse' }),
      metadata: expect.objectContaining({ projectRef: 'test-project', projectRegion: 'eu-west-1' }),
    })
  )
})
