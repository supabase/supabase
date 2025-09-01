import { openai } from '@ai-sdk/openai'
import { LanguageModel } from 'ai'
import { checkAwsCredentials, createRoutedBedrock } from './bedrock'

const BEDROCK_PRO_MODEL = 'anthropic.claude-3-7-sonnet-20250219-v1:0'
const BEDROCK_NORMAL_MODEL = 'openai.gpt-oss-120b-1:0'
const OPENAI_MODEL = 'gpt-4.1-2025-04-14'

export type ModelSuccess = {
  model: LanguageModel
  supportsCachePoint: boolean
  error?: never
}

export type ModelError = {
  model?: never
  supportsCachePoint?: never
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
  // Default behaviour here is to be throttled (e.g if this env var is not available, isThrottled should be true, unless specified 'false')
  const isThrottled = process.env.IS_THROTTLED !== 'false'

  const hasAwsCredentials = await checkAwsCredentials()

  const hasAwsBedrockRoleArn = !!process.env.AWS_BEDROCK_ROLE_ARN
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY

  if (hasAwsBedrockRoleArn && hasAwsCredentials) {
    const bedrockModel = isThrottled || isLimited ? BEDROCK_NORMAL_MODEL : BEDROCK_PRO_MODEL
    const bedrock = createRoutedBedrock(routingKey)
    const { model, supportsCachePoint } = await bedrock(bedrockModel)

    return { model, supportsCachePoint }
  }

  // [Joshen] Only for local/self-hosted, hosted should always only use bedrock
  if (hasOpenAIKey) {
    return { model: openai(OPENAI_MODEL), supportsCachePoint: false }
  }

  return { error: new Error(ModelErrorMessage) }
}
