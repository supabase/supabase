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

export default function PageSectionDemo() {
  return (
    <div className="w-full">
      <PageSection>
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Section Title</PageSectionTitle>
            <PageSectionDescription>
              This is a section with a title and description, plus optional actions.
            </PageSectionDescription>
          </PageSectionSummary>
          <PageSectionAside>
            <Button type="default" size="small">
              Action
            </Button>
          </PageSectionAside>
        </PageSectionMeta>
        <PageSectionContent>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-foreground-light">
                Section content goes here. This could be forms, tables, or any other content.
              </p>
            </CardContent>
          </Card>
        </PageSectionContent>
      </PageSection>
    </div>
  )
}
