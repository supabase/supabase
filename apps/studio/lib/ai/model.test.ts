import { openai } from '@ai-sdk/openai'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import * as bedrockModule from './bedrock'
import { getModel, ModelErrorMessage } from './model'

vi.mock('@ai-sdk/openai', () => ({
  openai: vi.fn(() => 'openai-model'),
}))

vi.mock('./bedrock', async () => ({
  ...(await vi.importActual('./bedrock')),
  createRoutedBedrock: vi.fn(() => () => 'bedrock-model'),
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

  it('should return bedrock model when AWS credentials are available', async () => {
    vi.mocked(bedrockModule.checkAwsCredentials).mockResolvedValue(true)

    const { model, error } = await getModel()

    expect(model).toEqual('bedrock-model')
    expect(error).toBeUndefined()
  })

  it('should return OpenAI model when AWS credentials are not available but OPENAI_API_KEY is set', async () => {
    vi.mocked(bedrockModule.checkAwsCredentials).mockResolvedValue(false)
    process.env.OPENAI_API_KEY = 'test-key'

    const { model } = await getModel()

    expect(model).toEqual('openai-model')
    expect(openai).toHaveBeenCalledWith('gpt-4.1-2025-04-14')
  })

  it('should return error when neither AWS credentials nor OPENAI_API_KEY is available', async () => {
    vi.mocked(bedrockModule.checkAwsCredentials).mockResolvedValue(false)
    delete process.env.OPENAI_API_KEY

    const { error } = await getModel('test-key')

    expect(error).toEqual(new Error(ModelErrorMessage))
  })
})
