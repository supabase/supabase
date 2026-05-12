import { openai } from '@ai-sdk/openai'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as bedrockModule from './bedrock'
import { getModel } from './model'
import { DEFAULT_COMPLETION_MODEL, openaiModelEntry } from './model.utils'

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

  it('returns bedrock model without promptProviderOptions', async () => {
    vi.mocked(bedrockModule.checkAwsCredentials).mockResolvedValue(true)
    vi.stubEnv('AWS_BEDROCK_ROLE_ARN', 'test')

    const { modelParams, error, promptProviderOptions } = await getModel({
      provider: 'bedrock',
      routingKey: 'test',
    })

    expect(modelParams?.model).toEqual('bedrock-model')
    expect(promptProviderOptions).toBeUndefined()
    expect(error).toBeUndefined()
  })

  it('returns error when bedrock credentials are not available', async () => {
    vi.mocked(bedrockModule.checkAwsCredentials).mockResolvedValue(false)

    const { error } = await getModel({ provider: 'bedrock', routingKey: 'test' })
    expect(error).toBeDefined()
  })

  it('returns openai model with default model', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')

    const { modelParams, promptProviderOptions } = await getModel({
      provider: 'openai',
      modelEntry: openaiModelEntry({ id: 'gpt-5.4-nano' }),
    })

    expect(modelParams?.model).toEqual('openai-model')
    expect(openai).toHaveBeenCalledWith('gpt-5.4-nano')
    expect(promptProviderOptions).toBeUndefined()
  })

  it('returns error when OPENAI_API_KEY is not available', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')

    const { error } = await getModel({
      provider: 'openai',
      modelEntry: openaiModelEntry({ id: 'gpt-5.4-nano' }),
    })
    expect(error).toEqual(new Error('OPENAI_API_KEY not available'))
  })

  it('returns openai gpt-5.3-codex when hasAccessToAdvanceModel and not throttled', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')
    vi.stubEnv('IS_THROTTLED', 'false')

    const { modelParams, error } = await getModel({
      provider: 'openai',
      modelEntry: openaiModelEntry({ id: 'gpt-5.3-codex', reasoningEffort: 'low' }),
    })

    expect(error).toBeUndefined()
    expect(modelParams?.model).toEqual('openai-model')
    expect(openai).toHaveBeenCalledWith('gpt-5.3-codex')
    expect(modelParams?.providerOptions?.openai?.reasoningEffort).toBe('low')
  })

  it('applies reasoningEffort from DEFAULT_COMPLETION_MODEL', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')

    const { modelParams, error } = await getModel({
      provider: 'openai',
      modelEntry: DEFAULT_COMPLETION_MODEL,
    })

    expect(error).toBeUndefined()
    expect(openai).toHaveBeenCalledWith('gpt-5.4-nano')
    expect(modelParams?.providerOptions?.openai?.reasoningEffort).toBe('none')
  })
})
