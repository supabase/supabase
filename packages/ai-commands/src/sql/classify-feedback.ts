import { generateObject } from 'ai'
import { openai as openaiProvider } from '@ai-sdk/openai'
import { z } from 'zod'
import { ContextLengthError } from '../errors'

// Given a prompt from the feedback widget, classify it as support, feedback, or unknown.
export async function classifyFeedback(prompt: string) {
  try {
    const { object } = await generateObject({
      model: openaiProvider('gpt-4o'),
      temperature: 0,

      schema: z.object({
        feedback_category: z.enum(['support', 'feedback', 'unknown']),
      }),
      prompt: `
    Classify the following feedback as ONE of: support, feedback, unknown.
    - support: bug reports, help requests, or issues
    - feedback: feature requests or suggestions
    - unknown: unclear or unrelated

    If you can't determine support or feedback, always output "unknown".

    Only output a JSON object in this format: { "feedback_category": "support|feedback|unknown" }

    Examples:
    Feedback: "My log is shutdown.  2. for a week now, the scanner has not been able to send trade alert signals successfully to my telegram. 3. countless numbers of troubleshooting have been done but no result."
    Response: { "feedback_category": "support" }

    Feedback:  "I have reached the storage limit for my project and my plan. I cannot understand how I can expand the storage space in my project."
    Response: { "feedback_category": "support" }

    Feedback: "Please delete the project x in my account"
    Response: { "feedback_category": "unknown" }

    Feedback: "My billing page is broken"
    Response: { "feedback_category": "support" }

    Feedback: "Can you add more integrations?"
    Response: { "feedback_category": "feedback" }

    Feedback: "I am trying to pause my Pro project"
    Response: { "feedback_category": "feedback" }

    Feedback: "${prompt}"
    Response:
  `,
    })

    return object.feedback_category
  } catch (error) {
    if (error instanceof Error && 'code' in error && error.code === 'context_length_exceeded') {
      throw new ContextLengthError()
    }
    throw error
  }
}
