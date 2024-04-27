import OpenAI from 'openai'

export const supportedModels = [
  'llama3',
  'llama3-70b-8192',
  'llama3-8b-8192',
  'gpt-4-turbo',
  'gpt-4-turbo-preview',
  'gpt-4-turbo-2024-04-09',
  'gpt-4-0125-preview',
  'gpt-4-1106-preview',
  'gpt-4',
  'gpt-4-0613',
  'gpt-4-0314',
  'gpt-3.5-turbo',
  'gpt-3.5-turbo-0125',
  'gpt-3.5-turbo-1106',
]

export const supportedEmbeddingModels = ['text-embedding-ada-002']

/**
 * Instantiates OpenAI client while checking and validating
 * environment variables.
 *
 * Allows you to use your own OpenAI-compatible provider.
 *
 * Uses the following env vars:
 * - OPENAI_API_KEY (backwards compatible with previous OPENAI_KEY)
 * - OPENAI_BASE_URL
 * - OPENAI_MODEL
 */
export function createOpenAiClient() {
  const apiKey = process.env.OPENAI_API_KEY ?? process.env.OPENAI_KEY
  const baseURL = process.env.OPENAI_BASE_URL
  const model = process.env.OPENAI_MODEL

  if (!apiKey) {
    return {
      error: new Error(
        'No OPENAI_API_KEY set. Create this environment variable to use AI features.'
      ),
    }
  }

  if (!baseURL) {
    return {
      error: new Error(
        'No OPENAI_BASE_URL set. Create this environment variable to use AI features.'
      ),
    }
  }

  if (!model) {
    return {
      error: new Error('No OPENAI_MODEL set. Create this environment variable to use AI features.'),
    }
  }

  if (!supportedModels.includes(model)) {
    return {
      error: new Error(
        `The following models are supported for OPENAI_MODEL: ${JSON.stringify(supportedModels)}`
      ),
    }
  }

  const openai = new OpenAI({ apiKey, baseURL })

  return { openai, model }
}

/**
 * Instantiates OpenAI client for embedding models while checking and validating
 * environment variables.
 *
 * Allows you to use separate OpenAI-compatible providers for embedding models vs. language models.
 *
 * Uses the following env vars:
 * - OPENAI_EMBEDDING_API_KEY
 * - OPENAI_EMBEDDING_BASE_URL
 * - OPENAI_EMBEDDING_MODEL
 *
 * Falls back to these default env vars if the above vars don't exist:
 * - OPENAI_API_KEY
 * - OPENAI_BASE_URL
 */
export function createOpenAiEmbeddingClient() {
  const apiKey =
    process.env.OPENAI_EMBEDDING_API_KEY ?? process.env.OPENAI_API_KEY ?? process.env.OPENAI_KEY
  const baseURL = process.env.OPENAI_EMBEDDING_BASE_URL ?? process.env.OPENAI_BASE_URL
  const model = process.env.OPENAI_EMBEDDING_MODEL

  if (!apiKey) {
    return {
      error: new Error(
        'No OPENAI_EMBEDDING_API_KEY set. Create this environment variable to use AI embedding features.'
      ),
    }
  }

  if (!baseURL) {
    return {
      error: new Error(
        'No OPENAI_EMBEDDING_BASE_URL set. Create this environment variable to use AI embedding features.'
      ),
    }
  }

  if (!model) {
    return {
      error: new Error(
        'No OPENAI_EMBEDDING_MODEL set. Create this environment variable to use AI embedding features.'
      ),
    }
  }

  if (!supportedEmbeddingModels.includes(model)) {
    return {
      error: new Error(
        `The following models are supported for OPENAI_EMBEDDING_MODEL: ${JSON.stringify(supportedEmbeddingModels)}`
      ),
    }
  }

  const openai = new OpenAI({ apiKey, baseURL })

  return { openai, model }
}
