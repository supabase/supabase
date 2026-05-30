import { Button, Card, CardContent } from 'ui'
import {
  PageSection,
  PageSectionAside,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

export default function PageSectionWithAside() {
  return (
    <div className="w-full">
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Section Title</PageSectionTitle>
            <PageSectionDescription>
              This demonstrates PageSection with actions in the Aside component.
            </PageSectionDescription>
          </PageSectionSummary>
          <PageSectionAside>
            <Button type="default" size="small">
              Secondary
            </Button>
            <Button type="primary" size="small">
              Primary Action
            </Button>
          </PageSectionAside>
        </PageSectionMeta>
        <PageSectionContent>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-foreground-light">
                The Aside component positions actions horizontally aligned with the section summary,
                providing a clear separation between description and actions.
              </p>
            </CardContent>
          </Card>
        </PageSectionContent>
      </PageSection>
    </div>
  )
}
