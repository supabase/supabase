import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { isUndefined } from 'lodash'

import { DatabaseLayout } from 'components/layouts'
import { RolesList, RolesSettings } from 'components/interfaces/Database'
import { NextPageWithLayout } from 'types'

const DatabaseRoles: NextPageWithLayout = () => {
  const [selectedRole, setSelectedRole] = useState<any>()

  return (
    <div className="1xl:px-28 mx-auto flex flex-col px-5 pt-6 pb-14 lg:px-16 xl:px-24 2xl:px-32">
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
