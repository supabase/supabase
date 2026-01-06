import { describe, it, expect, vi, beforeEach } from 'vitest'
import { checkAwsCredentials, createRoutedBedrock, bedrockRegionMap } from './bedrock'
import { selectWeightedKey } from './util'
import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createCredentialChain, fromNodeProviderChain } from '@aws-sdk/credential-providers'
import { awsCredentialsProvider } from '@vercel/functions/oidc'

vi.mock('./util', () => ({
  selectWeightedKey: vi.fn(),
}))

vi.mock('@ai-sdk/amazon-bedrock', () => ({
  createAmazonBedrock: vi.fn(),
}))

vi.mock('@aws-sdk/credential-providers', () => {
  const mockFn = vi.fn()
  return {
    createCredentialChain: vi.fn(() => mockFn),
    fromNodeProviderChain: vi.fn(),
    mockCredentialProvider: mockFn,
  }
})

vi.mock('@vercel/functions/oidc', () => ({
  awsCredentialsProvider: vi.fn(),
}))

describe('checkAwsCredentials', () => {
  let mockCredentialProvider: any

  beforeEach(async () => {
    vi.clearAllMocks()
    const credProviders = await import('@aws-sdk/credential-providers')
    mockCredentialProvider = (credProviders as any).mockCredentialProvider
  })

  it('should return true when credentials are available', async () => {
    mockCredentialProvider.mockResolvedValue({ accessKeyId: 'test', secretAccessKey: 'test' })

    const result = await checkAwsCredentials()

    expect(result).toBe(true)
    expect(mockCredentialProvider).toHaveBeenCalled()
  })

  it('should return false when credentials are not available', async () => {
    mockCredentialProvider.mockRejectedValue(new Error('No credentials'))

    const result = await checkAwsCredentials()

    expect(result).toBe(false)
  })
})

describe('createRoutedBedrock', () => {
  const mockBedrock = vi.fn()
  const mockModel = { id: 'test-model' }

  beforeEach(() => {
    vi.clearAllMocks()
    ;(createAmazonBedrock as any).mockReturnValue(mockBedrock)
    mockBedrock.mockReturnValue(mockModel)
    ;(selectWeightedKey as any).mockResolvedValue('use1')
  })

  it('should select region based on routing key', async () => {
    const getModel = createRoutedBedrock('test-routing-key')
    const regionWeights = {
      use1: 40,
      use2: 10,
      usw2: 10,
      euc1: 10,
    }

    await getModel('anthropic.claude-3-7-sonnet-20250219-v1:0' as any)

    expect(selectWeightedKey).toHaveBeenCalledWith('test-routing-key', regionWeights)
    expect(createAmazonBedrock).toHaveBeenCalledWith({
      credentialProvider: expect.any(Function),
      region: 'us-east-1',
    })
  })

  it('should use use1 as default when no routing key and use1 has weight > 0', async () => {
    const getModel = createRoutedBedrock()
    const regionWeights = {
      use1: 40,
      use2: 10,
      usw2: 10,
      euc1: 10,
    }

    await getModel('anthropic.claude-3-7-sonnet-20250219-v1:0' as any)

    expect(selectWeightedKey).not.toHaveBeenCalled()
    expect(createAmazonBedrock).toHaveBeenCalledWith({
      credentialProvider: expect.any(Function),
      region: 'us-east-1',
    })
  })

  it('should use usw2 as default when no routing key and use1 has weight 0', async () => {
    const getModel = createRoutedBedrock()
    const regionWeights = {
      use1: 0,
      use2: 0,
      usw2: 30,
      euc1: 0,
    }

    await getModel('openai.gpt-oss-120b-1:0' as any)

    expect(selectWeightedKey).not.toHaveBeenCalled()
    expect(createAmazonBedrock).toHaveBeenCalledWith({
      credentialProvider: expect.any(Function),
      region: 'us-west-2',
    })
  })

  it('should add region prefix when multiple active regions', async () => {
    ;(selectWeightedKey as any).mockResolvedValue('use2')
    const getModel = createRoutedBedrock('test-key')
    const regionWeights = {
      use1: 40,
      use2: 10,
      usw2: 10,
      euc1: 10,
    }

    await getModel('anthropic.claude-3-7-sonnet-20250219-v1:0' as any)

    expect(mockBedrock).toHaveBeenCalledWith('us.anthropic.claude-3-7-sonnet-20250219-v1:0')
  })

  it('should not add region prefix when single active region', async () => {
    ;(selectWeightedKey as any).mockResolvedValue('usw2')
    const getModel = createRoutedBedrock('test-key')
    const regionWeights = {
      use1: 0,
      use2: 0,
      usw2: 30,
      euc1: 0,
    }

    await getModel('openai.gpt-oss-120b-1:0' as any)

    expect(mockBedrock).toHaveBeenCalledWith('openai.gpt-oss-120b-1:0')
  })

  it('should return language model', async () => {
    const getModel = createRoutedBedrock('test-key')

    const result = await getModel('anthropic.claude-3-7-sonnet-20250219-v1:0' as any)

    expect(result).toBe(mockModel)
  })
})

describe('bedrockRegionMap', () => {
  it('should map region keys to AWS regions', () => {
    expect(bedrockRegionMap.use1).toBe('us-east-1')
    expect(bedrockRegionMap.use2).toBe('us-east-2')
    expect(bedrockRegionMap.usw2).toBe('us-west-2')
    expect(bedrockRegionMap.euc1).toBe('eu-central-1')
  })
})
