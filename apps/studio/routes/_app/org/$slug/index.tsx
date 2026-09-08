import { createFileRoute } from '@tanstack/react-router'

import { PageLayout } from '@/components/layouts/PageLayout/PageLayout'
import ProjectsPage from '@/pages/org/[slug]/index'

export const Route = createFileRoute('/_app/org/$slug/')({
  component: OrgSlugIndex,
  staticData: {
    orgLayoutTitle: 'Projects',
  },
})

function OrgSlugIndex() {
  return (
    <PageLayout title="Projects">
      <ProjectsPage dehydratedState={undefined} />
    </PageLayout>
  )
}
