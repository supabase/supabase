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
import type { EdgeFunctionDeployment } from './types'

type RollbackModalProps = {
  open: boolean
  onOpenChange: (open: boolean) => void
  deployment: EdgeFunctionDeployment | null
  onConfirm: () => void
  isLoading: boolean
}

export const RollbackModal = ({
  open,
  onOpenChange,
  deployment,
  onConfirm,
  isLoading,
}: RollbackModalProps) => {
  if (!deployment) return null

  const formatDate = (epochMs: number) => {
    return new Date(epochMs).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    })
  }

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Roll back to version {deployment.version}?</AlertDialogTitle>
          <AlertDialogDescription>
            <div className="space-y-3">
              <p>
                This will replace the currently active version with version {deployment.version}.
                All incoming traffic will be served by this version immediately.
              </p>
              <div className="rounded-md bg-muted p-3 space-y-1">
                <div className="text-sm font-medium">Version Details:</div>
                <div className="text-sm text-muted-foreground">Version {deployment.version}</div>
                <div className="text-sm text-muted-foreground">
                  Deployed: {formatDate(deployment.created_at)}
                </div>
                {deployment.commit_message && (
                  <div className="text-sm text-muted-foreground">{deployment.commit_message}</div>
                )}
              </div>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isLoading}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={onConfirm} disabled={isLoading}>
            {isLoading ? 'Rolling back…' : 'Confirm rollback'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}
