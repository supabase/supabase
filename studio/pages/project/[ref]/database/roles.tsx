import { useState } from 'react'
import { NextPage } from 'next'
import { observer } from 'mobx-react-lite'
import { isUndefined } from 'lodash'

import { withAuth } from 'hooks'
import { DatabaseLayout } from 'components/layouts'
import { RolesList, RolesSettings } from 'components/interfaces/Database'

const DatabaseRoles: NextPage = () => {
  const [selectedRole, setSelectedRole] = useState<any>()

  return (
    <DatabaseLayout title="Database">
      <div className="p-4">
        {isUndefined(selectedRole) ? (
          <RolesList onSelectRole={setSelectedRole} />
        ) : (
          <RolesSettings
            selectedRole={selectedRole}
            onSelectBack={() => setSelectedRole(undefined)}
          />
        )}
      </div>
    </DatabaseLayout>
  )
}

export default withAuth(observer(DatabaseRoles))
