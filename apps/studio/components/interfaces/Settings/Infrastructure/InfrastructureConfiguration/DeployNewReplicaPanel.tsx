import { ExternalLink } from 'lucide-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'

import { useParams } from 'common'
import { useEnablePhysicalBackupsMutation } from 'data/database/enable-physical-backups-mutation'
import { useProjectDetailQuery } from 'data/projects/project-detail-query'
import { Region, useReadReplicaSetUpMutation } from 'data/read-replicas/replica-setup-mutation'
import { useReadReplicasQuery } from 'data/read-replicas/replicas-query'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProject } from 'hooks/misc/useSelectedProject'
import { AWS_REGIONS_DEFAULT, BASE_PATH } from 'lib/constants'
import type { AWS_REGIONS_KEYS } from 'shared-data'
import { AWS_REGIONS } from 'shared-data'
import {
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Button,
  Listbox,
  SidePanel,
} from 'ui'
import { WarningIcon } from 'ui'
import { AVAILABLE_REPLICA_REGIONS } from './InstanceConfiguration.constants'

// [Joshen] FYI this is purely for AWS only, need to update to support Fly eventually

interface DeployNewReplicaPanelProps {
  visible: boolean
  selectedDefaultRegion?: AWS_REGIONS_KEYS
  onSuccess: () => void
  onClose: () => void
}

