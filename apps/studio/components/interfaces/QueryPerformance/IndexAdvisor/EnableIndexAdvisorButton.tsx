import { useState } from 'react'
import { toast } from 'sonner'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Button,
} from 'ui'

import { getIndexAdvisorExtensions } from './index-advisor.utils'
import { useDatabaseExtensionEnableMutation } from '@/data/database-extensions/database-extension-enable-mutation'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { useTrack } from '@/lib/telemetry/track'

export const EnableIndexAdvisorButton = () => {
  const track = useTrack()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  return (
    <>
      <Button
        type="primary"
        onClick={() => {
          setIsDialogOpen(true)
          track('index_advisor_banner_enable_button_clicked')
        }}
      >
        Enable
      </Button>
      <EnableIndexAdvisorDialog open={isDialogOpen} setOpen={setIsDialogOpen} />
    </>
  )
}

export const EnableIndexAdvisorDialog = ({
  open,
  setOpen,
}: {
  open: boolean
  setOpen: (value: boolean) => void
}) => {
  const track = useTrack()
  const { data: project } = useSelectedProjectQuery()

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
      setOpen(false)
    } catch (error: any) {
      toast.error(`Failed to enable Index Advisor: ${error.message}`)
    }
  }

  return (
    <AlertDialog open={open} onOpenChange={() => setOpen(!open)}>
      <AlertDialogContent size="medium">
        <AlertDialogHeader>
          <AlertDialogTitle>Enable Index Advisor</AlertDialogTitle>
          <AlertDialogDescription className="flex flex-col gap-y-2">
            <p>
              The Index Advisor recommends indexes to improve query performance on your tables based
              on your actual query patterns.
            </p>
            <p>
              Enable this will install the <code className="text-code-inline">index_advisor</code>{' '}
              and <code className="text-code-inline">hypopg</code> Postgres extensions so Index
              Advisor can analyse queries and suggest performance-improving indexes.
            </p>
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
