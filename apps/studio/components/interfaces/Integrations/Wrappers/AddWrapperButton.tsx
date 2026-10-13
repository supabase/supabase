import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import Link from 'next/link'
import { useMemo } from 'react'

import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useDatabaseExtensionsQuery } from '@/data/database-extensions/database-extensions-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

const WRAPPER_REQUIRED_EXTENSION_NAMES = ['wrappers', 'supabase_vault']

interface AddWrapperButtonProps {
  variant?: 'default' | 'primary' | 'outline'
}

export const AddWrapperButton = ({ variant = 'default' }: AddWrapperButtonProps) => {
  const { ref, id } = useParams()

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

  const label = needsExtensions ? 'Install wrapper' : 'Add new wrapper'

  return (
    <ButtonTooltip
      asChild={canCreateWrapper}
      variant={variant}
      disabled={!canCreateWrapper}
      tooltip={{
        content: {
          side: 'bottom',
          text: !canCreateWrapper
            ? 'You need additional permissions to create a foreign data wrapper'
            : undefined,
        },
      }}
    >
      {canCreateWrapper ? (
        <Link href={`/project/${ref}/integrations/${id}/wrappers?new=true`}>{label}</Link>
      ) : (
        label
      )}
    </ButtonTooltip>
  )
}
