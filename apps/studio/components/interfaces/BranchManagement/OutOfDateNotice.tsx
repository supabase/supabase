import { useState } from 'react'
import { Button } from 'ui'
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
} from 'ui'
import { GitBranchIcon } from 'lucide-react'
import { Admonition } from 'ui-patterns'
import { useSendEventMutation } from 'data/telemetry/send-event-mutation'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'

interface OutOfDateNoticeProps {
  isBranchOutOfDateMigrations: boolean
  missingMigrationsCount: number
  hasMissingFunctions: boolean
  missingFunctionsCount: number
  hasOutOfDateFunctions: boolean
  outOfDateFunctionsCount: number
  hasEdgeFunctionModifications: boolean
  modifiedFunctionsCount: number
  isPushing: boolean
  onPush: () => void
}

export const OutOfDateNotice = ({
  isBranchOutOfDateMigrations,
  missingMigrationsCount,
  hasMissingFunctions,
  missingFunctionsCount,
  hasOutOfDateFunctions,
  outOfDateFunctionsCount,
  hasEdgeFunctionModifications,
  modifiedFunctionsCount,
  isPushing,
  onPush,
}: OutOfDateNoticeProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const hasOutdatedMigrations = isBranchOutOfDateMigrations && missingMigrationsCount > 0
  const selectedOrg = useSelectedOrganization()
  const project = useSelectedProject()
  const { mutate: sendEvent } = useSendEventMutation()

  const isBranch = project?.parent_project_ref !== undefined
  const parentProjectRef = isBranch ? project?.parent_project_ref : project?.ref

  const getTitle = () => {
    if (hasOutdatedMigrations && (hasMissingFunctions || hasOutOfDateFunctions)) {
      return 'Your database schema and edge functions are out of date'
    } else if (hasOutdatedMigrations) {
      return 'Your database schema is out of date'
    } else if (hasMissingFunctions || hasOutOfDateFunctions) {
      return 'Your functions are out of date'
    }
    return 'Branch is out of date'
  }

  const getDescription = () => {
    return 'Update this branch to get the latest changes from the production branch.'
  }

  const handleUpdate = (shouldCloseDialog = false) => {
    if (shouldCloseDialog) {
      setIsDialogOpen(false)
    }

    // Track branch update
    sendEvent({
      action: 'branch_updated',
      properties: {
        modifiedEdgeFunctions: hasEdgeFunctionModifications,
        source: 'out_of_date_notice',
      },
      groups: {
        project: parentProjectRef ?? 'Unknown',
        organization: selectedOrg?.slug ?? 'Unknown',
      },
    })

    onPush()
  }

  return (
    <Admonition type="warning" className="my-4">
      <div className="w-full flex items-center justify-between">
        <div>
          <h3 className="text-sm font-medium">{getTitle()}</h3>
          <p className="text-sm text-foreground-light">{getDescription()}</p>
        </div>

        {hasEdgeFunctionModifications ? (
          <AlertDialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <AlertDialogTrigger asChild>
              <Button
                type="default"
                loading={isPushing}
                icon={<GitBranchIcon size={16} strokeWidth={1.5} />}
                className="shrink-0"
              >
                {isPushing ? 'Updating...' : 'Update branch'}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Update branch with modified functions?</AlertDialogTitle>
                <AlertDialogDescription>
                  This branch has {modifiedFunctionsCount} modified edge function
                  {modifiedFunctionsCount !== 1 ? 's' : ''} that will be overwritten when updating
                  with the latest functions from the production branch. This action cannot be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={() => handleUpdate(true)}>
                  Update anyway
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button
            type="default"
            loading={isPushing}
            onClick={() => handleUpdate()}
            icon={<GitBranchIcon size={16} strokeWidth={1.5} />}
            className="shrink-0"
          >
            {isPushing ? 'Updating...' : 'Update branch'}
          </Button>
        )}
      </div>
    </Admonition>
  )
}
