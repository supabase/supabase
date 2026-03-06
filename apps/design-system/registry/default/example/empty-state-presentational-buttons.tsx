import { Plus } from 'lucide-react'
import { Button } from 'ui'
import { EmptyStatePresentational } from 'ui-patterns'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

export default function EmptyStatePresentationalIcon() {
  return (
    <div className="w-full">
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Providers</PageSectionTitle>
          </PageSectionSummary>
          <PageSectionAside>
            <Button size="tiny" type="primary" icon={<Plus size={14} />}>
              Add provider
            </Button>
          </PageSectionAside>
        </PageSectionMeta>
        <PageSectionContent>
          <EmptyStatePresentational
            title="Add a provider"
            description="Use third-party authentication systems to access your project."
          >
            <Button size="tiny" type="default" icon={<Plus size={14} />}>
              Add provider
            </Button>
          </EmptyStatePresentational>
        </PageSectionContent>
      </PageSection>
    </div>
  )
}
