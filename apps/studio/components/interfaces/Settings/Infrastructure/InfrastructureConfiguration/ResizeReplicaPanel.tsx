import { useParams } from 'common'
import { useEffect, useState } from 'react'
import { Listbox, SidePanel } from 'ui'

import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { AVAILABLE_REPLICA_REGIONS } from './InstanceConfiguration.constants'
import { AWS_REGIONS, AWS_REGIONS_DEFAULT, AWS_REGIONS_KEYS, BASE_PATH } from 'lib/constants'
import { Database } from 'data/read-replicas/replicas-query'

// [Joshen] FYI this is purely for AWS only, need to update to support Fly eventually

interface ResizeReplicaPanelProps {
  visible: boolean
  selectedReplica?: Database
  onClose: () => void
}

const ResizeReplicaPanel = ({ visible, selectedReplica, onClose }: ResizeReplicaPanelProps) => {
  const { ref: projectRef } = useParams()
  const { data: addons, isSuccess } = useProjectAddonsQuery({ projectRef })
  const computeAddons =
    addons?.available_addons.find((addon) => addon.type === 'compute_instance')?.variants ?? []

  const defaultCompute = computeAddons.find((option) => option.name === 'Small')?.identifier

  const [selectedCompute, setSelectedCompute] = useState(defaultCompute)
  const selectedComputeMeta = computeAddons.find((addon) => addon.identifier === selectedCompute)
  const replicaRegion = AVAILABLE_REPLICA_REGIONS.find((r) =>
    selectedReplica?.region.includes(r.region)
  )

  const onSubmit = async () => {
    console.log('Resize', { selectedCompute })
    onClose()
  }

  useEffect(() => {
    if (visible && isSuccess) {
    }
  }, [visible, isSuccess])

  return (
    <SidePanel
      visible={visible}
      onCancel={onClose}
      onConfirm={() => onSubmit()}
      header={`Resize read replica (ID: ${selectedReplica?.identifier})`}
    >
      <SidePanel.Content className="flex flex-col py-4 gap-y-8">
        <div className="flex flex-col gap-y-1">
          <p className="text-sm text-foreground-light">Replica is currently deployed in</p>
          <div className="flex items-center gap-x-2">
            <img
              alt="region icon"
              className="w-7 rounded-sm"
              src={`${BASE_PATH}/img/regions/${replicaRegion?.key}.svg`}
            />
            <p>{replicaRegion?.name}</p>
          </div>
        </div>
        <Listbox
          size="small"
          id="compute"
          name="compute"
          value={selectedCompute}
          onChange={setSelectedCompute}
          label="Select the instance size for your read replica"
        >
          {computeAddons.map((option) => (
            <Listbox.Option key={option.identifier} label={option.name} value={option.identifier}>
              {option.name}
            </Listbox.Option>
          ))}
        </Listbox>

        <p className="text-xs text-foreground-light">
          Show some preview info on cost for deploying this replica here
        </p>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default ResizeReplicaPanel
