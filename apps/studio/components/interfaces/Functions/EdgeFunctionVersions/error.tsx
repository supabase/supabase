import { AlertCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle, Button } from 'ui'

type EdgeFunctionVersionsErrorProps = {
  error: string
  onRetry: () => void
}

export const EdgeFunctionVersionsError = ({ error, onRetry }: EdgeFunctionVersionsErrorProps) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Edge Function Versions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col items-center justify-center py-8 space-y-4">
          <AlertCircle className="h-8 w-8 text-destructive" />
          <p className="text-sm text-muted-foreground">{error}</p>
          <Button onClick={onRetry}>Retry</Button>
        </div>
      </CardContent>
    </Card>
  )
}
