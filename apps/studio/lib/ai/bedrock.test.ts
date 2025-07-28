import { describe, test, expect, vi, beforeEach, afterEach } from 'vitest'

vi.mock('@ai-sdk/amazon-bedrock')
vi.mock('@aws-sdk/credential-providers')
vi.mock('@vercel/functions/oidc')
vi.mock('./util')

import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createCredentialChain } from '@aws-sdk/credential-providers'
import { CredentialsProviderError } from '@smithy/property-provider'
import { awsCredentialsProvider } from '@vercel/functions/oidc'
import {
  checkAwsCredentials,
  createRoutedBedrock,
  bedrockRegionMap,
  regionPrefixMap,
} from './bedrock'
import { selectWeightedKey } from './util'

const mockCreateAmazonBedrock = vi.mocked(createAmazonBedrock)
const mockCreateCredentialChain = vi.mocked(createCredentialChain)
const mockAwsCredentialsProvider = vi.mocked(awsCredentialsProvider)
const mockSelectWeightedKey = vi.mocked(selectWeightedKey)

describe('bedrock', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('checkAwsCredentials', () => {
    test('should return true when credentials are available', async () => {
      const mockCredentialProvider = vi.fn().mockResolvedValue({
        accessKeyId: 'test-access-key',
        secretAccessKey: 'test-secret-key',
      })

      mockCreateCredentialChain.mockReturnValue(mockCredentialProvider)

      vi.resetModules()
      const { checkAwsCredentials } = await import('./bedrock')

      const result = await checkAwsCredentials()

      expect(result).toBe(true)
    })

    test('should return false when credentials are not available', async () => {
      const mockCredentialProvider = vi.fn().mockRejectedValue(new Error('No credentials'))

      mockCreateCredentialChain.mockReturnValue(mockCredentialProvider)

      vi.resetModules()
      const { checkAwsCredentials } = await import('./bedrock')

      const result = await checkAwsCredentials()

      expect(result).toBe(false)
    })

    test('should return false when credential provider throws CredentialsProviderError', async () => {
      const mockCredentialProvider = vi
        .fn()
        .mockRejectedValue(
          new CredentialsProviderError('Invalid credentials', { tryNextLink: false })
        )

      mockCreateCredentialChain.mockReturnValue(mockCredentialProvider)

      vi.resetModules()
      const { checkAwsCredentials } = await import('./bedrock')

      const result = await checkAwsCredentials()

      expect(result).toBe(false)
    })
  })

  describe('createRoutedBedrock', () => {
    const mockBedrockClient = vi.fn()
    const mockModel = vi.fn()

    beforeEach(() => {
      mockCreateAmazonBedrock.mockReturnValue(mockBedrockClient)
      mockBedrockClient.mockReturnValue(mockModel)
    })

    test('should create bedrock client with correct region when routing key is provided', async () => {
      const routingKey = 'test-routing-key'
      const modelId = 'anthropic.claude-3-7-sonnet-20250219-v1:0'

      mockSelectWeightedKey.mockResolvedValue('use1')

      const routedBedrock = createRoutedBedrock(routingKey)
      const result = await routedBedrock(modelId)

      expect(mockSelectWeightedKey).toHaveBeenCalledWith(routingKey, {
        use1: 40,
        use2: 10,
        usw2: 10,
        euc1: 10,
      })
      expect(mockCreateAmazonBedrock).toHaveBeenCalled()
      expect(mockBedrockClient).toHaveBeenCalledWith('us.anthropic.claude-3-7-sonnet-20250219-v1:0')
      expect(result).toBe(mockModel)
    })

    test('should default to use1 region when no routing key is provided', async () => {
      const modelId = 'anthropic.claude-3-5-haiku-20241022-v1:0'

      const routedBedrock = createRoutedBedrock()
      const result = await routedBedrock(modelId)

      expect(mockSelectWeightedKey).not.toHaveBeenCalled()
      expect(mockCreateAmazonBedrock).toHaveBeenCalled()
      expect(mockBedrockClient).toHaveBeenCalledWith('us.anthropic.claude-3-5-haiku-20241022-v1:0')
      expect(result).toBe(mockModel)
    })

    test('should use correct region mapping for different regions', async () => {
      const routingKey = 'test-routing-key'
      const modelId = 'anthropic.claude-3-7-sonnet-20250219-v1:0'

      // Test different regions
      const testCases = [
        { selectedRegion: 'use1', expectedPrefix: 'us' },
        { selectedRegion: 'use2', expectedPrefix: 'us' },
        { selectedRegion: 'usw2', expectedPrefix: 'us' },
        { selectedRegion: 'euc1', expectedPrefix: 'eu' },
      ]

      for (const testCase of testCases) {
        mockSelectWeightedKey.mockResolvedValue(testCase.selectedRegion as any)

        const routedBedrock = createRoutedBedrock(routingKey)
        await routedBedrock(modelId)

        expect(mockCreateAmazonBedrock).toHaveBeenCalled()
        expect(mockBedrockClient).toHaveBeenCalledWith(`${testCase.expectedPrefix}.${modelId}`)
      }
    })

    test('should handle different model types with correct weights', async () => {
      const routingKey = 'test-routing-key'

      mockSelectWeightedKey.mockResolvedValue('use1')
      let routedBedrock = createRoutedBedrock(routingKey)
      await routedBedrock('anthropic.claude-3-7-sonnet-20250219-v1:0')

      expect(mockSelectWeightedKey).toHaveBeenCalledWith(routingKey, {
        use1: 40,
        use2: 10,
        usw2: 10,
        euc1: 10,
      })

      mockSelectWeightedKey.mockResolvedValue('usw2')
      routedBedrock = createRoutedBedrock(routingKey)
      await routedBedrock('anthropic.claude-3-5-haiku-20241022-v1:0')

      expect(mockSelectWeightedKey).toHaveBeenCalledWith(routingKey, {
        use1: 40,
        use2: 0,
        usw2: 40,
        euc1: 0,
      })
    })
  })

  describe('vercelOidcProvider integration', () => {
    test('should handle awsCredentialsProvider errors gracefully', async () => {
      const mockError = new Error('AWS provider failed')
      const mockProvider = vi.fn().mockRejectedValue(mockError)
      mockAwsCredentialsProvider.mockReturnValue(mockProvider)

      const result = await checkAwsCredentials()
      expect(result).toBe(false)
    })

    test('should handle non-Error objects and convert them to CredentialsProviderError', async () => {
      const mockError = 'String error'
      const mockProvider = vi.fn().mockRejectedValue(mockError)
      mockAwsCredentialsProvider.mockReturnValue(mockProvider)

      const result = await checkAwsCredentials()
      expect(result).toBe(false)
    })
  })

  describe('constants', () => {
    test('bedrockRegionMap should contain correct region mappings', () => {
      expect(bedrockRegionMap).toEqual({
        use1: 'us-east-1',
        use2: 'us-east-2',
        usw2: 'us-west-2',
        euc1: 'eu-central-1',
      })
    })

    test('regionPrefixMap should contain correct prefix mappings', () => {
      expect(regionPrefixMap).toEqual({
        use1: 'us',
        use2: 'us',
        usw2: 'us',
        euc1: 'eu',
      })
    })
  })
})
