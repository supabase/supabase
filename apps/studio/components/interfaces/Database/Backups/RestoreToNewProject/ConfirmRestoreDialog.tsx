import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogTitle,
} from 'ui'
import { AdditionalMonthlySpend } from './AdditionalMonthlySpend'

interface ConfirmRestoreDialogProps {
  open: boolean
  onOpenChange: (value: boolean) => void
  onSelectContinue: () => void
}

export const ConfirmRestoreDialog = ({
  open,
  onOpenChange,
  onSelectContinue,
}: ConfirmRestoreDialogProps) => {
  const { project } = useProjectContext()
  const organization = useSelectedOrganization()

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader className="border-b">
          <DialogTitle>Confirm restore to a new project</DialogTitle>
          <DialogDescription>
            This process will create a new project and restore your database to it.
          </DialogDescription>
        </DialogHeader>
        <DialogSection className="prose pb-6 space-y-4 text-sm">
          <ul className="space-y-2">
            <li>
              Project organization will stay the same: <code>{organization?.name}</code>
            </li>
            <li>
              Project region will stay the same: <code>{project?.region || ''}</code>
            </li>
            <li>
              A project can only be restored to another project once. <br />
              <span className="text-foreground-lighter text-xs">
                This is a temporary limitation. Please contact us if you need to restore a project
                to multiple other projects.
              </span>
            </li>
          </ul>
          <ul>
            <li>What will be transferred?</li>
            <ul className="ml-4">
              <li>Database schema (tables, views, procedures)</li>
              <li>All data and indexes</li>
              <li>Database roles, permissions and users</li>
            </ul>
          </ul>
          <ul>
            <li>What needs manual reconfiguration?</li>
            <ul className="ml-4">
              <li>Storage objects & settings</li>
              <li>Edge Functions</li>
              <li>Auth settings & API keys</li>
              <li>Realtime settings</li>
              <li>Database extensions and settings</li>
              <li>Read replicas</li>
            </ul>
          </ul>
        </DialogSection>
        <AdditionalMonthlySpend />
        <DialogFooter>
          <Button type="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={() => onSelectContinue()}>Continue</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
