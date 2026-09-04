import { createOpenAI } from '@ai-sdk/openai'
import type { LanguageModelCallOptions } from 'ai'

import { env } from '../env'

const ASSISTANT_MODELS = {
  'gpt-5.6-luna': 'medium',
  'gpt-5.4-nano': 'low',
  'gpt-5.3-codex': 'low',
} as const satisfies Record<string, NonNullable<LanguageModelCallOptions['reasoning']>>

export type AssistantModelId = keyof typeof ASSISTANT_MODELS

export const DEFAULT_ASSISTANT_MODEL_ID: AssistantModelId = 'gpt-5.6-luna'

function isAssistantModelId(id: string): id is AssistantModelId {
  return Object.hasOwn(ASSISTANT_MODELS, id)
}

/** Resolve Studio's requested model and return options that spread into `streamText`. */
export function getAssistantModel(requested?: string) {
  const apiKey = env.openaiApiKey
  if (!apiKey) throw new Error('OPENAI_API_KEY not available')

  const id = requested && isAssistantModelId(requested) ? requested : DEFAULT_ASSISTANT_MODEL_ID
  return {
    model: createOpenAI({ apiKey })(id),
    reasoning: ASSISTANT_MODELS[id],
    providerOptions: { openai: { store: false } },
  }
}
