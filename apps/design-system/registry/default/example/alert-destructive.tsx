import { AlertCircle } from 'lucide-react'

import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_ } from 'ui'

export default function AlertDestructive() {
  return (
    <Alert_Shadcn_ variant="destructive">
      <AlertCircle className="h-4 w-4" />
      <AlertTitle_Shadcn_>Error</AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        Your session has expired. Please log in again.
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}
