'use server'

import { anthropic } from '@ai-sdk/anthropic'
import { generateObject, NoObjectGeneratedError } from 'ai'

import { voiceDraftSchema, type VoiceDraft } from '@/lib/ai/voice-draft'

export type ExtractVoiceDraftState = { draft?: VoiceDraft; error?: string }

export async function extractVoiceDraft(transcript: string): Promise<ExtractVoiceDraftState> {
  const trimmed = transcript.trim()
  if (!trimmed) {
    return { error: 'Record or type an update first.' }
  }

  try {
    const { object } = await generateObject({
      model: anthropic('claude-sonnet-5'),
      schema: voiceDraftSchema,
      system: `You turn a salesperson's spoken, in-the-field update into a single structured CRM draft entry (a lead, a quote, or an activity/follow-up) for them to review and edit before saving.

Current date and time: ${new Date().toISOString()}. Resolve relative dates ("tomorrow", "Friday", "next week") against this.

Only populate the object that matches "entity"; leave the other two null. Do not invent details that were not said — leave optional fields null rather than guessing.`,
      prompt: trimmed,
    })

    return { draft: object }
  } catch (error) {
    if (NoObjectGeneratedError.isInstance(error)) {
      return { error: "Couldn't understand that update. Try rephrasing or edit the transcript." }
    }
    return { error: error instanceof Error ? error.message : 'Something went wrong.' }
  }
}
