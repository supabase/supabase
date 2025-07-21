import { openai } from '@ai-sdk/openai'
import { LanguageModel } from 'ai'
import { checkAwsCredentials, createRoutedBedrock } from './bedrock'

// Default behaviour here is to be throttled (e.g if this env var is not available, IS_THROTTLED should be true, unless specified 'false')
const IS_THROTTLED = process.env.IS_THROTTLED !== 'false'

const BEDROCK_PRO_MODEL = 'anthropic.claude-3-7-sonnet-20250219-v1:0'
const BEDROCK_NORMAL_MODEL = 'anthropic.claude-3-5-haiku-20241022-v1:0'
const OPENAI_MODEL = 'gpt-4.1-2025-04-14'

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
export async function getModel(routingKey?: string, isLimited?: boolean): Promise<ModelResponse> {
  const hasAwsCredentials = await checkAwsCredentials()
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY

  if (hasAwsCredentials) {
    const bedrockModel = IS_THROTTLED || isLimited ? BEDROCK_NORMAL_MODEL : BEDROCK_PRO_MODEL
    const bedrock = createRoutedBedrock(routingKey)

    return {
      model: await bedrock(bedrockModel),
    }
  }

  if (hasOpenAIKey) {
    return {
      model: openai(OPENAI_MODEL),
    }
  }

  return {
    error: new Error(ModelErrorMessage),
  }
}
