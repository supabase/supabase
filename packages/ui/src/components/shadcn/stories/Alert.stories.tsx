import { Alert, AlertDescription, AlertTitle } from '@ui/components/shadcn/ui/alert'
import { AlertCircle, Terminal, AlertTriangle, Info } from 'lucide-react'
import { Meta } from '@storybook/react'

const meta: Meta<typeof Alert> = {
  title: 'shadcn/Alert',
  component: Alert,
}

export const Default = () => (
  <Alert>
      <Info strokeWidth={2} />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>You can add components to your app using the cli.</AlertDescription> 
  </Alert>
)

Default.storyName = 'Default'

export const Destructive = () => (
 <Alert variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle>Error</AlertTitle>
      <AlertDescription>
        Your session has expired. Please log in again.
      </AlertDescription>
    </Alert>
)

Destructive.storyName = 'Destructive'

export const Warning = () => (
 <Alert variant="warning">
    <AlertCircle className="h-4 w-4" />
    <AlertTitle>Error</AlertTitle>
    <AlertDescription>
      Your session has expired. Please log in again.
    </AlertDescription>
  </Alert>
)

Warning.storyName = 'Warning'

export default meta
