import { AlertTriangle, Info } from 'lucide-react'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_ } from 'ui'

const IncludeSchemaAlert = () => (
  <Alert_Shadcn_ variant="warning">
    <AlertTriangle />
    <AlertTitle_Shadcn_>
      Project metadata (tables, columns, and data types) is being shared with OpenAI
    </AlertTitle_Shadcn_>
    <AlertDescription_Shadcn_>
      Start a new conversation to change this configuration
    </AlertDescription_Shadcn_>
  </Alert_Shadcn_>
)

const ExcludeSchemaAlert = () => (
  <Alert_Shadcn_>
    <Info />
    <AlertTitle_Shadcn_>
      Project metadata (tables, columns, and data types) is not being shared with OpenAI
    </AlertTitle_Shadcn_>
    <AlertDescription_Shadcn_>
      Start a new conversation to change this configuration
    </AlertDescription_Shadcn_>
  </Alert_Shadcn_>
)

export { ExcludeSchemaAlert, IncludeSchemaAlert }
