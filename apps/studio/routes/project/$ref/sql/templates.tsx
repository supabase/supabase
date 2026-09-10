import { createFileRoute } from '@tanstack/react-router'

import SqlTemplates from '@/pages/project/[ref]/sql/templates'

export const Route = createFileRoute('/project/$ref/sql/templates')({
  component: SQLTemplatesRoute,
})

function SQLTemplatesRoute() {
  return <SqlTemplates dehydratedState={undefined} />
}
