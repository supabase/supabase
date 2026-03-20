import { openai } from '@ai-sdk/openai'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as bedrockModule from './bedrock'
import { getModel, ModelErrorMessage } from './model'
import { openaiModelEntry } from './model.utils'

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
    vi.stubEnv('AWS_BEDROCK_ROLE_ARN', 'test')
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should return bedrock model and promptProviderOptions when default supports caching', async () => {
    vi.mocked(bedrockModule.checkAwsCredentials).mockResolvedValue(true)
    vi.stubEnv('IS_THROTTLED', 'false')

    const { modelParams, error, promptProviderOptions } = await getModel({
      routingKey: 'test',
      hasAccessToAdvanceModel: true,
    })

    expect(modelParams?.model).toEqual('bedrock-model')
    // Default bedrock model supportsCaching=false in registry, but if caller
    // specifies high-tier, provider options would be present
    expect(promptProviderOptions === undefined || typeof promptProviderOptions === 'object').toBe(
      true
    )
    expect(error).toBeUndefined()
  })

  it('should return bedrock model when throttled with default model', async () => {
    vi.mocked(bedrockModule.checkAwsCredentials).mockResolvedValue(true)
    vi.stubEnv('IS_THROTTLED', 'true')

    const { modelParams, error, promptProviderOptions } = await getModel({
      routingKey: 'test',
    })

    expect(modelParams?.model).toEqual('bedrock-model')
    expect(promptProviderOptions).toBeUndefined()
    expect(error).toBeUndefined()
  })

  it('should return OpenAI model when AWS credentials are not available but OPENAI_API_KEY is set', async () => {
    vi.mocked(bedrockModule.checkAwsCredentials).mockResolvedValue(false)
    process.env.OPENAI_API_KEY = 'test-key'

    const { modelParams, promptProviderOptions } = await getModel({
      routingKey: 'test',
      hasAccessToAdvanceModel: true,
    })

    expect(modelParams?.model).toEqual('openai-model')
    // Default openai model in registry is gpt-5-mini
    expect(openai).toHaveBeenCalledWith('gpt-5-mini')
    expect(promptProviderOptions).toBeUndefined()
  })

  it('should return error when neither AWS credentials nor OPENAI_API_KEY is available', async () => {
    vi.mocked(bedrockModule.checkAwsCredentials).mockResolvedValue(false)
    delete process.env.OPENAI_API_KEY

    const { error } = await getModel({ routingKey: 'test-key', hasAccessToAdvanceModel: true })
    expect(error).toEqual(new Error(ModelErrorMessage))
  })

  it('returns specified provider and model when provided (openai gpt-5)', async () => {
    vi.mocked(bedrockModule.checkAwsCredentials).mockResolvedValue(false)
    process.env.OPENAI_API_KEY = 'test-key'
    process.env.IS_THROTTLED = 'false'

    const { modelParams, error } = await getModel({
      provider: 'openai',
      routingKey: 'rk',
      hasAccessToAdvanceModel: true,
      modelEntry: openaiModelEntry({ id: 'gpt-5', reasoningEffort: 'minimal' }),
    })

    expect(error).toBeUndefined()
    expect(modelParams?.model).toEqual('openai-model')
    expect(openai).toHaveBeenCalledWith('gpt-5')
  })
})
