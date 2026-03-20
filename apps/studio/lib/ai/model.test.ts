import { openai } from '@ai-sdk/openai'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as bedrockModule from './bedrock'
import { getModel } from './model'
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
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('returns bedrock model with promptProviderOptions', async () => {
    vi.mocked(bedrockModule.checkAwsCredentials).mockResolvedValue(true)
    vi.stubEnv('AWS_BEDROCK_ROLE_ARN', 'test')
    vi.stubEnv('IS_THROTTLED', 'false')

    const { modelParams, error, promptProviderOptions } = await getModel({
      provider: 'bedrock',
      routingKey: 'test',
      hasAccessToAdvanceModel: true,
    })

    expect(modelParams?.model).toEqual('bedrock-model')
    expect(promptProviderOptions === undefined || typeof promptProviderOptions === 'object').toBe(
      true
    )
    expect(error).toBeUndefined()
  })

  it('returns bedrock default model when throttled', async () => {
    vi.mocked(bedrockModule.checkAwsCredentials).mockResolvedValue(true)
    vi.stubEnv('AWS_BEDROCK_ROLE_ARN', 'test')
    vi.stubEnv('IS_THROTTLED', 'true')

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
    process.env.OPENAI_API_KEY = 'test-key'

    const { modelParams, promptProviderOptions } = await getModel({
      provider: 'openai',
      hasAccessToAdvanceModel: true,
      modelEntry: openaiModelEntry({ id: 'gpt-5-mini' }),
    })

    expect(modelParams?.model).toEqual('openai-model')
    expect(openai).toHaveBeenCalledWith('gpt-5-mini')
    expect(promptProviderOptions).toBeUndefined()
  })

  it('returns error when OPENAI_API_KEY is not available', async () => {
    delete process.env.OPENAI_API_KEY

    const { error } = await getModel({
      provider: 'openai',
      modelEntry: openaiModelEntry({ id: 'gpt-5-mini' }),
    })
    expect(error).toEqual(new Error('OPENAI_API_KEY not available'))
  })

  it('returns openai gpt-5 when hasAccessToAdvanceModel and not throttled', async () => {
    process.env.OPENAI_API_KEY = 'test-key'
    process.env.IS_THROTTLED = 'false'

    const { modelParams, error } = await getModel({
      provider: 'openai',
      hasAccessToAdvanceModel: true,
      modelEntry: openaiModelEntry({ id: 'gpt-5', reasoningEffort: 'minimal' }),
    })

    expect(error).toBeUndefined()
    expect(modelParams?.model).toEqual('openai-model')
    expect(openai).toHaveBeenCalledWith('gpt-5')
  })
})
