import { Compass } from 'lucide-react'
import { EmptyStatePresentational } from 'ui-patterns/EmptyStatePresentational'
import { PageContainer } from 'ui-patterns/PageContainer'
import { PageSection, PageSectionContent } from 'ui-patterns/PageSection'

export const ExplorerPage = () => {
  return (
    <PageContainer size="default">
      <PageSection>
        <PageSectionContent>
          <EmptyStatePresentational
            icon={Compass}
            title="Explorer is coming soon"
            description="This page is a placeholder for the Explorer feature."
          />
        </PageSectionContent>
      </PageSection>
    </PageContainer>
  )
}
