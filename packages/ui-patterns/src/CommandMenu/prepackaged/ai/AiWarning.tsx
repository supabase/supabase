import { Microscope } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle, cn } from 'ui'

const AiWarning = ({ className }: { className?: string }) => (
  <Alert className={cn('m-0!', className)} variant="warning">
    <Microscope strokeWidth={1.5} size={18} className="text-foreground-muted" />
    <AlertTitle>Supabase AI is experimental and may produce incorrect answers.</AlertTitle>
    <AlertDescription>
      <p>Always verify the output before executing.</p>
    </AlertDescription>
  </Alert>
)

export { AiWarning }