const DeployNewReplicaPanel = ({
  visible,
  selectedDefaultRegion,
  onSuccess,
  onClose,
}: DeployNewReplicaPanelProps) => {
  const { ref: projectRef } = useParams()
  const project = useSelectedProject()
  const org = useSelectedOrganization()
  const [refetchInterval, setRefetchInterval] = useState<number | false>(false)

  const { data } = useReadReplicasQuery({ projectRef })
  const { data: addons, isSuccess } = useProjectAddonsQuery({ projectRef })
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: org?.slug })

  useProjectDetailQuery(
    { ref: projectRef },
    {
      refetchInterval,
      refetchOnWindowFocus: false,
      onSuccess: (data) => {
        if (data.is_physical_backups_enabled) setRefetchInterval(false)
      },
    }
  )

  const { mutate: enablePhysicalBackups, isLoading: isEnabling } = useEnablePhysicalBackupsMutation(
    {
      onSuccess: () => {
        toast.success(
          'Physical backups are currently being enabled, please check back in a few minutes!'
        )
        setRefetchInterval(5000)
      },
    }
  )

  const { mutate: setUpReplica, isLoading: isSettingUp } = useReadReplicaSetUpMutation({
    onSuccess: () => {
      const region = AVAILABLE_REPLICA_REGIONS.find((r) => r.key === selectedRegion)?.name
      toast.success(`Spinning up new replica in ${region ?? ' Unknown'}...`)
      onSuccess()
      onClose()
    },
  })

  const currentPgVersion = Number(
    (project?.dbVersion ?? '').split('supabase-postgres-')[1]?.split('.')[0]
  )

  const reachedMaxReplicas = (data ?? []).filter((db) => db.identifier !== projectRef).length >= 2
  const isFreePlan = subscription?.plan.id === 'free'
  const isAWSProvider = project?.cloud_provider === 'AWS'
  const isWalgEnabled = project?.is_physical_backups_enabled
  const currentComputeAddon = addons?.selected_addons.find(
    (addon) => addon.type === 'compute_instance'
  )
  const isMinimallyOnSmallCompute =
    currentComputeAddon?.variant.identifier !== undefined &&
    currentComputeAddon?.variant.identifier !== 'ci_micro'
  const canDeployReplica =
    !reachedMaxReplicas &&
    currentPgVersion >= 15 &&
    isAWSProvider &&
    !isFreePlan &&
    isWalgEnabled &&
    currentComputeAddon !== undefined

  const computeAddons =
    addons?.available_addons.find((addon) => addon.type === 'compute_instance')?.variants ?? []

  // Opting for useState temporarily as Listbox doesn't seem to work with react-hook-form yet
  const [defaultRegion] = Object.entries(AWS_REGIONS).find(
    ([_, name]) => name === AWS_REGIONS_DEFAULT
  ) ?? ['ap-southeast-1']
  // Will be following the primary's compute size for the time being
  const defaultCompute =
    addons?.selected_addons.find((addon) => addon.type === 'compute_instance')?.variant
      .identifier ?? 'ci_micro'

  const [selectedRegion, setSelectedRegion] = useState<string>(defaultRegion)
  const [selectedCompute, setSelectedCompute] = useState(defaultCompute)
  const selectedComputeMeta = computeAddons.find((addon) => addon.identifier === selectedCompute)

  const availableRegions =
    process.env.NEXT_PUBLIC_ENVIRONMENT === 'staging'
      ? AVAILABLE_REPLICA_REGIONS.filter((x) => x.key === 'SOUTHEAST_ASIA')
      : AVAILABLE_REPLICA_REGIONS

  const onSubmit = async () => {
    const regionKey = AWS_REGIONS[selectedRegion as AWS_REGIONS_KEYS].code
    if (!projectRef) return console.error('Project is required')
    if (!regionKey) return toast.error('Unable to deploy replica: Unsupported region selected')

    const primary = data?.find((db) => db.identifier === projectRef)
    setUpReplica({ projectRef, region: regionKey as Region, size: primary?.size ?? 't4g.small' })
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
      loading={isSettingUp}
      disabled={!canDeployReplica}
      header="Deploy a new read replica"
      onConfirm={() => onSubmit()}
      confirmText="Deploy replica"
      // [Joshen] Refer to EnablePhysicalBackupsModal as to why this is commented out for now
      // customFooter={
      //   <div className="border-t p-2 flex items-center justify-end space-x-2">
      //     <Button type="default" disabled={false} onClick={onClose}>
      //       Cancel
      //     </Button>
      //     {isMinimallyOnSmallCompute && !isWalgEnabled ? (
      //       <EnablePhysicalBackupsModal selectedRegion={selectedRegion} />
      //     ) : (
      //       <Button
      //         type="primary"
      //         disabled={!canDeployReplica}
      //         loading={isSettingUp}
      //         onClick={onSubmit}
      //       >
      //         Deploy replica
      //       </Button>
      //     )}
      //   </div>
      // }
    >
      <SidePanel.Content className="flex flex-col py-4 gap-y-4">
        {!isAWSProvider ? (
          <Alert_Shadcn_>
            <WarningIcon />
            <AlertTitle_Shadcn_>
              Read replicas are only supported for projects provisioned via AWS
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              <span>
                Projects provisioned by other cloud providers currently will not be able to use read
                replicas
              </span>
              <div className="mt-3">
                <Button asChild type="default" icon={<ExternalLink size={14} />}>
                  <a
                    href="https://supabase.com/docs/guides/platform/read-replicas#prerequisites"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Documentation
                  </a>
                </Button>
              </div>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        ) : currentPgVersion < 15 ? (
          <Alert_Shadcn_>
            <WarningIcon />
            <AlertTitle_Shadcn_>
              Read replicas can only be deployed with projects on Postgres version 15 and above
            </AlertTitle_Shadcn_>
            <AlertDescription_Shadcn_>
              If you'd like to use read replicas, please contact us via support
            </AlertDescription_Shadcn_>
            <AlertDescription_Shadcn_ className="mt-2">
              <Button type="default">
                <Link
                  href={`/support/new?category=Sales&ref=${projectRef}&subject=Enquiry%20on%20read%20replicas&message=Project%20DB%20version:%20${project?.dbVersion}`}
                  target="_blank"
                  rel="noreferrer"
                >
                  Contact support
                </Link>
              </Button>
            </AlertDescription_Shadcn_>
          </Alert_Shadcn_>
        ) : (
          <>
            {!isMinimallyOnSmallCompute && (
              <Alert_Shadcn_>
                <WarningIcon />
                <AlertTitle_Shadcn_>
                  Project required to at least be on a Small compute
                </AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  <span>
                    This is to ensure that read replicas can keep up with the primary databases'
                    activities.
                  </span>
                  <div className="flex items-center gap-x-2 mt-3">
                    <Button asChild type="default">
                      <Link
                        href={
                          isFreePlan
                            ? `/org/${org?.slug}/billing?panel=subscriptionPlan`
                            : `/project/${projectRef}/settings/addons?panel=computeInstance`
                        }
                      >
                        {isFreePlan ? 'Upgrade to Pro' : 'Change compute size'}
                      </Link>
                    </Button>
                    <Button asChild type="default" icon={<ExternalLink size={14} />}>
                      <a
                        href="https://supabase.com/docs/guides/platform/read-replicas#prerequisites"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Documentation
                      </a>
                    </Button>
                  </div>
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            )}

            {isMinimallyOnSmallCompute && !isWalgEnabled && (
              <Alert_Shadcn_>
                <WarningIcon />
                <AlertTitle_Shadcn_>
                  {refetchInterval !== false
                    ? 'Physical backups are currently being enabled'
                    : 'Physical backups are required to deploy replicas'}
                </AlertTitle_Shadcn_>
                {refetchInterval === false && (
                  <AlertDescription_Shadcn_ className="mb-2">
                    Physical backups are used under the hood to spin up read replicas for your
                    project.
                  </AlertDescription_Shadcn_>
                )}
                <AlertDescription_Shadcn_>
                  {refetchInterval !== false
                    ? 'This warning will go away once physical backups have been enabled - check back in a few minutes!'
                    : 'Enabling physical backups will take a few minutes, after which you will be able to deploy read replicas.'}
                </AlertDescription_Shadcn_>
                {refetchInterval !== false ? (
                  <AlertDescription_Shadcn_ className="mt-2">
                    You may start deploying read replicas thereafter once this is completed.
                  </AlertDescription_Shadcn_>
                ) : (
                  <AlertDescription_Shadcn_ className="flex items-center gap-x-2 mt-3">
                    <Button
                      type="default"
                      loading={isEnabling}
                      disabled={isEnabling}
                      onClick={() => {
                        if (projectRef) enablePhysicalBackups({ ref: projectRef })
                      }}
                    >
                      Enable physical backups
                    </Button>
                    <Button asChild type="default" icon={<ExternalLink size={14} />}>
                      <a
                        href="https://supabase.com/docs/guides/platform/read-replicas#how-are-read-replicas-made"
                        target="_blank"
                        rel="noreferrer"
                      >
                        Documentation
                      </a>
                    </Button>
                  </AlertDescription_Shadcn_>
                )}
              </Alert_Shadcn_>
            )}

            {reachedMaxReplicas && (
              <Alert_Shadcn_>
                <WarningIcon />
                <AlertTitle_Shadcn_>
                  You can only deploy up to 2 read replicas at once
                </AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  If you'd like to spin up another read replica, please drop an existing replica
                  first.
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            )}
          </>
        )}

        <div className="flex flex-col gap-y-6 mt-2">
          <Listbox
            size="small"
            id="region"
            name="region"
            disabled={!canDeployReplica}
            value={selectedRegion}
            onChange={setSelectedRegion}
            label="Select a region to deploy your read replica in"
          >
            {availableRegions.map((region) => (
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

          <div className="flex flex-col gap-y-2">
            <p className="text-foreground-light text-sm">
              Read replicas will be on the same compute size as your primary database. Deploying a
              read replica on the {selectedComputeMeta?.name} size incurs additional{' '}
              <span className="text-foreground">{selectedComputeMeta?.price_description}</span>.
            </p>

            <p className="text-foreground-light text-sm">
              Read more about{' '}
              <Link
                href="https://supabase.com/docs/guides/platform/org-based-billing#usage-based-billing-for-compute"
                target="_blank"
                rel="noreferrer"
                className="underline hover:text-foreground transition"
              >
                usage-based billing
              </Link>{' '}
              for compute.
            </p>
          </div>
        </div>
      </SidePanel.Content>
    </SidePanel>
  )
}

export default DeployNewReplicaPanel
