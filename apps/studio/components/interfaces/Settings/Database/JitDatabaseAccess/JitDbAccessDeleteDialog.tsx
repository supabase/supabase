import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogBody,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'ui'
import { Admonition } from 'ui-patterns/admonition'

import type { JitUserRule } from './JitDbAccess.types'

interface JitDbAccessDeleteDialogProps {
  user: JitUserRule | null
  isDeleting: boolean
  error?: string | null
  onClose: () => void
  onConfirm: () => unknown
}

export function JitDbAccessDeleteDialog({
  user,
  isDeleting = false,
  error,
  onClose,
  onConfirm,
}: JitDbAccessDeleteDialogProps) {
  const userDisplayName = user?.name?.trim() || user?.email || 'this user'
  const isInvite = !!user?.inviteState

  return (
    <AlertDialog open={!!user} onOpenChange={(open) => !open && !isDeleting && onClose()}>
      <AlertDialogContent size="small">
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isInvite ? 'Delete invitation' : 'Delete temporary access rule'}
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              {isInvite ? (
                <>
                  <p>
                    Delete the temporary access invitation for{' '}
                    <strong className="text-foreground">{userDisplayName}</strong>?
                  </p>
                  <p>The invitation link will stop working and they won't be able to accept it.</p>
                </>
              ) : (
                <>
                  <p>
                    Remove the temporary access rule for{' '}
                    <strong className="text-foreground">{userDisplayName}</strong>?
                  </p>
                  <p>
                    This revokes any assigned database roles for this member and removes their
                    temporary access configuration.
                  </p>
                </>
              )}
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        {error && (
          <AlertDialogBody>
            <Admonition
              type="destructive"
              title={
                isInvite ? 'Unable to delete invitation' : 'Unable to delete temporary access rule'
              }
              description={error}
            />
          </AlertDialogBody>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="danger" loading={isDeleting} onClick={onConfirm}>
            {isInvite ? 'Delete invitation' : 'Delete rule'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
