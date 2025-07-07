import { openai } from '@ai-sdk/openai'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as bedrockModule from './bedrock'
import { getModel, ModelErrorMessage, modelsByProvider } from './model'

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => 'openai-model'),
}))

vi.mock('./bedrock', () => ({
  bedrockForRegion: vi.fn(() => () => 'bedrock-model'),
  checkAwsCredentials: vi.fn(),
  selectBedrockRegion: vi.fn(() => 'us'),
}))

describe('getModel', () => {
  const originalEnv = { ...process.env }

  beforeEach(() => {
    vi.resetAllMocks()
  })

  afterEach(() => {
    process.env = { ...originalEnv }
  })

  it('should return bedrock model when AWS credentials are available', async () => {
    vi.mocked(bedrockModule.checkAwsCredentials).mockResolvedValue(true)

    const { model, error } = await getModel()

    console.log('Model:', model)

    expect(model).toEqual('bedrock-model')
    expect(bedrockModule.bedrockForRegion).toHaveBeenCalledWith('us1')
    expect(error).toBeUndefined()
  })

  it('should return OpenAI model when AWS credentials are not available but OPENAI_API_KEY is set', async () => {
    vi.mocked(bedrockModule.checkAwsCredentials).mockResolvedValue(false)
    process.env.OPENAI_API_KEY = 'test-key'

    const { model } = await getModel('test-key')

    expect(model).toEqual('openai-model')
    expect(openai).toHaveBeenCalledWith(modelsByProvider.openai)
  })

  it('should return error when neither AWS credentials nor OPENAI_API_KEY is available', async () => {
    vi.mocked(bedrockModule.checkAwsCredentials).mockResolvedValue(false)
    delete process.env.OPENAI_API_KEY

    const { error } = await getModel('test-key')

    expect(error).toEqual(new Error(ModelErrorMessage))
  })
})
