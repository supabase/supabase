import { Alert, AlertDescription, AlertTitle } from '@ui/components/shadcn/ui/alert'
import { AlertCircle, Terminal } from 'lucide-react'
import { Meta } from '@storybook/react'

const meta: Meta<typeof Alert> = {
  title: 'shadcn/Alert',
  component: Alert,
}

export const Default = () => (
  <Alert>
    <Terminal className="h-4 w-4" />
    <AlertTitle>Heads up!</AlertTitle>
    <AlertDescription>You can add components to your app using the cli.</AlertDescription>
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
