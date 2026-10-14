const CONVERSATION_ID_PATTERN = /^cnv_[a-z0-9]+$/

export type CsatSurveyParams =
  | { status: 'invalid' }
  | { status: 'valid'; conversationId: string; initialSatisfied: boolean }

export function parseCsatSurveyParams({
  conversation_id,
  helpful,
}: {
  conversation_id?: string
  helpful?: string
}): CsatSurveyParams {
  const conversationId = conversation_id?.trim() ?? ''
  if (!CONVERSATION_ID_PATTERN.test(conversationId)) {
    return { status: 'invalid' }
  }
  return { status: 'valid', conversationId, initialSatisfied: parseHelpful(helpful) }
}

// The survey email links to ?helpful=yes and ?helpful=no; anything else preselects Yes, as the original page did.
function parseHelpful(helpful: string | undefined): boolean {
  return helpful !== 'no'
}
