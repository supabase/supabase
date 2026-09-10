import { Database } from 'lucide-react'
import { Button, Card } from 'ui'
import {
  PageHeader,
  PageHeaderAside,
  PageHeaderDescription,
  PageHeaderIcon,
  PageHeaderMeta,
  PageHeaderSummary,
  PageHeaderTitle,
} from 'ui-patterns/PageHeader'

export default function PageHeaderDemo() {
  return (
    <div className="w-full">
      <PageHeader size="default">
        <PageHeaderMeta>
          <PageHeaderIcon>
            <Card className="flex h-14 w-14 shrink-0 items-center justify-center">
              <Database className="h-5 w-5" />
            </Card>
          </PageHeaderIcon>
          <PageHeaderSummary>
            <PageHeaderTitle>Demo Function</PageHeaderTitle>
            <PageHeaderDescription>
              Serverless functions that run at the edge with low latency and automatic scaling.
            </PageHeaderDescription>
          </PageHeaderSummary>
          <PageHeaderAside>
            <Button variant="default" size="small">
              Secondary
            </Button>
            <Button variant="primary" size="small">
              Deploy Function
            </Button>
          </PageHeaderAside>
        </PageHeaderMeta>
      </PageHeader>
    </div>
  )
}
