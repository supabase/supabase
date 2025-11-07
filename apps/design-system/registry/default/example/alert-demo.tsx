import { Terminal } from 'lucide-react'

import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_ } from 'ui'

export default function AlertDemo() {
  return (
    <Alert_Shadcn_>
      <Terminal className="h-4 w-4" />
      <AlertTitle_Shadcn_>Heads up!</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        You can add components to your app using the cli.
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
