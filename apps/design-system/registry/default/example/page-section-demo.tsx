import { PageSection } from 'ui-patterns/PageSection'
import { Button, Card, CardContent } from 'ui'

export default function PageSectionDemo() {
  return (
    <div className="w-full">
      <PageSection.Root>
        <PageSection.Summary>
          <PageSection.Title>Section Title</PageSection.Title>
          <PageSection.Description>
            This is a section with a title and description, plus optional actions.
          </PageSection.Description>
        </PageSection.Summary>
        <PageSection.Aside>
          <Button type="default" size="small">
            Action
          </Button>
        </PageSection.Aside>
        <PageSection.Content>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-foreground-light">
                Section content goes here. This could be forms, tables, or any other content.
              </p>
            </CardContent>
          </Card>
        </PageSection.Content>
      </PageSection.Root>
    </div>
  )
}
