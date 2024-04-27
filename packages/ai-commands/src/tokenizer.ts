import { AutoTokenizer, PreTrainedTokenizer } from '@xenova/transformers'

export interface Message {
  role: 'system' | 'user' | 'assistant'
  content: string
}

function isNumberArray(value: any): value is number[] {
  return Array.isArray(value) && typeof value[0] === 'number'
}

/**
 * Gets the Hugging Face model path for the given model.
 */
function getModelPath(model: string) {
  switch (model) {
    case 'llama3':
    case 'llama3-70b-8192':
    case 'llama3-8b-8192':
      return 'Xenova/llama-3-tokenizer'
    case 'gpt-4-turbo':
    case 'gpt-4-turbo-preview':
    case 'gpt-4-turbo-2024-04-09':
    case 'gpt-4-0125-preview':
    case 'gpt-4-1106-preview':
    case 'gpt-4-vision-preview':
    case 'gpt-4-1106-vision-preview':
    case 'gpt-4-32k':
    case 'gpt-4-32k-0613':
    case 'gpt-4':
    case 'gpt-4-0613':
    case 'gpt-4-0314':
    case 'gpt-3.5-turbo':
    case 'gpt-3.5-turbo-0125':
    case 'gpt-3.5-turbo-1106':
    case 'gpt-3.5-turbo-16k':
    case 'gpt-3.5-turbo-16k-0613':
    case 'gpt-3.5-turbo-instruct':
    case 'gpt-3.5-turbo-0613':
    case 'gpt-3.5-turbo-0301':
      return 'Xenova/gpt-4'
    default:
      throw new Error(`Unknown model '${model}'`)
  }
}

const tokenizers = new Map<string, PreTrainedTokenizer>()

/**
 * Creates a tokenizer for the specified model using
 * Transformers.js and config downloaded from Hugging Face.
 *
 * Caches the tokenizer in memory for subsequent uses.
 */
async function getTokenizer(model: string) {
  const cachedTokenizer = tokenizers.get(model)

  if (cachedTokenizer) {
    return cachedTokenizer
  }

  const modelPath = getModelPath(model)
  const tokenizer = await AutoTokenizer.from_pretrained(modelPath)

  tokenizers.set(model, tokenizer)

  return tokenizer
}

/**
 * Tokenizes plain text for the specified model.
 */
export async function tokenize(content: string, model: string) {
  const tokenizer = await getTokenizer(model)

  const tokens = tokenizer.encode(content)

  return tokens
}

/**
 * Tokenizes chat messages for the specified model.
 *
 * Includes delimiter tokens like <|im_start|>, <|im_end|>, etc
 */
export async function tokenizeChat(messages: Message[], model: string) {
  const tokenizer = await getTokenizer(model)

  const tokens = tokenizer.apply_chat_template(messages, {
    tokenize: true,
    return_tensor: false,
    add_generation_prompt: true,
  })

  if (!isNumberArray(tokens)) {
    throw new Error(`Unexpected tokenizer output. Expected number array.`)
  }

  return tokens
}

/**
 * Counts the number of tokens in plain text for the specified model.
 */
export async function countTokens(content: string, model: string) {
  const tokens = await tokenize(content, model)

  return tokens.length
}

/**
 * Counts the number of tokens in the chat messages for the specified model.
 *
 * Accounts for delimiter tokens like <|im_start|>, <|im_end|>, etc
 */
export async function countChatTokens(messages: Message[], model: string) {
  const tokens = await tokenizeChat(messages, model)

  return tokens.length
}

/**
 * Get the maximum number of tokens in a model's context window.
 *
 * Defaults to 4096 for unknown models.
 */
export function getContextWindow(model: string): number {
  switch (model) {
    case 'gpt-4-turbo':
    case 'gpt-4-turbo-preview':
    case 'gpt-4-turbo-2024-04-09':
    case 'gpt-4-0125-preview':
    case 'gpt-4-1106-preview':
    case 'gpt-4-vision-preview':
    case 'gpt-4-1106-vision-preview':
      return 128000
    case 'gpt-4-32k':
    case 'gpt-4-32k-0613':
      return 32768
    case 'gpt-3.5-turbo':
    case 'gpt-3.5-turbo-0125':
    case 'gpt-3.5-turbo-1106':
    case 'gpt-3.5-turbo-16k':
    case 'gpt-3.5-turbo-16k-0613':
      return 16385
    case 'gpt-4':
    case 'gpt-4-0613':
    case 'llama3':
    case 'llama3-70b-8192':
    case 'llama3-8b-8192':
      return 8192
    case 'gpt-4-0314':
    case 'gpt-3.5-turbo-instruct':
    case 'gpt-3.5-turbo-0613':
    case 'gpt-3.5-turbo-0301':
    default:
      return 4096
  }
}

/**
 * Remove conversation messages as needed until the entire
 * request fits the context window of the specified model.
 *
 * @param systemMessages The initial system messages that must always exist
 * @param conversationMessages The conversation messages that can be trimmed if necessary
 * @param model The model that will be responding to these messages
 * @param maxCompletionTokens The number of response tokens to leave room for
 *
 * @returns The final set of messages that will fit in the context window of the model.
 */
export async function capMessages(
  systemMessages: Message[],
  conversationMessages: Message[],
  model: string,
  maxCompletionTokens = 0
) {
  const contextWindow = getContextWindow(model)
  const trimmedConversationMessages = [...conversationMessages]

  let tokenCount = await countChatTokens([...systemMessages, ...conversationMessages], model)

  // Remove earlier conversation messages until we fit
  while (tokenCount + maxCompletionTokens >= contextWindow) {
    trimmedConversationMessages.shift()

    tokenCount = await countChatTokens([...systemMessages, ...conversationMessages], model)
  }

  return [...systemMessages, ...trimmedConversationMessages]
}
