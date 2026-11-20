import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'ui'

import { ExceedFreeProjectLimitMembers } from '@/components/ui/ExceedFreeProjectLimitMembers'
import { FreeProjectLimitActions } from '@/components/ui/FreeProjectLimitActions'
import { useFreeProjectLimitCheckQuery } from '@/data/organizations/free-project-limit-check-query'
import { useOrganizationMembersQuery } from '@/data/organizations/organization-members-query'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { pluralize } from '@/lib/helpers'

export interface MembersExceedLimitModalProps {
  visible: boolean
  onClose: () => void
}

export const MembersExceedLimitModal = ({ visible, onClose }: MembersExceedLimitModalProps) => {
  const { data: selectedOrganization } = useSelectedOrganizationQuery()
  const slug = selectedOrganization?.slug
  const { data: membersExceededLimit } = useFreeProjectLimitCheckQuery(
    { slug },
    { enabled: visible }
  )
  const { data: orgMembers } = useOrganizationMembersQuery({ slug }, { enabled: visible })
  const hasMultipleMembers = (orgMembers ?? []).filter((member) => !member.invited_id).length > 1

  return (
    <AlertDialog open={visible} onOpenChange={onClose}>
      <AlertDialogContent size="medium">
        <AlertDialogHeader>
          <AlertDialogTitle>Unable to downgrade organization</AlertDialogTitle>
          <AlertDialogDescription>
            <div className="flex flex-col space-y-2">
              <p className="text-sm text-foreground-light">
                Downgrading this organization would cause {membersExceededLimit?.length}{' '}
                {pluralize(membersExceededLimit?.length ?? 0, 'member')} to exceed the limit of{' '}
                <span className="text-foreground">2 active Free Plan projects</span> per member
                across all organizations.
              </p>

              <ExceedFreeProjectLimitMembers membersExceededLimit={membersExceededLimit ?? []} />

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
