import { PageSection } from 'ui-patterns/PageSection'
import { Card, CardContent } from 'ui'

export default function PageSectionHorizontal() {
  return (
    <div className="w-full">
      <PageSection.Root orientation="horizontal">
        <PageSection.Summary>
          <PageSection.Title>Section Title</PageSection.Title>
          <PageSection.Description>
            In horizontal orientation, the summary (title and description) appears on the left, with
            content arranged on the right on larger screens. This is useful for detailed sections
            where you want to maintain context while viewing content.
          </PageSection.Description>
        </PageSection.Summary>
        <PageSection.Content>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-foreground-light">
                The content area appears alongside the summary in a horizontal layout. On smaller
                screens, it will stack vertically.
              </p>
            </CardContent>
          </Card>
        </PageSection.Content>
      </PageSection.Root>
    </div>
  )
}
