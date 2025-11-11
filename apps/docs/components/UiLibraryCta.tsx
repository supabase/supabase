import { Badge, Card } from 'ui'
import { Button } from 'ui'
import { ArrowRight } from 'lucide-react'

export const UiLibraryCta = () => {
  return (
    <Card className="my-6 border-primary/20 bg-primary/5 p-4 not-prose">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="mb-1 font-medium">Drop-in UI components for your Supabase app</h3>
            <Badge variant="success">New</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            UI components built on shadcn/ui that connect to Supabase via a single command.
          </p>
        </div>
        <Button type="primary" iconRight={<ArrowRight className="" />}>
          Explore Components
        </Button>
      </div>
    </Card>
  )
}
