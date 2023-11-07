import { SidePanel } from 'ui'

interface DeployNewReplicaPanelProps {
  visible: boolean
  onClose: () => void
}

const DeployNewReplicaPanel = ({ visible, onClose }: DeployNewReplicaPanelProps) => {
  const onConfirmDeployReplica = async () => {
    console.log('Deploy')
  }

  return (
    <SidePanel
      visible={visible}
      onCancel={onClose}
      onConfirm={onConfirmDeployReplica}
      header="Deploy a new read replica"
    >
      <SidePanel.Content className="py-3">Hello</SidePanel.Content>
    </SidePanel>
  )
}

export default DeployNewReplicaPanel
