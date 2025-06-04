import { createAmazonBedrock } from '@ai-sdk/amazon-bedrock'
import { createCredentialChain, fromNodeProviderChain } from '@aws-sdk/credential-providers'

const credentialProvider = createCredentialChain(
  // Env vars will be used for staging and production
  fromCustomEnv(),

  // Profile will be used for local development
  fromNodeProviderChain({
    profile: process.env.AWS_BEDROCK_PROFILE,
  })
)

export const bedrock = createAmazonBedrock({ credentialProvider })

export async function checkAwsCredentials() {
  try {
    const credentials = await credentialProvider()
    return !!credentials
  } catch (error) {
    return false
  }
}

/**
 * AWS credential provider that checks for custom Bedrock environment variables.
 */
function fromCustomEnv() {
  return async () => {
    const accessKeyId = process.env.AWS_BEDROCK_ACCESS_KEY_ID
    const secretAccessKey = process.env.AWS_BEDROCK_SECRET_ACCESS_KEY

    if (accessKeyId && secretAccessKey) {
      return {
        accessKeyId,
        secretAccessKey,
      }
    }

    throw new Error(
      'No AWS_BEDROCK_ACCESS_KEY_ID and AWS_BEDROCK_SECRET_ACCESS_KEY environment variables found.'
    )
  }
}
