import { FC } from 'react'
import { observer } from 'mobx-react-lite'
import { Button, Divider, Typography, IconChevronLeft } from '@supabase/ui'

import Panel from 'components/to-be-cleaned/Panel'

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
          <Typography.Text>Super user</Typography.Text>
          <Typography.Text small code>
            {selectedRole.is_superuser ? 'true' : 'false'}
          </Typography.Text>
        </Panel.Content>
        <Divider light />
        <Panel.Content className="w-full flex justify-between items-center">
          <Typography.Text>User can login</Typography.Text>
          <Typography.Text small code>
            {selectedRole.can_login ? 'true' : 'false'}
          </Typography.Text>
        </Panel.Content>
        <Divider light />
        <Panel.Content className="w-full flex justify-between items-center">
          <Typography.Text>User can create databases</Typography.Text>
          <Typography.Text small code>
            {selectedRole.can_create_db ? 'true' : 'false'}
          </Typography.Text>
        </Panel.Content>
        <Divider light />
        <Panel.Content className="w-full flex justify-between items-center">
          <Typography.Text>
            User can initiate streaming replication and put the system in and out of backup mode
          </Typography.Text>
          <Typography.Text small code>
            {selectedRole.is_replication_role ? 'true' : 'false'}
          </Typography.Text>
        </Panel.Content>
        <Divider light />
        <Panel.Content className="w-full flex justify-between items-center">
          <Typography.Text>User bypasses every row level security policy</Typography.Text>
          <Typography.Text small code>
            {selectedRole.can_bypass_rls ? 'true' : 'false'}
          </Typography.Text>
        </Panel.Content>
      </Panel>
    </>
  )
}

export default observer(RolesSettings)
