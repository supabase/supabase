import { createFileRoute } from '@tanstack/react-router'

import CsatSurveyPage from '@/pages/support/csat'

export const Route = createFileRoute('/support/csat')({
  component: CsatSurveyRoute,
})

function CsatSurveyRoute() {
  return <CsatSurveyPage dehydratedState={undefined} />
}
