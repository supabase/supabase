import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createCredentialChain, fromNodeProviderChain } from '@aws-sdk/credential-providers'
import { awsCredentialsProvider } from '@vercel/functions/oidc'

const credentialProvider = createCredentialChain(
  // Vercel OIDC provider will be used for staging/production
  awsCredentialsProvider({
    roleArn: process.env.AWS_BEDROCK_ROLE_ARN!,
  }),

  // AWS profile will be used for local development
  fromNodeProviderChain({
    profile: process.env.AWS_BEDROCK_PROFILE,
  })
)

export const bedrockRegionMap = {
  us: 'us-east-1',
  eu: 'eu-central-1',
  apac: 'ap-southeast-1',
} as const

type BedrockRegion = keyof typeof bedrockRegionMap

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
