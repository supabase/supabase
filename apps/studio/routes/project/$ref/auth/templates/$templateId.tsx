import { createFileRoute } from '@tanstack/react-router'

import TemplatePage from '@/pages/project/[ref]/auth/templates/[templateId]'

export const Route = createFileRoute('/project/$ref/auth/templates/$templateId')({
  component: AuthTemplateDetailRoute,
  staticData: {
    authLayoutTitle: 'Emails',
  },
})

function AuthTemplateDetailRoute() {
  return <TemplatePage dehydratedState={undefined} />
}
