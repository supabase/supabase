import { PageContainer } from 'ui-patterns/PageContainer'
import { PageHeader } from 'ui-patterns/PageHeader'
import { Button } from 'ui'

export default function PageLayoutFullPage() {
  return (
    <div className="w-full">
      <PageHeader.Root size="full">
        <PageHeader.Summary>
          <PageHeader.Title>SQL Editor</PageHeader.Title>
          <PageHeader.Description>
            Write and execute SQL queries with syntax highlighting and auto-complete.
          </PageHeader.Description>
        </PageHeader.Summary>
        <PageHeader.Aside>
          <Button type="default" size="small">
            Format
          </Button>
          <Button type="primary" size="small">
            Run Query
          </Button>
        </PageHeader.Aside>
      </PageHeader.Root>

      <PageContainer size="full">
        <div className="mt-4 border rounded-lg bg-background p-4 min-h-[400px]">
          <p className="text-sm text-foreground-light">
            Editor content takes full width for maximum screen real estate.
          </p>
        </div>
      </PageContainer>
    </div>
  )
}
