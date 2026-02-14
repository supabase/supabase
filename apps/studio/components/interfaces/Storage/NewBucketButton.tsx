import { PermissionAction } from '@supabase/shared-types/out/constants'
import { Plus } from 'lucide-react'
import { MouseEventHandler } from 'react'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'

export const CreateBucketButton = ({
  onClick,
}: {
  onClick?: MouseEventHandler<HTMLButtonElement>
}) => {
  const { can: canCreateBuckets } = useAsyncCheckPermissions(PermissionAction.STORAGE_WRITE, '*')

  return (
    <ButtonTooltip
      block
      size="tiny"
      type="primary"
      className="w-fit"
      icon={<Plus size={14} />}
      disabled={!canCreateBuckets}
      onClick={onClick}
      tooltip={{
        content: {
          side: 'bottom',
          text: !canCreateBuckets ? 'You need additional permissions to create buckets' : undefined,
        },
      }}
    >
      New bucket
    </ButtonTooltip>
  )
}
