import type OpenAI from 'openai'

// Average number of characters per token for English text with OpenAI's tokenizers.
// We estimate instead of tokenizing exactly, because bundling a tokenizer (js-tiktoken) adds
// ~3 MB to the edge function that serves the docs chat, which exceeds the Vercel Edge Function
// size limit.
const CHARS_PER_TOKEN = 4

/**
 * Estimate the number of tokens in a string.
 */
export function estimateTokenCount(text: string): number {
  return Math.ceil(text.length / CHARS_PER_TOKEN)
}

/**
 * Estimate the tokens for multi-message chat completion requests
 */
export function getChatRequestTokenCount(
  messages: OpenAI.Chat.Completions.ChatCompletionMessageParam[],
  model = 'gpt-4o-mini-2024-07-18'
): number {
  const tokensPerRequest = 3 // every reply is primed with <|im_start|>assistant<|im_sep|>
  const numTokens = messages.reduce((acc, message) => acc + getMessageTokenCount(message, model), 0)

  return numTokens + tokensPerRequest
}

/**
 * Estimate the tokens for a single message within a chat completion request
 *
 * See "Counting tokens for chat API calls"
 * from https://github.com/openai/openai-cookbook/blob/834181d5739740eb8380096dac7056c925578d9a/examples/How_to_count_tokens_with_tiktoken.ipynb
 */
export function getMessageTokenCount(
  message: OpenAI.Chat.Completions.ChatCompletionMessageParam,
  model = 'gpt-4o-mini-2024-07-18'
): number {
  let tokensPerMessage: number
  let tokensPerName: number

  switch (model) {
    case 'gpt-3.5-turbo':
      console.warn(
        'Warning: gpt-3.5-turbo may change over time. Returning num tokens assuming gpt-3.5-turbo-0301.'
      )
      return getMessageTokenCount(message, 'gpt-3.5-turbo-0301')
    case 'gpt-4':
      console.warn('Warning: gpt-4 may change over time. Returning num tokens assuming gpt-4-0314.')
      return getMessageTokenCount(message, 'gpt-4-0314')
    case 'gpt-3.5-turbo-0301':
      tokensPerMessage = 4 // every message follows <|start|>{role/name}\n{content}<|end|>\n
      tokensPerName = -1 // if there's a name, the role is omitted
      break
    case 'gpt-4o-mini-2024-07-18':
      tokensPerMessage = 3
      tokensPerName = 1
      break
    case 'gpt-4-0314':
      tokensPerMessage = 3
      tokensPerName = 1
      break
    default:
      throw new Error(
        `Unknown model '${model}'. See https://github.com/openai/openai-python/blob/main/chatml.md for information on how messages are converted to tokens.`
      )
  }

  return Object.entries(message).reduce((acc, [key, value]) => {
    acc += estimateTokenCount(typeof value === 'string' ? value : (JSON.stringify(value) ?? ''))
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
  switch (model) {
    case 'gpt-3.5-turbo':
      console.warn(
        'Warning: gpt-3.5-turbo may change over time. Returning max num tokens assuming gpt-3.5-turbo-0301.'
      )
      return getMaxTokenCount('gpt-3.5-turbo-0301')
    case 'gpt-4':
      console.warn(
        'Warning: gpt-4 may change over time. Returning max num tokens assuming gpt-4-0314.'
      )
      return getMaxTokenCount('gpt-4-0314')
    case 'gpt-3.5-turbo-0301':
      return 4097
    case 'gpt-4-0314':
      return 4097
    case 'gpt-4o-mini-2024-07-18':
      return 4097
    default:
      throw new Error(`Unknown model '${model}'`)
  }
}
