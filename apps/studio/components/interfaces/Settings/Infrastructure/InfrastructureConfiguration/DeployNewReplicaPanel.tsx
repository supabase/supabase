import { useParams } from 'common'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Listbox, SidePanel } from 'ui'

import { Region, useReadReplicaSetUpMutation } from 'data/read-replicas/replica-setup-mutation'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { AWS_REGIONS, AWS_REGIONS_DEFAULT, AWS_REGIONS_KEYS, BASE_PATH } from 'lib/constants'
import { AVAILABLE_REPLICA_REGIONS, AWS_REGIONS_VALUES } from './InstanceConfiguration.constants'

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
  const { mutate: setUpReplica, isLoading: isSettingUp } = useReadReplicaSetUpMutation({
    onSuccess: () => {
      const region = AVAILABLE_REPLICA_REGIONS.find((r) => r.key === selectedRegion)?.name
      toast.success(`Spinning up new replica in ${region ?? ' Unknown'}...`)
      onClose()
    },
  })

  const computeAddons =
    addons?.available_addons.find((addon) => addon.type === 'compute_instance')?.variants ?? []

  // Opting for useState temporarily as Listbox doesn't seem to work with react-hook-form yet
  const [defaultRegion] = Object.entries(AWS_REGIONS).find(
    ([_, name]) => name === AWS_REGIONS_DEFAULT
  ) ?? ['ap-southeast-1']
  // Will be following the primary's instance size for the time being
  const defaultCompute =
    addons?.selected_addons.find((addon) => addon.type === 'compute_instance')?.variant
      .identifier ?? 'ci_small'

  const [selectedRegion, setSelectedRegion] = useState<string>(defaultRegion)
  const [selectedCompute, setSelectedCompute] = useState(defaultCompute)
  const selectedComputeMeta = computeAddons.find((addon) => addon.identifier === selectedCompute)

  const onSubmit = async () => {
    const regionKey = AWS_REGIONS_VALUES[selectedRegion]
    if (!projectRef) return console.error('Project is required')
    if (!regionKey) return toast.error('Unable to deploy replica: Unsupported region selected')

    setUpReplica({ projectRef, region: regionKey as Region })
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
      loading={isSettingUp}
      onCancel={onClose}
      onConfirm={() => onSubmit()}
      confirmText="Deploy replica"
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
          disabled
          size="small"
          id="compute"
          name="compute"
          value={selectedCompute}
          onChange={setSelectedCompute}
          label="Select the instance size for your read replica"
          descriptionText="Read replicas will be on the same instance size as your primary"
        >
          {computeAddons.map((option) => (
            <Listbox.Option key={option.identifier} label={option.name} value={option.identifier}>
              {option.name}
            </Listbox.Option>
          ))}
        </Listbox>

        {/* <p className="text-xs text-foreground-light">
          Show some preview info on cost for deploying this replica here
        </p> */}
      </SidePanel.Content>
    </SidePanel>
  )
}

export default DeployNewReplicaPanel
