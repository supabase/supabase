import { z } from 'zod'

export const CSAT_COMMENT_MAX_LENGTH = 2000

export const CsatSurveyFormSchema = z.object({
  satisfied: z.boolean(),
  comment: z.string().trim().max(CSAT_COMMENT_MAX_LENGTH, 'Comment is too long'),
})

export type CsatSurveyFormValues = z.infer<typeof CsatSurveyFormSchema>
