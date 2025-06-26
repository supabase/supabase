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

export const bedrock = createAmazonBedrock({
  credentialProvider,
  region: process.env.AWS_BEDROCK_REGION,
})

export async function checkAwsCredentials() {
  try {
    const credentials = await credentialProvider()
    return !!credentials
  } catch (error) {
    return false
  }
}
