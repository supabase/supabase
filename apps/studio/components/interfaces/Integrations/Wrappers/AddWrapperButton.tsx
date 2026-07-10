import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useMemo } from 'react'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const WRAPPER_REQUIRED_EXTENSION_NAMES = ['wrappers', 'supabase_vault']

interface AddWrapperButtonProps {
  variant?: 'default' | 'primary' | 'outline'
  onClick: () => void
}

export const AddWrapperButton = ({ variant = 'default', onClick }: AddWrapperButtonProps) => {
  const { can: canCreateWrapper } = useAsyncCheckPermissions(
    PermissionAction.TENANT_SQL_ADMIN_WRITE,
    'wrappers'
  )

  const { data: project } = useSelectedProjectQuery()
  const { data: extensions } = useDatabaseExtensionsQuery({
    projectRef: project?.ref,
    connectionString: project?.connectionString,
  })

  const needsExtensions = useMemo(
    () =>
      WRAPPER_REQUIRED_EXTENSION_NAMES.some(
        (name) => !extensions?.find((ext) => ext.name === name)?.installed_version
      ),
    [extensions]
  )

  return (
    <ButtonTooltip
      variant={variant}
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
      {needsExtensions ? 'Install wrapper' : 'Add new wrapper'}
    </ButtonTooltip>
  )
}
