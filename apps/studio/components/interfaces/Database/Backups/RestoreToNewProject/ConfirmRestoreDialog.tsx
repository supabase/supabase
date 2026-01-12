import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
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
import { NewProjectPrice } from './RestoreToNewProject.utils'

interface ConfirmRestoreDialogProps {
  open: boolean
  onOpenChange: (value: boolean) => void
  onSelectContinue: () => void
  additionalMonthlySpend: NewProjectPrice
}

export const ConfirmRestoreDialog = ({
  open,
  onOpenChange,
  onSelectContinue,
  additionalMonthlySpend,
}: ConfirmRestoreDialogProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()

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
              <li>Database extensions and settings</li>
              <li>Read replicas</li>
            </ul>
          </ul>
        </DialogSection>
        <AdditionalMonthlySpend additionalMonthlySpend={additionalMonthlySpend} />
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
