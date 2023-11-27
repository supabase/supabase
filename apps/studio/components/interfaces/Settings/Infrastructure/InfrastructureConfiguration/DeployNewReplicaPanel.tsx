import { useParams } from 'common'
import { useEffect, useState } from 'react'
import { Listbox, SidePanel } from 'ui'

import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { AVAILABLE_REPLICA_REGIONS } from './InstanceConfiguration.constants'
import { AWS_REGIONS, AWS_REGIONS_DEFAULT, AWS_REGIONS_KEYS, BASE_PATH } from 'lib/constants'

// [Joshen] FYI this is purely for AWS only, need to update to support Fly eventually

interface DeployNewReplicaPanelProps {
  visible: boolean
  selectedDefaultRegion?: AWS_REGIONS_KEYS
  onClose: () => void
}

const DeployNewReplicaPanel = ({
  visible,
  selectedDefaultRegion,
  onClose,
}: DeployNewReplicaPanelProps) => {
  const { ref: projectRef } = useParams()
  const { data: addons, isSuccess } = useProjectAddonsQuery({ projectRef })
  const computeAddons =
    addons?.available_addons.find((addon) => addon.type === 'compute_instance')?.variants ?? []

  // Opting for useState temporarily as Listbox doesn't seem to work with react-hook-form yet
  const [defaultRegion] =
    Object.entries(AWS_REGIONS).find(([key, name]) => name === AWS_REGIONS_DEFAULT) ?? []
  const defaultCompute = computeAddons.find((option) => option.name === 'Small')?.identifier

  const [selectedRegion, setSelectedRegion] = useState(defaultRegion)
  const [selectedCompute, setSelectedCompute] = useState(defaultCompute)
  const selectedComputeMeta = computeAddons.find((addon) => addon.identifier === selectedCompute)

  const onSubmit = async () => {
    console.log('Deploy', { selectedRegion, selectedCompute })
    onClose()
  }

  useEffect(() => {
    if (visible && isSuccess) {
      if (selectedDefaultRegion !== undefined) {
        setSelectedRegion(selectedDefaultRegion)
      } else if (defaultRegion) {
        setSelectedRegion(defaultRegion)
      }
      if (defaultCompute !== undefined) setSelectedCompute(defaultCompute)
    }
  }, [visible, isSuccess])

  return (
    <SidePanel
      visible={visible}
      onCancel={onClose}
      onConfirm={() => onSubmit()}
      header="Deploy a new read replica"
    >
      <SidePanel.Content className="flex flex-col py-4 gap-y-8">
        <Listbox
          size="small"
          id="region"
          name="region"
          value={selectedRegion}
          onChange={setSelectedRegion}
          label="Select a region to deploy your read replica in"
        >
          {AVAILABLE_REPLICA_REGIONS.map((region) => (
            <Listbox.Option
              key={region.key}
              label={region.name}
              value={region.key}
              addOnBefore={() => (
                <img
                  alt="region icon"
                  className="w-5 rounded-sm"
                  src={`${BASE_PATH}/img/regions/${region.key}.svg`}
                />
              )}
            >
              {region.name}
            </Listbox.Option>
          ))}
        </Listbox>

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

export default DeployNewReplicaPanel
