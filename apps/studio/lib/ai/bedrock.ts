import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createCredentialChain, fromNodeProviderChain } from '@aws-sdk/credential-providers'
import { CredentialsProviderError } from '@smithy/property-provider'
import { awsCredentialsProvider } from '@vercel/functions/oidc'

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

/**
 * Weights for distributing requests across Bedrock regions.
 * Weights are proportional to our rate limits per model per region.
 */
const modelPerRegionRequestWeights: Record<BedrockModel, Record<BedrockRegion, number>> = {
  ['anthropic.claude-3-7-sonnet-20250219-v1:0']: {
    use1: 20,
    use2: 10,
    usw2: 10,
    euc1: 10,
  },
  ['anthropic.claude-3-5-haiku-20241022-v1:0']: {
    use1: 40,
    use2: 6,
    usw2: 40,
    euc1: 6,
  },
}

export const bedrockForRegion = (region: BedrockRegion) =>
  createAmazonBedrock({
    credentialProvider,
    region: bedrockRegionMap[region],
  })

/**
 * Selects a region based on a routing key using a consistent hashing algorithm.
 *
 * Ensures that the same key always maps to the same region
 * while distributing keys according to the weights per region.
 */
export async function selectBedrockRegion(routingKey: string, model: BedrockModel) {
  const regions = Object.keys(bedrockRegionMap) as BedrockRegion[]
  const encoder = new TextEncoder()
  const data = encoder.encode(routingKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)

  // Use first 4 bytes (32 bit integer)
  const hashInt = new DataView(hashBuffer).getUint32(0)

  const totalWeight = regions.reduce(
    (sum, region) => sum + modelPerRegionRequestWeights[model][region],
    0
  )

  let cumulativeWeight = 0
  const targetWeight = hashInt % totalWeight

  for (const region of regions) {
    cumulativeWeight += modelPerRegionRequestWeights[model][region]
    if (cumulativeWeight > targetWeight) {
      return region
    }
  }

  return regions[0]
}

export async function checkAwsCredentials() {
  try {
    const credentials = await credentialProvider()
    return !!credentials
  } catch (error) {
    return false
  }
}
