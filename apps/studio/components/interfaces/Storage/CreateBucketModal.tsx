import { useState } from 'react'

import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useAsyncCheckProjectPermissions } from 'hooks/misc/useCheckPermissions'
import { Edit } from 'lucide-react'
import { BucketModal } from './BucketModal'

const CreateBucketModal = () => {
  const [visible, setVisible] = useState(false)
  const { can: canCreateBuckets } = useAsyncCheckProjectPermissions(
    PermissionAction.STORAGE_WRITE,
    '*'
  )

  return (
    <>
      <ButtonTooltip
        block
        type="default"
        icon={<Edit />}
        disabled={!canCreateBuckets}
        style={{ justifyContent: 'start' }}
        onClick={() => setVisible(true)}
        tooltip={{
          content: {
            side: 'bottom',
            text: !canCreateBuckets
              ? 'You need additional permissions to create buckets'
              : undefined,
          },
        }}
      >
        New bucket
      </ButtonTooltip>

      <BucketModal mode="create" visible={visible} onClose={() => setVisible(false)} />
    </>
  )
}

// @deprecated Use BucketModal with mode="create" instead
// eslint-disable-next-line no-restricted-exports
export default CreateBucketModal
