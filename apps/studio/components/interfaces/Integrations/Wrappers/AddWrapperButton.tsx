import { PermissionAction } from '@supabase/shared-types/out/constants'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'

interface AddWrapperButtonProps {
  type?: 'default' | 'primary' | 'outline'
  onClick: () => void
}

export const AddWrapperButton = ({ type = 'default', onClick }: AddWrapperButtonProps) => {
  const { can: canCreateWrapper } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'wrappers'
  )

  return (
    <ButtonTooltip
      type={type}
      onClick={onClick}
      disabled={!canCreateWrapper}
      tooltip={{
        content: {
          text: !canCreateWrapper
            ? 'You need additional permissions to create a foreign data wrapper'
            : undefined,
        },
      }}
    >
      Add new wrapper
    </ButtonTooltip>
  )
}
