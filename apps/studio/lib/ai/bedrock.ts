import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { fromNodeProviderChain } from '@aws-sdk/credential-providers'

const credentialProvider = fromNodeProviderChain({
  profile: process.env.AWS_BEDROCK_PROFILE,
})

export const bedrock = createAmazonBedrock({ credentialProvider })

export async function checkAwsCredentials() {
  try {
    const credentials = await credentialProvider()
    return !!credentials
  } catch (error) {
    return false
  }
}
