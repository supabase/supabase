import { FC } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, IconChevronLeft } from '@supabase/ui'
import Divider from 'components/ui/Divider'

import Panel from 'components/ui/Panel'

interface Props {
  selectedRole: any
  onSelectBack: () => void
}

const RolesSettings: FC<Props> = ({ selectedRole, onSelectBack = () => {} }) => {
  return (
    <>
      <div className="mb-8">
        <div className="">
          <nav className="flex -mb-px">
            <div className="group inline-flex items-center p-1 mr-4 ">
              <Button
                type="outline"
                onClick={() => onSelectBack()}
                icon={<IconChevronLeft size="small" />}
                style={{ padding: '5px' }}
              />
            </div>
            <a
              href="#"
              className="
              text-typography-body-strong-light dark:text-typography-body-strong-dark
              mx-4 group inline-flex items-center p-1 border-b-2 border-green-500 font-medium text-sm focus:outline-none "
              aria-current="page"
            >
              <span>Permissions</span>
            </a>
          </nav>
        </div>
      </div>

      <Panel>
        <Panel.Content className="w-full flex justify-between items-center">
          <p className="text-sm">Super user</p>
          <code className="text-sm">{selectedRole.is_superuser ? 'true' : 'false'}</code>
        </Panel.Content>
        <Divider light />
        <Panel.Content className="w-full flex justify-between items-center">
          <p className="text-sm">User can login</p>
          <code className="text-sm">{selectedRole.can_login ? 'true' : 'false'}</code>
        </Panel.Content>
        <Divider light />
        <Panel.Content className="w-full flex justify-between items-center">
          <p className="text-sm">User can create databases</p>
          <code className="text-sm">{selectedRole.can_create_db ? 'true' : 'false'}</code>
        </Panel.Content>
        <Divider light />
        <Panel.Content className="w-full flex justify-between items-center">
          <p className="text-sm">
            User can initiate streaming replication and put the system in and out of backup mode
          </p>
          <code className="text-sm">{selectedRole.is_replication_role ? 'true' : 'false'}</code>
        </Panel.Content>
        <Divider light />
        <Panel.Content className="w-full flex justify-between items-center">
          <p className="text-sm">User bypasses every row level security policy</p>
          <code className="text-sm">{selectedRole.can_bypass_rls ? 'true' : 'false'}</code>
        </Panel.Content>
      </Panel>
    </>
  )
}

export default observer(RolesSettings)
