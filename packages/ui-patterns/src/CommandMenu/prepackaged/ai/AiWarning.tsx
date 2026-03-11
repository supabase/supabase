import { Microscope } from 'lucide-react'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, cn } from 'ui'

const AiWarning = ({ className }: { className?: string }) => (
  <Alert_Shadcn_ className={cn('!m-0', className)} variant="warning">
    <Microscope strokeWidth={1.5} size={18} className="text-foreground-muted" />
    <AlertTitle_Shadcn_>
      Supabase AI is experimental and may produce incorrect answers.
    </AlertTitle_Shadcn_>
    <AlertDescription_Shadcn_>
      <p>Always verify the output before executing.</p>
    </AlertDescription_Shadcn_>
  </Alert_Shadcn_>
)

export { AiWarning }
