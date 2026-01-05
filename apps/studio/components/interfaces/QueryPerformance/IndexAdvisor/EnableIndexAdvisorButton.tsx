import { useState } from 'react'
import { toast } from 'sonner'

import { useDatabaseExtensionEnableMutation } from 'data/database-extensions/database-extension-enable-mutation'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { useTrack } from 'lib/telemetry/track'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Button,
} from 'ui'
import { getIndexAdvisorExtensions } from './index-advisor.utils'

export const EnableIndexAdvisorButton = () => {
  const track = useTrack()
  const { data: project } = useSelectedProjectQuery()

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { hypopg, indexAdvisor } = getIndexAdvisorExtensions(extensions)

  const { mutateAsync: enableExtension, isPending: isEnablingExtension } =
    useDatabaseExtensionEnableMutation()

  const onEnableIndexAdvisor = async () => {
    if (project === undefined) return toast.error('Project is required')

    try {
      // Enable hypopg extension if not already installed
      if (hypopg?.installed_version === null) {
        await enableExtension({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          name: hypopg.name,
          schema: hypopg?.schema ?? 'extensions',
          version: hypopg.default_version,
        })
      }

      // Enable index_advisor extension if not already installed
      if (indexAdvisor?.installed_version === null) {
        await enableExtension({
          projectRef: project?.ref,
          connectionString: project?.connectionString,
          name: indexAdvisor.name,
          schema: indexAdvisor?.schema ?? 'extensions',
          version: indexAdvisor.default_version,
        })
      }
      toast.success('Successfully enabled Index Advisor!')
      setIsDialogOpen(false)
    } catch (error: any) {
      toast.error(`Failed to enable Index Advisor: ${error.message}`)
    }
  }

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={() => setIsDialogOpen(!isDialogOpen)}>
      <AlertDialogTrigger asChild>
        <Button type="primary" onClick={() => track('index_advisor_banner_enable_button_clicked')}>
          Enable
        </Button>
      </AlertDialogTrigger>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Enable Index Advisor</AlertDialogTitle>
          <AlertDialogDescription>
            This will enable the <code className="text-code-inline">index_advisor</code> and{' '}
            <code className="text-code-inline">hypopg</code> Postgres extensions so Index Advisor
            can analyse queries and suggest performance-improving indexes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onEnableIndexAdvisor()
              track('index_advisor_dialog_enable_button_clicked')
            }}
            disabled={isEnablingExtension}
          >
            {isEnablingExtension ? 'Enabling...' : 'Enable'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
