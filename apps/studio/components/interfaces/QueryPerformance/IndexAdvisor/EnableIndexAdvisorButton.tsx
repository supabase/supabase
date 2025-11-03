import { useState } from 'react'
import { toast } from 'sonner'

import { useIndexAdvisorStatus } from 'components/interfaces/QueryPerformance/hooks/useIsIndexAdvisorStatus'
import { useDatabaseExtensionEnableMutation } from 'data/database-extensions/database-extension-enable-mutation'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
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
  Badge,
  Button,
  InfoIcon,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { getIndexAdvisorExtensions } from './index-advisor.utils'

export const EnableIndexAdvisorButton = () => {
  const { data: project } = useSelectedProjectQuery()

  const { isIndexAdvisorAvailable, isIndexAdvisorEnabled } = useIndexAdvisorStatus()

  const [isDialogOpen, setIsDialogOpen] = useState(false)

  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { hypopg, indexAdvisor } = getIndexAdvisorExtensions(extensions)

  const { mutateAsync: enableExtension, isLoading: isEnablingExtension } =
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

  // if index_advisor is already enabled or not available to install, show nothing
  if (!isIndexAdvisorAvailable || isIndexAdvisorEnabled) return null

  return (
    <AlertDialog open={isDialogOpen} onOpenChange={() => setIsDialogOpen(!isDialogOpen)}>
      <Tooltip>
        <TooltipTrigger asChild>
          <AlertDialogTrigger asChild>
            <Button type="outline" className={`rounded-full`} icon={<InfoIcon />}>
              Enable Index Advisor
            </Button>
          </AlertDialogTrigger>
        </TooltipTrigger>
        <TooltipContent side="top">Recommends indexes to improve query performance</TooltipContent>
      </Tooltip>

      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Enable Index Advisor</AlertDialogTitle>
          <AlertDialogDescription>
            Index Advisor is a tool that helps you identify and simulate indexes that can improve
            query performance. To use Index Advisor, you need to enable the following Postgres
            extensions:
            <ul className="list-disc pl-6 py-4 flex flex-col gap-2">
              <li>
                <Badge className="font-mono text-foreground">index_advisor</Badge> - Recommends
                database indexes
              </li>
              <li>
                <Badge className="font-mono text-foreground">hypopg</Badge> - For hypothetical
                indexes simulation
              </li>
            </ul>
            These extensions help identify and simulate indexes that can improve query performance
            without having to create actual indexes.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            onClick={(e) => {
              e.preventDefault()
              onEnableIndexAdvisor()
            }}
            disabled={isEnablingExtension}
          >
            {isEnablingExtension ? 'Enabling...' : 'Enable Extensions'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
