import { getEncoding } from 'https://esm.sh/js-tiktoken@1.0.10'
import { ChatCompletionRequestMessage } from 'https://esm.sh/v113/openai@3.2.1'

const tokenizer = getEncoding('cl100k_base')

// Cache encoded results (huge speedup for repeated content)
const tokenCache = new Map<string, number>()

function encodeLength(text: string): number {
  if (!text) return 0
  if (tokenCache.has(text)) return tokenCache.get(text)!
  const length = tokenizer.encode(text).length
  tokenCache.set(text, length)
  return length
}

// Model config map (faster than switch)
const MODEL_CONFIG: Record<
  string,
  { tokensPerMessage: number; tokensPerName: number }
> = {
  'gpt-3.5-turbo-0301': { tokensPerMessage: 4, tokensPerName: -1 },
  'gpt-4-0314': { tokensPerMessage: 3, tokensPerName: 1 },
  'gpt-4o-mini-2024-07-18': { tokensPerMessage: 3, tokensPerName: 1 },
}

// Normalize model aliases
function resolveModel(model: string): string {
  if (model === 'gpt-3.5-turbo') return 'gpt-3.5-turbo-0301'
  if (model === 'gpt-4') return 'gpt-4-0314'
  return model
}

function getModelConfig(model: string) {
  const resolved = resolveModel(model)
  const config = MODEL_CONFIG[resolved]
  if (!config) throw new Error(`Unsupported model: ${model}`)
  return config
}

/**
 * Optimized message token count
 */
export function getMessageTokenCount(
  message: ChatCompletionRequestMessage,
  model = 'gpt-4o-mini-2024-07-18'
): number {
  const { tokensPerMessage, tokensPerName } = getModelConfig(model)

  let total = tokensPerMessage

  // Avoid Object.entries (faster direct access)
  if (message.role) total += encodeLength(message.role)
  if (message.content) total += encodeLength(message.content)
  if (message.name) {
    total += encodeLength(message.name) + tokensPerName
  }

  return total
}

/**
 * Optimized total request token count
 */
export function getChatRequestTokenCount(
  messages: ChatCompletionRequestMessage[],
  model = 'gpt-4o-mini-2024-07-18'
): number {
  let total = 3 // reply priming

  for (let i = 0; i < messages.length; i++) {
    total += getMessageTokenCount(messages[i], model)
  }

  return total
}

/**
 * Max token limits (extendable)
 */
const MAX_TOKENS: Record<string, number> = {
  'gpt-3.5-turbo-0301': 4097,
  'gpt-4-0314': 4097,
}

export function getMaxTokenCount(model: string): number {
  const resolved = resolveModel(model)
  const max = MAX_TOKENS[resolved]
  if (!max) throw new Error(`Unknown model: ${model}`)
  return max
}
