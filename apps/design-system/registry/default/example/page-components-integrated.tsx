import { PageContainer } from 'ui-patterns/PageContainer'
import { PageHeader } from 'ui-patterns/PageHeader'
import { PageSection } from 'ui-patterns/PageSection'
import { Button, Card, CardContent } from 'ui'

export default function PageComponentsIntegrated() {
  return (
    <div className="w-full">
      <PageHeader.Root size="large">
        <PageHeader.Summary>
          <PageHeader.Title>Edge Functions</PageHeader.Title>
          <PageHeader.Description>
            Manage and deploy serverless functions that run at the edge.
          </PageHeader.Description>
        </PageHeader.Summary>
        <PageHeader.Aside>
          <Button type="primary" size="small">
            Deploy Function
          </Button>
        </PageHeader.Aside>
      </PageHeader.Root>

      <PageContainer size="large">
        <PageSection.Root>
          <PageSection.Summary>
            <PageSection.Title>Function Details</PageSection.Title>
            <PageSection.Description>
              Configure your function settings and view logs.
            </PageSection.Description>
          </PageSection.Summary>
          <PageSection.Content>
            <Card>
              <CardContent className="p-6">
                <p className="text-sm text-foreground-light">
                  This demonstrates how PageContainer, PageHeader, and PageSection work together to
                  create a complete page layout.
                </p>
              </CardContent>
            </Card>
          </PageSection.Content>
        </PageSection.Root>
      </PageContainer>
    </div>
  )
}
