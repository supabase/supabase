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
  us1: 'us-east-1',
  us3: 'us-west-2',
} as const

export type BedrockRegion = keyof typeof bedrockRegionMap

export const bedrockForRegion = (region: BedrockRegion) =>
  createAmazonBedrock({
    credentialProvider,
    region: bedrockRegionMap[region],
  })

/**
 * Selects a region based on a routing key using a consistent hashing algorithm.
 *
 * Ensures that the same key always maps to the same region
 * while distributing keys evenly across available regions.
 */
export async function selectBedrockRegion(routingKey: string) {
  const regions = Object.keys(bedrockRegionMap) as BedrockRegion[]
  const encoder = new TextEncoder()
  const data = encoder.encode(routingKey)
  const hashBuffer = await crypto.subtle.digest('SHA-256', data)

  // Use first 4 bytes (32 bit integer)
  const hashInt = new DataView(hashBuffer).getUint32(0)

  // Use modulo to map to available regions
  const regionIndex = hashInt % regions.length

  return regions[regionIndex]
}

export async function checkAwsCredentials() {
  try {
    const credentials = await credentialProvider()
    return !!credentials
  } catch (error) {
    return false
  }
}
