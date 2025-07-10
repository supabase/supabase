import { openai } from '@ai-sdk/openai'
import { LanguageModel } from 'ai'
import {
  bedrockForRegion,
  BedrockRegion,
  checkAwsCredentials,
  selectBedrockRegion,
} from './bedrock'

export const modelsByProvider = {
  bedrock: {
    us1: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
    us2: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
    us3: 'us.anthropic.claude-3-7-sonnet-20250219-v1:0',
    eu: 'eu.anthropic.claude-3-7-sonnet-20250219-v1:0',
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
 *
 * An optional routing key can be provided to distribute requests across
 * different Bedrock regions.
 */
export async function getModel(routingKey?: string): Promise<ModelResponse> {
  const hasAwsCredentials = await checkAwsCredentials()
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY

  if (hasAwsCredentials) {
    // Select the Bedrock region based on the routing key
    const bedrockRegion: BedrockRegion = routingKey ? await selectBedrockRegion(routingKey) : 'us1'
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
