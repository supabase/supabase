import { PageSection } from 'ui-patterns/PageSection'
import { Button, Card, CardContent } from 'ui'

export default function PageSectionWithAside() {
  return (
    <div className="w-full">
      <PageSection.Root>
        <PageSection.Summary>
          <PageSection.Title>Section Title</PageSection.Title>
          <PageSection.Description>
            This demonstrates PageSection with actions in the Aside component.
          </PageSection.Description>
        </PageSection.Summary>
        <PageSection.Aside>
          <Button type="default" size="small">
            Secondary
          </Button>
          <Button type="primary" size="small">
            Primary Action
          </Button>
        </PageSection.Aside>
        <PageSection.Content>
          <Card>
            <CardContent className="p-6">
              <p className="text-sm text-foreground-light">
                The Aside component positions actions horizontally aligned with the section summary,
                providing a clear separation between description and actions.
              </p>
            </CardContent>
          </Card>
        </PageSection.Content>
      </PageSection.Root>
    </div>
  )
}
