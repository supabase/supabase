import { z } from 'zod'

export const CSAT_COMMENT_MAX_LENGTH = 2000

export const CsatSurveyFormSchema = z.object({
  satisfied: z.boolean(),
  comment: z.string().trim().max(CSAT_COMMENT_MAX_LENGTH, 'Comment is too long'),
})

export type CsatSurveyFormValues = z.infer<typeof CsatSurveyFormSchema>

const CONVERSATION_ID_PATTERN = /^cnv_[a-z0-9]+$/

// The survey email links to ?helpful=yes and ?helpful=no; anything else preselects Yes, as the original page did.
function parseHelpful(helpful: string | undefined): boolean {
  return helpful !== 'no'
}

export const csatSurveyParamsSchema = z.object({
  conversation_id: z.preprocess(
    (value) => String(value)?.trim(),
    z.string().regex(CONVERSATION_ID_PATTERN)
  ),
  helpful: z.string().optional().transform(parseHelpful),
})
