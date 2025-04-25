import { useState } from 'react'
import { toast } from 'sonner'

import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useDatabaseExtensionEnableMutation } from 'data/database-extensions/database-extension-enable-mutation'
import { useDatabaseExtensionsQuery } from 'data/database-extensions/database-extensions-query'
import { useIsIndexAdvisorAvailable } from 'hooks/misc/useIsIndexAdvisorAvailable'
import { getIndexAdvisorExtensions } from './index-advisor.utils'
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

/**
 * EnableIndexAdvisorButton
 *
 * A component that displays a button to enable the Index Advisor functionality.
 * When clicked, it shows a confirmation dialog with details about the extensions
 * that will be enabled (index_advisor and hypopg).
 *
 * The button is only shown when the required extensions are not already enabled.
 */
export const EnableIndexAdvisorButton = () => {
  const { project } = useProjectContext()
  const isAdvisorAvailable = useIsIndexAdvisorAvailable()
  const [isDialogOpen, setIsDialogOpen] = useState(false)

  // Query available extensions to check if index_advisor and hypopg are installed
  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })
  const { hypopg, indexAdvisor } = getIndexAdvisorExtensions(extensions)

  // Mutation hook for enabling database extensions
  const { mutateAsync: enableExtension, isLoading: isEnablingExtension } =
    useDatabaseExtensionEnableMutation()

  // Don't render anything if index advisor is already available
  if (isAdvisorAvailable) {
    return null
  }

  /**
   * Enables both required extensions (hypopg and index_advisor)
   * Only enables extensions that aren't already installed
   */
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
      {/* Button with tooltip */}
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

      {/* Confirmation dialog */}
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
