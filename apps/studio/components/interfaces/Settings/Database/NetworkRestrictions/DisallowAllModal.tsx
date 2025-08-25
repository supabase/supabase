import { useState } from 'react'
import { PermissionAction } from '@supabase/shared-types/out/constants'

import { useParams } from 'common/hooks'
import InformationBox from 'components/ui/InformationBox'
import { useNetworkRestrictionsApplyMutation } from 'data/network-restrictions/network-retrictions-apply-mutation'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import {
  Button,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
} from 'ui'

interface DisallowAllModalProps {
  onClose?: () => void
}

export const DisallowAllModal = ({ onClose }: DisallowAllModalProps) => {
  const [visible, setVisible] = useState(false)
  const { ref } = useParams()
  const { data: project } = useSelectedProjectQuery()
  const { can: canUpdateNetworkRestrictions } = useAsyncCheckProjectPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )
  const { mutate: applyNetworkRestrictions, isLoading: isApplying } =
    useNetworkRestrictionsApplyMutation({
      onSuccess: () => {
        setVisible(false)
        onClose?.()
      },
    })

  const onSubmit = async () => {
    if (!ref) return console.error('Project ref is required')
    await applyNetworkRestrictions({
      projectRef: ref,
      dbAllowedCidrs: [],
      dbAllowedCidrsV6: [],
    })
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          onClose?.()
        }
      }}
    >
      <DialogTrigger asChild>
        <ButtonTooltip
          type="default"
          disabled={!canUpdateNetworkRestrictions}
          onClick={() => setVisible(true)}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canUpdateNetworkRestrictions
                ? 'You need additional permissions to update network restrictions'
                : undefined,
            },
          }}
        >
          Restrict all access
        </ButtonTooltip>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Restrict access from all IP addresses</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          This will prevent any external IP addresses from accessing your project's database. Are
          you sure?
        </DialogSection>
        <InformationBox
          defaultVisibility
          hideCollapse
          title="Note: Restrictions only apply to direct connections to your database and connection pooler"
          description="They do not currently apply to APIs offered over HTTPS, such as PostgREST, Storage, or Authentication."
        />
        <DialogFooter>
          <Button type="default" disabled={isApplying} onClick={onClose}>
            Cancel
          </Button>
          <Button loading={isApplying} onClick={onSubmit}>
            Confirm
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
