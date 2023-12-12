import { useParams } from 'common'
import { AlertTriangle, CheckCircle2, Plug } from 'lucide-react'
import { useState } from 'react'
import {
  Button,
  IconLoader,
  Dialog_Shadcn_,
  DialogContent_Shadcn_,
  DialogDescription_Shadcn_,
  DialogFooter_Shadcn_,
  DialogHeader_Shadcn_,
  DialogTitle_Shadcn_,
  DialogTrigger_Shadcn_,
} from 'ui'
import NewProjectPanel from './NewProjectPanel/NewProjectPanel'
import APIKeys from './NewProjectPanel/APIKeys'
import { DisplayApiSettings } from 'components/ui/ProjectSettings'

// import { usePostgresServiceStatusQuery } from 'data/service-status/postgres-service-status-query'
// import { useProjectServiceStatusQuery } from 'data/service-status/service-status-query'
// import { useIsFeatureEnabled, useSelectedProject } from 'hooks'
// import { useEdgeFunctionServiceStatusQuery } from 'data/service-status/edge-functions-status-query'

const Connect = () => {
  const { ref } = useParams()
  //const project = useSelectedProject()
  //const [open, setOpen] = useState(false)

  return (
    <div>
      <Dialog_Shadcn_>
        <DialogTrigger_Shadcn_ asChild>
          <Button type="secondary">
            <span className="flex items-center gap-2">
              <Plug size={12} className="rotate-90" /> <span>Connect</span>
            </span>
          </Button>
        </DialogTrigger_Shadcn_>
        <DialogContent_Shadcn_ className="sm:max-w-5xl">
          <DialogHeader_Shadcn_>
            <DialogTitle_Shadcn_>Connect to your project</DialogTitle_Shadcn_>
            <DialogDescription_Shadcn_>
              Get the connection strings and environment variables for your app
            </DialogDescription_Shadcn_>
          </DialogHeader_Shadcn_>

          {/* <APIKeys /> */}
          <DisplayApiSettings />

          <DialogFooter_Shadcn_>
            <Button type="secondary">Close</Button>
          </DialogFooter_Shadcn_>
        </DialogContent_Shadcn_>
      </Dialog_Shadcn_>
    </div>
  )
}

export default Connect
