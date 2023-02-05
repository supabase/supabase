import { useState } from 'react'
import { observer } from 'mobx-react-lite'
import { isUndefined } from 'lodash'

import { DatabaseLayout } from 'components/layouts'
import { RolesList, RolesSettings } from 'components/interfaces/Database'
import { NextPageWithLayout } from 'types'
import { Button, IconPlus } from 'ui'
import { RoleCreate } from 'components/interfaces/Database'

const DatabaseRoles: NextPageWithLayout = () => {
  const [selectedRole, setSelectedRole] = useState<any>()
  const [isCreatingRole, setIsCreatingRole] = useState<boolean>(false)

  const onCreateRole = () => {
    setIsCreatingRole(true)
  }

  const onClose = () => {
    setIsCreatingRole(false)
  }

  return (
    <div className="p-4">
      <div className="mb-4 flex justify-end">
        <Button size="tiny" icon={<IconPlus size={14} strokeWidth={2} />} onClick={onCreateRole}>
          Create new role
        </Button>
      </div>
      <RoleCreate visible={isCreatingRole} onClose={onClose}></RoleCreate>
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
