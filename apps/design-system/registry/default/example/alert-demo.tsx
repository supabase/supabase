import { Terminal } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from 'ui/src/components/shadcn/ui/alert'

export default function AlertDemo() {
  return (
    <Alert>
      <Terminal size={16} />
      <AlertTitle>Heads up!</AlertTitle>
      <AlertDescription>You can also add components to your app using the CLI.</AlertDescription>
    </Alert>
  )
}
