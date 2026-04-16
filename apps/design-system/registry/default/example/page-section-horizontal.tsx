import { Card, CardContent } from 'ui'
import {
  PageSection,
  PageSectionContent,
  PageSectionDescription,
  PageSectionMeta,
  PageSectionSummary,
  PageSectionTitle,
} from 'ui-patterns/PageSection'

export default function PageSectionHorizontal() {
  return (
    <div className="w-full">
      <PageSection orientation="horizontal">
        <PageSectionMeta>
          <PageSectionSummary>
            <PageSectionTitle>Section Title</PageSectionTitle>
            <PageSectionDescription>
              In horizontal orientation, the summary (title and description) appears on the left,
              with content arranged on the right on larger screens. This is useful for detailed
              sections where you want to maintain context while viewing content.
            </PageSectionDescription>
          </PageSectionSummary>
        </PageSectionMeta>
        <PageSectionContent>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-foreground-light">
                The content area appears alongside the summary in a horizontal layout. On smaller
                screens, it will stack vertically.
              </p>
            </CardContent>
          </Card>
        </PageSectionContent>
      </PageSection>
    </div>
  )
}
