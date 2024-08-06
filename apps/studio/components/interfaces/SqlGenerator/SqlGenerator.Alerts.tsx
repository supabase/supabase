import { AlertTriangle, Info } from 'lucide-react'

import { useAppStateSnapshot } from 'state/app-state'
import { Alert_Shadcn_, AlertDescription_Shadcn_, AlertTitle_Shadcn_, Button_Shadcn_ } from 'ui'

const IncludeSchemaAlert = () => {
  const { setShowAiSettingsModal } = useAppStateSnapshot()

  return (
    <Alert_Shadcn_ variant="warning">
      <AlertTriangle />
      <AlertTitle_Shadcn_>
        Project metadata (tables, columns, and data types) is being shared with OpenAI
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        <Button_Shadcn_
          variant="link"
          className="h-fit p-0 font-normal"
          onClick={() => setShowAiSettingsModal(true)}
        >
          Change this configuration
        </Button_Shadcn_>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

const ExcludeSchemaAlert = () => {
  const { setShowAiSettingsModal } = useAppStateSnapshot()

  return (
    <Alert_Shadcn_>
      <Info />
      <AlertTitle_Shadcn_>
        Project metadata (tables, columns, and data types) is not being shared with OpenAI
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        <Button_Shadcn_
          variant="link"
          className="h-fit p-0 font-normal"
          onClick={() => setShowAiSettingsModal(true)}
        >
          Change this configuration
        </Button_Shadcn_>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

export { ExcludeSchemaAlert, IncludeSchemaAlert }
