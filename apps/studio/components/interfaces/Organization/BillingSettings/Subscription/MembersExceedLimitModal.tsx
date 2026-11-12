import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'ui'

import { AffectedOrganizationsList } from '@/components/ui/AffectedOrganizationsList'
import { FreeProjectLimitActions } from '@/components/ui/FreeProjectLimitActions'
import { useFreeProjectLimitCheckQuery } from '@/data/organizations/free-project-limit-check-query'
import { groupByOrganization } from '@/data/organizations/free-project-limit-check.utils'
import { useOrganizationMembersQuery } from '@/data/organizations/organization-members-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

export interface MembersExceedLimitModalProps {
  visible: boolean
  onClose: () => void
}

const MembersExceedLimitModal = ({ visible, onClose }: MembersExceedLimitModalProps) => {
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const slug = selectedOrganization?.slug
  const { data: membersExceededLimit } = useFreeProjectLimitCheckQuery(
    { slug },
    { enabled: visible }
  )
  const { data: orgMembers } = useOrganizationMembersQuery({ slug }, { enabled: visible })
  const hasMultipleMembers = (orgMembers ?? []).filter((member) => !member.invited_id).length > 1
  const organizations = groupByOrganization(membersExceededLimit ?? [])

  return (
    <AlertDialog open={visible} onOpenChange={onClose}>
      <AlertDialogContent size="medium">
        <AlertDialogHeader>
          <AlertDialogTitle>Exceeding number of active Free Projects</AlertDialogTitle>
          <AlertDialogDescription>
            <div className="flex flex-col space-y-2">
              <p className="text-sm text-foreground-light">
                Owners and administrators are limited in how many active Free Plan projects they can
                have across all organizations. These members are over the limit:
              </p>
              <AffectedOrganizationsList organizations={organizations} />
              <FreeProjectLimitActions
                goal="downgrade to the Free Plan"
                hasMultipleMembers={hasMultipleMembers}
              />
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={onClose} type="button">
            Understood
          </AlertDialogCancel>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default MembersExceedLimitModal
