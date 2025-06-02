import { openai } from '@ai-sdk/openai'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as bedrockModule from './bedrock'
import { bedrock } from './bedrock'
import { getModel, modelsByProvider } from './model'

// Mock dependencies
vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => 'openai-model'),
}))

vi.mock('./bedrock', () => ({
  bedrock: vi.fn(() => 'bedrock-model'),
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

  it('should return bedrock model when AWS credentials are available and AWS_REGION is set', async () => {
    vi.mocked(bedrockModule.checkAwsCredentials).mockResolvedValue(true)
    process.env.AWS_REGION = 'us-east-1'

    const { model, error } = await getModel()

    console.log('Model:', model, 'Error:', error)

    expect(model).toEqual('bedrock-model')
    expect(bedrock).toHaveBeenCalledWith(modelsByProvider.bedrock)
    expect(error).toBeUndefined()
  })

  it('should return error when AWS credentials are available but AWS_REGION is not set', async () => {
    vi.mocked(bedrockModule.checkAwsCredentials).mockResolvedValue(true)
    delete process.env.AWS_REGION

    const { error } = await getModel()

    expect(error).toEqual(new Error('AWS_REGION is not set'))
  })

  it('should return OpenAI model when AWS credentials are not available but OPENAI_API_KEY is set', async () => {
    vi.mocked(bedrockModule.checkAwsCredentials).mockResolvedValue(false)
    process.env.OPENAI_API_KEY = 'test-key'

    const { model } = await getModel()

    expect(model).toEqual('openai-model')
    expect(openai).toHaveBeenCalledWith(modelsByProvider.openai)
  })

  it('should return error when neither AWS credentials nor OPENAI_API_KEY is available', async () => {
    vi.mocked(bedrockModule.checkAwsCredentials).mockResolvedValue(false)
    delete process.env.OPENAI_API_KEY

    const { error } = await getModel()

    expect(error).toEqual(
      new Error(
        'No valid AI model available. Please set up a local AWS profile (for Bedrock) or pass an OPENAI_API_KEY.'
      )
    )
  })
})
