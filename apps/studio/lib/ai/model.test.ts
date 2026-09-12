import { createOpenAI } from '@ai-sdk/openai'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import * as bedrockModule from './bedrock'
import { getModel } from './model'
import { DEFAULT_COMPLETION_MODEL, openaiModelEntry } from './model.utils'

const { openaiProvider } = vi.hoisted(() => ({
  openaiProvider: vi.fn(),
}))

vi.mock('@ai-sdk/openai', () => ({
  createOpenAI: vi.fn(),
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
    vi.mocked(createOpenAI).mockReturnValue(
      openaiProvider as unknown as ReturnType<typeof createOpenAI>
    )
    openaiProvider.mockReturnValue('openai-model')
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

  it('returns openai model with default model', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')

    const { modelParams, systemProviderOptions } = await getModel({
      provider: 'openai',
      modelEntry: openaiModelEntry({ id: 'gpt-5.4-nano' }),
    })

    expect(modelParams?.model).toEqual('openai-model')
    expect(createOpenAI).toHaveBeenCalledWith({
      apiKey: 'test-key',
      baseURL: 'https://api.openai.com/v1',
    })
    expect(openaiProvider).toHaveBeenCalledWith('gpt-5.4-nano')
    expect(systemProviderOptions).toBeUndefined()
  })

  it('passes OPENAI_BASE_URL to the openai provider', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')
    vi.stubEnv('OPENAI_BASE_URL', 'https://integrate.api.nvidia.com/v1/')

    const { modelParams, systemProviderOptions } = await getModel({
      provider: 'openai',
      modelEntry: openaiModelEntry({ id: 'gpt-5.4-nano' }),
    })

    expect(modelParams?.model).toEqual('openai-model')
    expect(createOpenAI).toHaveBeenCalledWith({
      apiKey: 'test-key',
      baseURL: 'https://integrate.api.nvidia.com/v1',
    })
    expect(openaiProvider).toHaveBeenCalledWith('gpt-5.4-nano')
    expect(systemProviderOptions).toBeUndefined()
  })

  it('ignores blank OPENAI_BASE_URL values', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')
    vi.stubEnv('OPENAI_BASE_URL', '   ')

    const { modelParams } = await getModel({
      provider: 'openai',
      modelEntry: openaiModelEntry({ id: 'gpt-5.4-nano' }),
    })

    expect(modelParams?.model).toEqual('openai-model')
    expect(createOpenAI).toHaveBeenCalledWith({
      apiKey: 'test-key',
      baseURL: 'https://api.openai.com/v1',
    })
    expect(openaiProvider).toHaveBeenCalledWith('gpt-5.4-nano')
  })

  it('returns error when OPENAI_API_KEY is not available', async () => {
    vi.stubEnv('OPENAI_API_KEY', '')

    const { error } = await getModel({
      provider: 'openai',
      modelEntry: openaiModelEntry({ id: 'gpt-5.4-nano' }),
    })
    expect(error).toEqual(new Error('OPENAI_API_KEY not available'))
  })

  it('returns openai gpt-5.3-codex with reasoning effort', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')

    const { modelParams, error } = await getModel({
      provider: 'openai',
      modelEntry: openaiModelEntry({ id: 'gpt-5.3-codex', reasoningEffort: 'low' }),
    })

    expect(error).toBeUndefined()
    expect(modelParams?.model).toEqual('openai-model')
    expect(openaiProvider).toHaveBeenCalledWith('gpt-5.3-codex')
    expect(modelParams?.providerOptions?.openai?.reasoningEffort).toBe('low')
  })

  it('applies reasoningEffort from DEFAULT_COMPLETION_MODEL', async () => {
    vi.stubEnv('OPENAI_API_KEY', 'test-key')

    const { modelParams, error } = await getModel({
      provider: 'openai',
      modelEntry: DEFAULT_COMPLETION_MODEL,
    })

    expect(error).toBeUndefined()
    expect(openaiProvider).toHaveBeenCalledWith('gpt-5.4-nano')
    expect(modelParams?.providerOptions?.openai?.reasoningEffort).toBe('none')
  })
})
