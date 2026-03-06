import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
} from 'ui'

interface ReplicationDisclaimerDialogProps {
  open: boolean
  isLoading: boolean
  onOpenChange: (value: boolean) => void
  onConfirm: () => void
}

export const ReplicationDisclaimerDialog = ({
  open,
  isLoading,
  onOpenChange,
  onConfirm,
}: ReplicationDisclaimerDialogProps) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Replication limitations</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection className="space-y-4 text-sm">
          <p className="text-foreground">
            Creating this replication pipeline will immediately start syncing data from your
            publication into the destination. Make sure you understand the limitations of the system
            before proceeding.
          </p>

          <div className="text-foreground-light">
            <ul className="list-disc flex flex-col gap-y-1.5 pl-5 text-sm leading-snug">
              <li>
                <strong className="text-foreground">Custom data types replicate as strings.</strong>{' '}
                Check that the destination can interpret those string values correctly.
              </li>
              <li>
                <strong className="text-foreground">Generated columns are skipped.</strong> Replace
                them with triggers or materialized views if you need the derived values downstream.
              </li>
              <li>
                <strong className="text-foreground">
                  FULL replica identity is strongly recommended.
                </strong>{' '}
                With FULL replica identity deletes and updates include the payload that is needed to
                correctly apply those changes.
              </li>
              <li>
                <strong className="text-foreground">Schema changes aren’t supported yet.</strong>{' '}
                Plan for manual adjustments if you need to alter replicated tables.
              </li>
            </ul>
          </div>
        </DialogSection>

        <DialogSectionSeparator />

        <DialogFooter>
          <Button type="default" disabled={isLoading} onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button loading={isLoading} onClick={onConfirm}>
            Understood, start replication
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
