import { Plus } from 'lucide-react'
import { MouseEventHandler } from 'react'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { FGA_PERMISSIONS, useAsyncCheckPermissionsV2 } from '@/hooks/misc/useCheckPermissionsV2'

export const CreateBucketButton = ({
  onClick,
}: {
  onClick: MouseEventHandler<HTMLButtonElement>
}) => {
  const { can: canCreateBuckets } = useAsyncCheckPermissionsV2(
    FGA_PERMISSIONS.PROJECT.STORAGE_WRITE
  )

  return (
    <ButtonTooltip
      block
      size="tiny"
      variant="primary"
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
