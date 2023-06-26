import { Alert, AlertDescription, AlertTitle } from '@ui/components/shadcn/ui/alert'
import { AlertCircle, Terminal, AlertTriangle } from 'lucide-react'
import { Meta } from '@storybook/react'

const meta: Meta<typeof Alert> = {
  title: 'shadcn/Alert',
  component: Alert,
}

export const Default = () => (
  <Alert className="flex gap-6">
    <div className="bg-foreground rounded h-5 w-5 flex items-center justify-center">
      <AlertTriangle className="h-3 w-3 text-background" strokeWidth={2} />
    </div>
    <div>
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>You can add components to your app using the cli.</AlertDescription>
    </div>
  </Alert>
)

Default.storyName = 'Default'

export const Destructive = () => (
  <Alert variant="destructive">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>Your session has expired. Please log in again.</AlertDescription>
  </Alert>
)

Destructive.storyName = 'Destructive'

export default meta
