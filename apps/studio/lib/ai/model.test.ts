import { openai } from '@ai-sdk/openai'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as bedrockModule from './bedrock'
import { getModel } from './model'
import { ASSISTANT_CHAT_MODEL, DEFAULT_COMPLETION_MODEL, LOGS_REWRITE_MODEL } from './model.utils'

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => 'openai-model'),
}))

vi.mock('./bedrock', async () => ({
  ...(await vi.importActual('./bedrock')),
  createRoutedBedrock: vi.fn(() => async (_modelId: string) => 'bedrock-model'),
  checkAwsCredentials: vi.fn(),
}))

describe('getModel', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('returns bedrock model without systemProviderOptions', async () => {
    vi.mocked(bedrockModule.checkAwsCredentials).mockResolvedValue(true)
    vi.stubEnv('AWS_BEDROCK_ROLE_ARN', 'test')

    const { modelParams, error, systemProviderOptions } = await getModel({
      provider: 'bedrock',
      routingKey: 'test',
    })

    expect(modelParams?.model).toEqual('bedrock-model')
    expect(systemProviderOptions).toBeUndefined()
    expect(error).toBeUndefined()
  })

  it('returns error when bedrock credentials are not available', async () => {
    vi.mocked(bedrockModule.checkAwsCredentials).mockResolvedValue(false)

    const { error } = await getModel({ provider: 'bedrock', routingKey: 'test' })
    expect(error).toBeDefined()
  })

  it('returns Luna without an explicit reasoning effort', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')

    const { modelParams, systemProviderOptions } = await getModel({
      provider: 'openai',
      modelEntry: { id: 'gpt-6-luna' },
    })

    expect(modelParams?.model).toEqual('openai-model')
    expect(openai).toHaveBeenCalledWith('gpt-6-luna')
    expect(systemProviderOptions).toBeUndefined()
  })

  it('returns error when OPENAI_API_KEY is not available', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')

    const { error } = await getModel({
      provider: 'openai',
      modelEntry: { id: 'gpt-6-luna' },
    })
    expect(error).toEqual(new Error('OPENAI_API_KEY not available'))
  })

  it.each([
    ['completion', DEFAULT_COMPLETION_MODEL, 'none'],
    ['logs rewrite', LOGS_REWRITE_MODEL, 'low'],
    ['Assistant chat', ASSISTANT_CHAT_MODEL, 'medium'],
  ])('uses Luna for %s', async (_flow, modelEntry, effort) => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')

    const { modelParams, error } = await getModel({ provider: 'openai', modelEntry })

    expect(error).toBeUndefined()
    expect(openai).toHaveBeenCalledWith('gpt-6-luna')
    expect(modelParams?.providerOptions?.openai?.reasoningEffort).toBe(effort)
  })
})
