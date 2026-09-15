import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from 'ui'

import { useFreeProjectLimitCheckQuery } from '@/data/organizations/free-project-limit-check-query'
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

  return (
    <AlertDialog open={visible} onOpenChange={onClose}>
      <AlertDialogContent size="medium">
        <AlertDialogHeader>
          <AlertDialogTitle>
            Your organization has members who have exceeded their free project limits
          </AlertDialogTitle>
          <AlertDialogDescription>
            <div className="flex flex-col space-y-2">
              <p className="text-sm text-foreground-light">
                The following members have reached their maximum limits for the number of active
                free plan projects within organizations where they are an administrator or owner:
              </p>
              <ul className="pl-5 text-sm list-disc text-foreground-light">
                {(membersExceededLimit || []).map((member, idx: number) => (
                  <li key={`member-${idx}`}>
                    {member.username || member.primary_email} (Limit: {member.free_project_limit}{' '}
                    free projects)
                  </li>
                ))}
              </ul>
              <p className="text-sm text-foreground-light">
                These members will need to either delete, pause, or upgrade one or more of these
                projects before you're able to downgrade this project.
              </p>
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
