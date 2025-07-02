import { openai } from '@ai-sdk/openai'
import { LanguageModel } from 'ai'
import { bedrockForRegion, checkAwsCredentials, selectBedrockRegion } from './bedrock'

export const modelsByProvider = {
  bedrock: {
    us: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
    eu: 'eu.anthropic.claude-3-7-sonnet-20250219-v1:0',
    apac: 'apac.anthropic.claude-3-7-sonnet-20250219-v1:0',
  },
  openai: 'gpt-4.1-2025-04-14',
}

export type ModelSuccess = {
  model: LanguageModel
  error?: never
}

export type ModelError = {
  model?: never
  error: Error
}

export type ModelResponse = ModelSuccess | ModelError

export const ModelErrorMessage =
  'No valid AI model available. Please set up a local AWS profile to use Bedrock, or pass an OPENAI_API_KEY to use OpenAI.'

/**
 * Retrieves the appropriate AI model based on available credentials.
 */
export async function getModel(routingKey: string): Promise<ModelResponse> {
  const hasAwsCredentials = await checkAwsCredentials()
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY

  if (hasAwsCredentials) {
    if (!process.env.AWS_BEDROCK_REGION) {
      return {
        error: new Error('AWS_BEDROCK_REGION is not set'),
      }
    }

    // Select the Bedrock region based on the routing key
    const bedrockRegion = await selectBedrockRegion(routingKey)
    const bedrock = bedrockForRegion(bedrockRegion)
    const modelName = modelsByProvider.bedrock[bedrockRegion]

    return {
      model: bedrock(modelName),
    }
  }

  if (hasOpenAIKey) {
    return {
      model: openai(modelsByProvider.openai),
    }
  }

  return {
    error: new Error(ModelErrorMessage),
  }
}
