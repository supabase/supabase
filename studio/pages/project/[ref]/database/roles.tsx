import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { isUndefined } from 'lodash'

import { DatabaseLayout } from 'components/layouts'
import { RolesList, RolesSettings } from 'components/interfaces/Database'
import { NextPageWithLayout } from 'types'

const DatabaseRoles: NextPageWithLayout = () => {
  const [selectedRole, setSelectedRole] = useState<any>()

  return (
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
  )
}

DatabaseRoles.getLayout = (page) => <DatabaseLayout title="Database">{page}</DatabaseLayout>

export default observer(DatabaseRoles)
