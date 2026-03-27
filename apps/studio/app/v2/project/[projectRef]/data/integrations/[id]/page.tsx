'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect } from 'react'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'
import { GenericSkeletonLoader } from 'ui-patterns/ShimmeringLoader'

export default function DataIntegrationRootPage() {
  const params = useParams()
  const router = useRouter()
  const projectRef = params?.projectRef as string | undefined
  const id = params?.id as string | undefined

  useEffect(() => {
    if (!projectRef || !id) return
    void router.replace(`/v2/project/${projectRef}/data/integrations/${id}/overview`)
  }, [projectRef, id, router])

  return (
    <PageContainer size="full">
      <PageSection>
        <PageSectionContent>
          <GenericSkeletonLoader />
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}
