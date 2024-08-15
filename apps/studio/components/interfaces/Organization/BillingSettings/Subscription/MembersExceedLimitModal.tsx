import { useFreeProjectLimitCheckQuery } from 'data/organizations/free-project-limit-check-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { Button, Modal } from 'ui'

export interface MembersExceedLimitModalProps {
  visible: boolean
  onClose: () => void
}

const MembersExceedLimitModal = ({ visible, onClose }: MembersExceedLimitModalProps) => {
  const selectedOrganization = useSelectedOrganization()
  const slug = selectedOrganization?.slug
  const { data: membersExceededLimit } = useFreeProjectLimitCheckQuery({ slug })

  return (
    <Modal
      hideFooter
      visible={visible}
      size="medium"
      header="Your organization has members who have exceeded their free project limits"
      onCancel={onClose}
    >
      <Modal.Content>
        <div className="space-y-2">
          <p className="text-sm text-foreground-light">
            The following members have reached their maximum limits for the number of active free
            plan projects within organizations where they are an administrator or owner:
          </p>
          <ul className="pl-5 text-sm list-disc text-foreground-light">
            {(membersExceededLimit || []).map((member, idx: number) => (
              <li key={`member-${idx}`}>
                {member.username || member.primary_email} (Limit: {member.free_project_limit} free
                projects)
              </li>
            ))}
          </ul>
          <p className="text-sm text-foreground-light">
            These members will need to either delete, pause, or upgrade one or more of these
            projects before you're able to downgrade this project.
          </p>
        </div>
      </Modal.Content>
      <Modal.Separator />
      <Modal.Content className="flex items-center gap-2">
        <Button htmlType="button" type="default" onClick={onClose} block>
          Understood
        </Button>
      </Modal.Content>
    </Modal>
  )
}

export default MembersExceedLimitModal
