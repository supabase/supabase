import { PermissionAction } from '@supabase/shared-types/out/constants'
import NoPermission from 'components/ui/NoPermission'
import { useAsyncCheckPermissions } from 'hooks/misc/useCheckPermissions'

import AddEnvironmentVariableForm from './AddEnvironmentVariableForm'
import { EnvironmentVariablesTable } from './EnvironmentVariablesTable'

export const EnvironmentVariablesPage = () => {
  const { can: canUpdateSecrets } = useAsyncCheckPermissions(PermissionAction.SECRETS_WRITE, '*')

  return (
    <div className="space-y-8">
      {canUpdateSecrets ? (
        <AddEnvironmentVariableForm />
      ) : (
        <NoPermission resourceText="manage this project's environment variables" />
      )}
      <EnvironmentVariablesTable />
    </div>
  )
}
