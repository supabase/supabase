import { getEncoding } from 'js-tiktoken'
import type OpenAI from 'openai'

export const tokenizer = getEncoding('cl100k_base')

// Define constants for versions
const MODEL_VERSIONS = {
  'gpt-3.5-turbo': 'gpt-3.5-turbo-0301',
  'gpt-4': 'gpt-4-0314',
  'gpt-3.5-turbo-0301': 4097,
  'gpt-4-0314': 4097,
  'gpt-4o-mini-2024-07-18': 4097,
}

/**
 * Count the tokens for multi-message chat completion requests
 */
export function getChatRequestTokenCount(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  model = 'gpt-4o-mini-2024-07-18'
): number {
  const tokensPerRequest = 3 // every reply is primed with <|im_start|> <|im_sep|>
  const numTokens = messages.reduce((acc, message) => acc + getMessageTokenCount(message, model), 0)

  return numTokens + tokensPerRequest
}

/**
 * Count the tokens for a single message within a chat completion request
 */
export function getMessageTokenCount(
  message: OpenAI.Chat.Completions.ChatCompletionMessageParam,
  model = 'gpt-4o-mini-2024-07-18'
): number {
  // Handle default versions for gpt-3.5-turbo and gpt-4 with warnings
  const effectiveModel = MODEL_VERSIONS[model] || model
  
  // Token adjustments based on the model
  const tokenConfig = {
    'gpt-3.5-turbo-0301': { tokensPerMessage: 4, tokensPerName: -1 },
    'gpt-4o-mini-2024-07-18': { tokensPerMessage: 3, tokensPerName: 1 },
    'gpt-4-0314': { tokensPerMessage: 3, tokensPerName: 1 },
  }

  const { tokensPerMessage, tokensPerName } = tokenConfig[effectiveModel] || { tokensPerMessage: 3, tokensPerName: 1 }
  
  // Calculate tokens for the message
  return Object.entries(message).reduce((acc, [key, value]) => {
    acc += tokenizer.encode(value).length
    if (key === 'name') {
      acc += tokensPerName
    }
    return acc
  }, tokensPerMessage)
}

/**
 * Get the maximum number of tokens for a model's context.
 *
 * Includes tokens in both message and completion.
 */
export function getMaxTokenCount(model: string): number {
  const modelMaxTokens = MODEL_VERSIONS[model]
  
  if (!modelMaxTokens) {
    throw new Error(`Unknown model '${model}'`)
  }

  return modelMaxTokens
}
