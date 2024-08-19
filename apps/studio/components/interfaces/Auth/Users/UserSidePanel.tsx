import SimpleCodeBlock from 'components/to-be-cleaned/SimpleCodeBlock'
import type { User } from 'data/auth/users-query'
import { SidePanel } from 'ui'

interface UsersSidePanelProps {
  userSidePanelOpen: boolean
  selectedUser: User | undefined
  setUserSidePanelOpen: (open: boolean) => void
}
const UsersSidePanel = ({
  selectedUser,
  userSidePanelOpen,
  setUserSidePanelOpen,
}: UsersSidePanelProps) => {
  return (
    <SidePanel
      size="large"
      header="View user info"
      visible={userSidePanelOpen}
      onCancel={() => setUserSidePanelOpen(false)}
      cancelText="Close"
    >
      <SidePanel.Content className="space-y-10 py-6">
        <SimpleCodeBlock className="javascript">
          {JSON.stringify(selectedUser, null, 2)}
        </SimpleCodeBlock>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default UsersSidePanel
