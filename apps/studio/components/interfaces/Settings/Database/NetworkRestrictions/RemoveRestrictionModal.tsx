import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common/hooks'
import { useNetworkRestrictionsQuery } from 'data/network-restrictions/network-restrictions-query'
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
import { Admonition } from 'ui-patterns'
import { PermissionAction } from '@supabase/shared-types/out/constants'

interface RemoveRestrictionModalProps {
  selectedRestriction?: string
  onClose?: () => void
}

export const RemoveRestrictionModal = ({
  selectedRestriction,
  onClose,
}: RemoveRestrictionModalProps) => {
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
  const { data } = useNetworkRestrictionsQuery({ projectRef: ref }, { enabled: visible })
  const ipv4Restrictions = data?.config?.dbAllowedCidrs ?? []
  // @ts-ignore [Joshen] API typing issue
  const ipv6Restrictions: string[] = data?.config?.dbAllowedCidrsV6 ?? []
  const restrictedIps = ipv4Restrictions.concat(ipv6Restrictions)

  const { mutate: applyNetworkRestrictions, isLoading: isApplying } =
    useNetworkRestrictionsApplyMutation({
      onSuccess: () => {
        setVisible(false)
        onClose?.()
      },
      onError: (error) => {
        toast.error(`Failed to remove restriction: ${error.message}`)
      },
    })

  const isRemovingOnlyRestriction =
    restrictedIps.length === 1 && restrictedIps[0] === selectedRestriction

  const onSubmit = async () => {
    if (!ref) return console.error('Project ref is required')
    if (!selectedRestriction) return console.error('Missing selected restriction')

    const dbAllowedCidrs = ipv4Restrictions.includes(selectedRestriction)
      ? ipv4Restrictions.filter((ip) => ip !== selectedRestriction)
      : ipv4Restrictions
    const dbAllowedCidrsV6 = ipv6Restrictions.includes(selectedRestriction)
      ? ipv6Restrictions.filter((ip) => ip !== selectedRestriction)
      : ipv6Restrictions

    if (dbAllowedCidrs.length === 0 && dbAllowedCidrsV6.length === 0) {
      applyNetworkRestrictions({
        projectRef: ref,
        dbAllowedCidrs: ['0.0.0.0/0'],
        dbAllowedCidrsV6: ['::/0'],
      })
    } else {
      applyNetworkRestrictions({ projectRef: ref, dbAllowedCidrs, dbAllowedCidrsV6 })
    }
  }

  return (
    <Dialog
      open={visible}
      onOpenChange={(open) => {
        if (!open) {
          setVisible(false)
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
          Remove
        </ButtonTooltip>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm to remove restriction</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          The IPv4 address <code className="text-xs">{selectedRestriction}</code> will be removed
          from your list of network restrictions
          {isRemovingOnlyRestriction
            ? '.'
            : ", and no longer have access to your project's database."}
        </DialogSection>
        {isRemovingOnlyRestriction && (
          <Admonition
            type="warning"
            title="Database access will no longer be restricted"
            description="Removing all network restrictions will default to your database being accessible from
            all IP addresses."
          />
        )}
        <DialogFooter>
          <Button
            type="default"
            disabled={isApplying}
            onClick={() => {
              setVisible(false)
              onClose?.()
            }}
          >
            Cancel
          </Button>
          <Button loading={isApplying} onClick={onSubmit}>
            Remove restriction
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
