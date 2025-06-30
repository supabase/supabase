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

interface OutOfDateNoticeProps {
  isBranchOutOfDateMigrations: boolean
  missingMigrationsCount: number
  hasNewerRemovedFunctions: boolean
  newerRemovedFunctionsCount: number
  hasNewerModifiedFunctions: boolean
  newerModifiedFunctionsCount: number
  hasEdgeFunctionModifications: boolean
  modifiedFunctionsCount: number
  isPushing: boolean
  onPush: () => void
}

export const OutOfDateNotice = ({
  isBranchOutOfDateMigrations,
  missingMigrationsCount,
  hasNewerRemovedFunctions,
  newerRemovedFunctionsCount,
  hasNewerModifiedFunctions,
  newerModifiedFunctionsCount,
  hasEdgeFunctionModifications,
  modifiedFunctionsCount,
  isPushing,
  onPush,
}: OutOfDateNoticeProps) => {
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const hasOutdatedMigrations = isBranchOutOfDateMigrations && missingMigrationsCount > 0

  const getTitle = () => {
    if (hasOutdatedMigrations && (hasNewerRemovedFunctions || hasNewerModifiedFunctions)) {
      const functionCount = newerRemovedFunctionsCount + newerModifiedFunctionsCount
      return `Missing ${missingMigrationsCount} migration${missingMigrationsCount !== 1 ? 's' : ''} and ${functionCount} updated function${functionCount !== 1 ? 's' : ''} from main branch`
    } else if (hasOutdatedMigrations) {
      return `Missing ${missingMigrationsCount} migration${missingMigrationsCount !== 1 ? 's' : ''} from main branch`
    } else if (hasNewerRemovedFunctions && hasNewerModifiedFunctions) {
      const functionCount = newerRemovedFunctionsCount + newerModifiedFunctionsCount
      return `Main branch has ${functionCount} updated function${functionCount !== 1 ? 's' : ''}`
    } else if (hasNewerRemovedFunctions) {
      return `Main branch has ${newerRemovedFunctionsCount} updated function${newerRemovedFunctionsCount !== 1 ? 's' : ''} that were removed in this branch`
    } else if (hasNewerModifiedFunctions) {
      return `Main branch has ${newerModifiedFunctionsCount} updated function${newerModifiedFunctionsCount !== 1 ? 's' : ''}`
    }
    return 'Branch is out of date'
  }

  const getDescription = () => {
    if (hasOutdatedMigrations && (hasNewerRemovedFunctions || hasNewerModifiedFunctions)) {
      return `The main branch has migrations and functions that were updated after this branch was created.`
    } else if (hasNewerRemovedFunctions || hasNewerModifiedFunctions) {
      return `The main branch has functions that were created or updated after this branch was created.`
    }
    return 'Update this branch to get the latest changes from the main branch.'
  }

  const handleUpdateClick = () => {
    onPush()
  }

  const handleConfirmUpdate = () => {
    setIsDialogOpen(false)
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
                  with the latest functions from the main branch, and this action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={handleConfirmUpdate}>Update anyway</AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        ) : (
          <Button
            type="default"
            loading={isPushing}
            onClick={handleUpdateClick}
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
