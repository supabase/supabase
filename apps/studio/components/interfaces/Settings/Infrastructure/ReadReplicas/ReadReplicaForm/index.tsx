import { useParams } from 'common'
import { useState, type ReactNode } from 'react'
import { AWS_REGIONS, AWS_REGIONS_KEYS } from 'shared-data'
import { toast } from 'sonner'
import {
  Button,
  DialogFooter,
  DialogSection,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from 'ui'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { ReadReplicaEligibilityWarnings } from './ReadReplicaEligibilityWarnings'
import { ReadReplicaPricingDialog } from './ReadReplicaPricingDialog'
import { useCheckEligibilityDeployReplica } from './useCheckEligibilityDeployReplica'
import { useGetReplicaCost } from './useGetReplicaCost'
import { AVAILABLE_REPLICA_REGIONS } from '@/components/interfaces/Settings/Infrastructure/InfrastructureConfiguration/InstanceConfiguration.constants'
import type { RecommendedComputeForReadReplicas } from '@/components/interfaces/Settings/Infrastructure/ReadReplicas/recommendCompute'
import { RegionFlag } from '@/components/ui/RegionFlag'
import { Region, useReadReplicaSetUpMutation } from '@/data/read-replicas/replica-setup-mutation'
import { useReadReplicasQuery } from '@/data/read-replicas/replicas-query'
import { AWS_REGIONS_DEFAULT } from '@/lib/constants'

interface ReadReplicaFormProps {
  typeSelection?: ReactNode
  onSuccess: () => void
  onClose: () => void
  onRecommendCompute: (size: RecommendedComputeForReadReplicas) => void
}

export const ReadReplicaForm = ({
  typeSelection,
  onSuccess,
  onClose,
  onRecommendCompute,
}: ReadReplicaFormProps) => {
  const { ref: projectRef } = useParams()
  const { data } = useReadReplicasQuery({ projectRef })
  const eligibility = useCheckEligibilityDeployReplica()
  const replicaCost = useGetReplicaCost()

  const [defaultRegion] = Object.entries(AWS_REGIONS).find(
    ([_, name]) => name === AWS_REGIONS_DEFAULT
  ) ?? ['SOUTHEAST_ASIA']
  const { can: canDeployReplica } = eligibility

  const [selectedRegion, setSelectedRegion] = useState<string>(defaultRegion)

  const { mutate: setUpReplica, isPending: isSettingUp } = useReadReplicaSetUpMutation({
    onSuccess: () => {
      const region = AVAILABLE_REPLICA_REGIONS.find((r) => r.key === selectedRegion)?.name
      toast.success(`Spinning up new replica in ${region ?? 'Unknown'}...`)
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
  const selectedRegionDetails = availableRegions.find((region) => region.key === selectedRegion)

  const onSubmit = async () => {
    if (!projectRef) return console.error('Project is required')

    const regionKey = AWS_REGIONS[selectedRegion as AWS_REGIONS_KEYS]?.code
    if (!regionKey) return toast.error('Unable to deploy replica: Unsupported region selected')

    const primary = data?.find((db) => db.identifier === projectRef)
    setUpReplica({ projectRef, region: regionKey as Region, size: primary?.size ?? 't4g.small' })
  }

  return (
    <>
      <DialogSection className="flex flex-col p-0!">
        {typeSelection}
        <FormItemLayout
          isReactForm={false}
          layout="vertical"
          className="p-5 [&>div]:gap-y-1 [&>div>span]:text-foreground-lighter"
          label="Region"
          description={
            canDeployReplica ? (
              <span>
                This replica will be deployed in{' '}
                <span translate="no">{selectedRegionDetails?.region}</span>.
              </span>
            ) : undefined
          }
        >
          <Select
            value={selectedRegion}
            onValueChange={setSelectedRegion}
            disabled={!canDeployReplica}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a region">
                <span className="flex min-w-0 items-center gap-x-2">
                  {selectedRegionDetails !== undefined && (
                    <RegionFlag className="w-5 shrink-0" region={selectedRegionDetails.region} />
                  )}
                  <span className="truncate">{selectedRegionDetails?.name}</span>
                </span>
              </SelectValue>
            </SelectTrigger>
            <SelectContent>
              {availableRegions.map((region) => (
                <SelectItem key={region.key} value={region.key}>
                  <div className="flex gap-x-3 items-center">
                    <RegionFlag className="w-5" region={region.region} />
                    <p className="flex items-center gap-x-2">
                      <span>{region.name}</span>
                      <span className="text-xs text-foreground-lighter font-mono">
                        {region.region}
                      </span>
                    </p>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </FormItemLayout>
      </DialogSection>
      {canDeployReplica ? (
        <ReadReplicaPricingDialog replicaCost={replicaCost} />
      ) : (
        <div className="[&>[role=alert]]:mb-0 [&>[role=alert]]:rounded-none [&>[role=alert]]:border-x-0">
          <ReadReplicaEligibilityWarnings
            eligibility={eligibility}
            onRecommendCompute={onRecommendCompute}
          />
        </div>
      )}

      <DialogFooter className="border-t-0">
        <Button disabled={isSettingUp} variant="default" onClick={onClose}>
          Cancel
        </Button>
        <Button disabled={!canDeployReplica} loading={isSettingUp} onClick={onSubmit}>
          Add replica
        </Button>
      </DialogFooter>
    </>
  )
}
