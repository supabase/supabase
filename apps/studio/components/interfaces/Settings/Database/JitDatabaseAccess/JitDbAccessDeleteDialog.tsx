import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'ui'

import type { JitUserRule } from './JitDbAccess.types'

interface JitDbAccessDeleteDialogProps {
  user: JitUserRule | null
  open: boolean
  isDeleting?: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: () => void
}

export function JitDbAccessDeleteDialog({
  user,
  open,
  isDeleting = false,
  onOpenChange,
  onConfirm,
}: JitDbAccessDeleteDialogProps) {
  const userDisplayName = user?.name ?? user?.email ?? 'this user'

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent size="small">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete JIT access rule</AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-2 text-sm">
              <p>
                Remove the JIT access rule for <strong>{userDisplayName}</strong>?
              </p>
              <p>
                This revokes any assigned database roles for this member and removes their JIT
                access configuration.
              </p>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
          <AlertDialogAction variant="danger" disabled={isDeleting} onClick={onConfirm}>
            Delete rule
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
