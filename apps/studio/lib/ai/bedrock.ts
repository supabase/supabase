import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createCredentialChain, fromNodeProviderChain } from '@aws-sdk/credential-providers'
import { CredentialsProviderError } from '@smithy/property-provider'
import { awsCredentialsProvider } from '@vercel/functions/oidc'
import { selectWeightedKey } from './util'

const credentialProvider = createCredentialChain(
  // Vercel OIDC provider will be used for staging/production
  vercelOidcProvider,

  // AWS profile will be used for local development
  fromNodeProviderChain({
    profile: process.env.AWS_BEDROCK_PROFILE,
  })
)

/**
 * Creates a Vercel OIDC provider for AWS credentials.
 *
 * Wraps `awsCredentialsProvider` to properly handle errors
 * so that it can be used in a credential chain.
 */
async function vercelOidcProvider() {
  try {
    return await awsCredentialsProvider({
      roleArn: process.env.AWS_BEDROCK_ROLE_ARN!,
    })()
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Failed to create Vercel OIDC provider'

    // Re-throw using the correct error type and `tryNextLink` option
    throw new CredentialsProviderError(message, {
      tryNextLink: true,
    })
  }
}

export async function checkAwsCredentials() {
  try {
    const credentials = await credentialProvider()
    return !!credentials
  } catch (error) {
    return false
  }
}

export const bedrockRegionMap = {
  use1: 'us-east-1',
  use2: 'us-east-2',
  usw2: 'us-west-2',
  euc1: 'eu-central-1',
} as const

export type BedrockRegion = keyof typeof bedrockRegionMap

export const regionPrefixMap: Record<BedrockRegion, string> = {
  use1: 'us',
  use2: 'us',
  usw2: 'us',
  euc1: 'eu',
}

export type BedrockModel =
  | 'anthropic.claude-3-7-sonnet-20250219-v1:0'
  | 'anthropic.claude-3-5-haiku-20241022-v1:0'

export type RegionWeights = Record<BedrockRegion, number>

/**
 * Weights for distributing requests across Bedrock regions.
 * Weights are proportional to our rate limits per model per region.
 */
const modelRegionWeights: Record<BedrockModel, RegionWeights> = {
  ['anthropic.claude-3-7-sonnet-20250219-v1:0']: {
    use1: 40,
    use2: 10,
    usw2: 10,
    euc1: 10,
  },
  ['anthropic.claude-3-5-haiku-20241022-v1:0']: {
    use1: 40,
    use2: 0,
    usw2: 40,
    euc1: 0,
  },
}

/**
 * Creates a Bedrock client that routes requests to different regions
 * based on a routing key.
 *
 * Used to load balance requests across multiple regions depending on
 * their capacities.
 */
export function createRoutedBedrock(routingKey?: string) {
  return async (modelId: BedrockModel) => {
    const regionWeights = modelRegionWeights[modelId]

    // Select the Bedrock region based on the routing key and the model
    const bedrockRegion = routingKey
      ? await selectWeightedKey(routingKey, regionWeights)
      : // There's a few places where getModel is called without a routing key
        // Will cause disproportionate load on use1 region
        'use1'

    const bedrock = createAmazonBedrock({
      credentialProvider,
      region: bedrockRegionMap[bedrockRegion],
    })

    // Cross-region models require the region prefix
    const modelName = `${regionPrefixMap[bedrockRegion]}.${modelId}`

    return bedrock(modelName)
  }
}
