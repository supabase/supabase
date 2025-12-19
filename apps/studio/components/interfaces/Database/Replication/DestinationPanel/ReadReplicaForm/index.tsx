import { useState } from 'react'
import { toast } from 'sonner'

import { useParams } from 'common'
import { AVAILABLE_REPLICA_REGIONS } from 'components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import { Region, useReadReplicaSetUpMutation } from 'data/read-replicas/replica-setup-mutation'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { AWS_REGIONS_DEFAULT, BASE_PATH } from 'lib/constants'
import { AWS_REGIONS, AWS_REGIONS_KEYS } from 'shared-data'
import {
  Button,
  InfoIcon,
  Select_Shadcn_,
  SelectContent_Shadcn_,
  SelectItem_Shadcn_,
  SelectTrigger_Shadcn_,
  SelectValue_Shadcn_,
  SheetFooter,
  SheetSection,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { ReadReplicaEligibilityWarnings } from './ReadReplicaEligibilityWarnings'
import { ReadReplicaPricingDialog } from './ReadReplicaPricingDialog'
import { useCheckEligibilityDeployReplica } from './useCheckEligibilityDeployReplica'
import { useGetReplicaCost } from './useGetReplicaCost'

interface ReadReplicaFormProps {
  // [Joshen] Need to refetch replicas on the parent since they're created async
  onSuccess?: () => void
  onClose: () => void
}

export const ReadReplicaForm = ({ onSuccess, onClose }: ReadReplicaFormProps) => {
  const { ref: projectRef } = useParams()
  const { data } = useReadReplicasQuery({ projectRef })

  const [defaultRegion] = Object.entries(AWS_REGIONS).find(
    ([_, name]) => name === AWS_REGIONS_DEFAULT
  ) ?? ['ap-southeast-1']
  const { totalCost } = useGetReplicaCost()
  const { can: canDeployReplica } = useCheckEligibilityDeployReplica()

  const [selectedRegion, setSelectedRegion] = useState<string>(defaultRegion)

  const { mutate: setUpReplica, isPending: isSettingUp } = useReadReplicaSetUpMutation({
    onSuccess: () => {
      const region = AVAILABLE_REPLICA_REGIONS.find((r) => r.key === selectedRegion)?.name
      toast.success(`Spinning up new replica in ${region ?? ' Unknown'}...`)
      onSuccess?.()
      onClose()
    },
  })

  const availableRegions =
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
      ? AVAILABLE_REPLICA_REGIONS.filter((x) =>
          ['SOUTHEAST_ASIA', 'CENTRAL_EU', 'EAST_US'].includes(x.key)
        )
      : AVAILABLE_REPLICA_REGIONS

  const onSubmit = async () => {
    const regionKey = AWS_REGIONS[selectedRegion as AWS_REGIONS_KEYS].code
    if (!projectRef) return console.error('Project is required')
    if (!regionKey) return toast.error('Unable to deploy replica: Unsupported region selected')

    const primary = data?.find((db) => db.identifier === projectRef)
    setUpReplica({ projectRef, region: regionKey as Region, size: primary?.size ?? 't4g.small' })
  }

  return (
    <>
      {!canDeployReplica && (
        <SheetSection>
          <ReadReplicaEligibilityWarnings />
        </SheetSection>
      )}

      <SheetSection className="flex-grow overflow-auto px-0 py-0">
        <FormItemLayout
          isReactForm={false}
          layout="horizontal"
          className="p-5 [&>div]:gap-y-1 [&>div>span]:text-foreground-lighter"
          label="Region"
          labelOptional="Select a region to deploy your replica in"
        >
          <Select_Shadcn_
            value={selectedRegion}
            onValueChange={setSelectedRegion}
            disabled={!canDeployReplica}
          >
            <SelectTrigger_Shadcn_>
              <SelectValue_Shadcn_ placeholder="Select a region" />
            </SelectTrigger_Shadcn_>
            <SelectContent_Shadcn_>
              {availableRegions.map((region) => (
                <SelectItem_Shadcn_ key={region.key} value={region.key}>
                  <div className="flex gap-x-3 items-center">
                    <img
                      alt="region icon"
                      className="w-5 rounded-sm"
                      src={`${BASE_PATH}/img/regions/${region.region}.svg`}
                    />
                    <p className="flex items-center gap-x-2">
                      <span>{region.name}</span>
                      <span className="text-xs text-foreground-lighter font-mono">
                        {region.region}
                      </span>
                    </p>
                  </div>
                </SelectItem_Shadcn_>
              ))}
            </SelectContent_Shadcn_>
          </Select_Shadcn_>
        </FormItemLayout>
      </SheetSection>
      <SheetFooter className="!justify-between">
        <div className="flex items-center gap-x-4">
          <InfoIcon className="h-5 w-5" />
          <p className="text-sm">
            New replica will cost an additional <span translate="no">{totalCost}/month</span>
          </p>
          <ReadReplicaPricingDialog />
        </div>

        <div className="flex items-center gap-x-2">
          <Button disabled={isSettingUp} type="default" onClick={onClose}>
            Cancel
          </Button>
          <Button disabled={!canDeployReplica} loading={isSettingUp} onClick={onSubmit}>
            Deploy replica
          </Button>
        </div>
      </SheetFooter>
    </>
  )
}
