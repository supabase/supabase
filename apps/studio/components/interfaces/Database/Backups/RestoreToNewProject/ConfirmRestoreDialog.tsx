import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { TimestampInfo } from 'ui-patterns/TimestampInfo'

import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface ConfirmRestoreDialogProps {
  open: boolean
  selectedTime?: string
  onOpenChange: (value: boolean) => void
  onSelectContinue: () => void
}

export const ConfirmRestoreDialog = ({
  open,
  selectedTime,
  onOpenChange,
  onSelectContinue,
}: ConfirmRestoreDialogProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="border-b">
          <DialogTitle>Restore to a new project from a backup</DialogTitle>
          <DialogDescription>
            This process will create a new project and restore your database to it.
          </DialogDescription>
        </DialogHeader>
        <DialogSection className="pb-6 space-y-4 text-sm">
          <div className="flex flex-col gap-y-2">
            <p>
              A new project will be created from the selected backup at{' '}
              <TimestampInfo
                displayAs="utc"
                className="text-sm"
                utcTimestamp={selectedTime ?? ''}
                labelFormat="DD MMM YYYY HH:mm:ss (ZZ)"
              />{' '}
              under the same{' '}
              <Tooltip>
                <TooltipTrigger className={InlineLinkClassName}>organization</TooltipTrigger>
                <TooltipContent side="bottom">{organization?.name}</TooltipContent>
              </Tooltip>{' '}
              and{' '}
              <Tooltip>
                <TooltipTrigger className={InlineLinkClassName}>region</TooltipTrigger>
                <TooltipContent side="bottom">{project?.region || ''}</TooltipContent>
              </Tooltip>{' '}
              as this project.
            </p>
          </div>

          <div className="flex flex-col gap-y-2">
            <p>What will be transferred?</p>
            <ul className="list-disc ml-6 text-foreground-light">
              <li>Database schema (tables, views, procedures)</li>
              <li>All data and indexes</li>
              <li>Database roles, permissions and users</li>
            </ul>
          </div>

          <div className="flex flex-col gap-y-2">
            <p>What needs manual reconfiguration?</p>
            <ul className="list-disc ml-6 text-foreground-light">
              <li>Storage objects & settings</li>
              <li>Edge Functions</li>
              <li>Auth settings & API keys</li>
              <li>Database extensions and settings</li>
              <li>Read replicas</li>
            </ul>
          </div>
        </DialogSection>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => onSelectContinue()}>
            Continue
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
