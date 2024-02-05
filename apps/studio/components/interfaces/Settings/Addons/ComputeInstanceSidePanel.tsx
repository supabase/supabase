import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useQueryClient } from '@tanstack/react-query'
import clsx from 'clsx'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useEffect, useMemo, useState } from 'react'

import { useParams } from 'common'
import { useTheme } from 'next-themes'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { setProjectStatus } from 'data/projects/projects-query'
import { useProjectAddonRemoveMutation } from 'data/subscriptions/project-addon-remove-mutation'
import { useProjectAddonUpdateMutation } from 'data/subscriptions/project-addon-update-mutation'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useCheckPermissions, useSelectedOrganization, useStore } from 'hooks'
import { getCloudProviderArchitecture } from 'lib/cloudprovider-utils'
import { INSTANCE_MICRO_SPECS, PROJECT_STATUS } from 'lib/constants'
import Telemetry from 'lib/telemetry'
import { useSubscriptionPageStateSnapshot } from 'state/subscription-page'
import {
  Alert,
  AlertDescription_Shadcn_,
  AlertTitle_Shadcn_,
  Alert_Shadcn_,
  Badge,
  Button,
  IconAlertTriangle,
  IconExternalLink,
  IconInfo,
  Modal,
  Radio,
  SidePanel,
} from 'ui'

import * as Tooltip from '@radix-ui/react-tooltip'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { AddonVariantId, ProjectAddonVariantMeta } from 'data/subscriptions/types'

const ComputeInstanceSidePanel = () => {
  const queryClient = useQueryClient()
  const { ui } = useStore()
  const router = useRouter()
  const { ref: projectRef } = useParams()
  const { project: selectedProject } = useProjectContext()
  const organization = useSelectedOrganization()

  const [showConfirmationModal, setShowConfirmationModal] = useState(false)

  const canUpdateCompute = useCheckPermissions(
    PermissionAction.BILLING_WRITE,
    'stripe.subscriptions'
  )

  const snap = useSubscriptionPageStateSnapshot()
  const visible = snap.panelKey === 'computeInstance'
  const onClose = () => {
    const { panel, ...queryWithoutPanel } = router.query
    router.push({ pathname: router.pathname, query: queryWithoutPanel }, undefined, {
      shallow: true,
    })
    snap.setPanelKey(undefined)
  }

  const { data: addons, isLoading } = useProjectAddonsQuery({ projectRef })
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: organization?.slug })
  const { mutate: updateAddon, isLoading: isUpdating } = useProjectAddonUpdateMutation({
    onSuccess: () => {
      ui.setNotification({
        duration: 8000,
        category: 'success',
        message: `Successfully updated compute instance to ${selectedCompute?.name}. Your project is currently being restarted to update its instance`,
      })
      setProjectStatus(queryClient, projectRef!, PROJECT_STATUS.RESTORING)
      onClose()
      router.push(`/project/${projectRef}`)
    },
    onError: (error) => {
      ui.setNotification({
        error,
        category: 'error',
        message: `Unable to update compute instance: ${error.message}`,
      })
    },
  })
  const { mutate: removeAddon, isLoading: isRemoving } = useProjectAddonRemoveMutation({
    onSuccess: () => {
      ui.setNotification({
        duration: 8000,
        category: 'success',
        message: `Successfully updated compute instance. Your project is currently being restarted to update its instance`,
      })
      setProjectStatus(queryClient, projectRef!, PROJECT_STATUS.RESTORING)
      onClose()
      router.push(`/project/${projectRef}`)
    },
    onError: (error) => {
      ui.setNotification({
        error,
        category: 'error',
        message: `Unable to update compute instance: ${error.message}`,
      })
    },
  })

  const [selectedOption, setSelectedOption] = useState<string>('')

  const isSubmitting = isUpdating || isRemoving

  const projectId = selectedProject?.id
  const cpuArchitecture = getCloudProviderArchitecture(selectedProject?.cloud_provider)
  const selectedAddons = addons?.selected_addons ?? []
  const availableAddons = useMemo(() => {
    return addons?.available_addons ?? []
  }, [addons])

  const isFreePlan = subscription?.plan?.id === 'free'
  const subscriptionCompute = selectedAddons.find((addon) => addon.type === 'compute_instance')
  const pitrAddon = selectedAddons.find((addon) => addon.type === 'pitr')

  const hasMicroOptionFromApi = useMemo(() => {
    return (
      availableAddons.find((addon) => addon.type === 'compute_instance')?.variants ?? []
    ).some((variant) => variant.identifier === 'ci_micro')
  }, [availableAddons])

  const availableOptions = useMemo(() => {
    const computeOptions =
      availableAddons.find((addon) => addon.type === 'compute_instance')?.variants ?? []

    // Backwards comp until API is deployed
    if (!hasMicroOptionFromApi) {
      // Unshift to push to start of array
      computeOptions.unshift({
        identifier: 'ci_micro',
        name: 'Micro',
        price_description: '$0.01344/hour (~$10/month)',
        price: 0.01344,
        price_interval: 'hourly',
        price_type: 'usage',
        // @ts-ignore API types it as Record<string, never>
        meta: {
          cpu_cores: INSTANCE_MICRO_SPECS.cpu_cores,
          cpu_dedicated: INSTANCE_MICRO_SPECS.cpu_dedicated,
          memory_gb: INSTANCE_MICRO_SPECS.memory_gb,
          baseline_disk_io_mbs: INSTANCE_MICRO_SPECS.baseline_disk_io_mbs,
          max_disk_io_mbs: INSTANCE_MICRO_SPECS.max_disk_io_mbs,
          connections_direct: INSTANCE_MICRO_SPECS.connections_direct,
          connections_pooler: INSTANCE_MICRO_SPECS.connections_pooler,
        } as ProjectAddonVariantMeta,
      })
    }

    return computeOptions
  }, [availableAddons, hasMicroOptionFromApi])

  const defaultInstanceSize = useMemo(() => {
    if (!selectedProject) return ''

    return selectedProject.infra_compute_size === 'nano' ? 'ci_nano' : 'ci_micro'
  }, [selectedProject])

  const selectedCompute = availableOptions.find((option) => option.identifier === selectedOption)
  const hasChanges =
    selectedOption !== (subscriptionCompute?.variant.identifier ?? defaultInstanceSize)

  const blockDowngradeDueToPitr =
    pitrAddon !== undefined && ['ci_micro', 'ci_nano'].includes(selectedOption) && hasChanges

  useEffect(() => {
    if (visible) {
      if (subscriptionCompute !== undefined) {
        setSelectedOption(subscriptionCompute.variant.identifier)
      } else {
        setSelectedOption(defaultInstanceSize)
      }
      Telemetry.sendActivity(
        {
          activity: 'Side Panel Viewed',
          source: 'Dashboard',
          data: {
            title: 'Change project compute size',
            section: 'Add ons',
          },
          projectRef,
        },
        router
      )
    }
  }, [visible, isLoading])

  const onConfirmUpdateComputeInstance = async () => {
    if (!projectRef) return console.error('Project ref is required')
    if (!projectId) return console.error('Project ID is required')

    // Temporary backwards compatibility fix
    if (
      !hasMicroOptionFromApi &&
      selectedOption === 'ci_micro' &&
      subscriptionCompute !== undefined
    ) {
      removeAddon({ projectRef, variant: subscriptionCompute.variant.identifier })
    } else {
      updateAddon({
        projectRef,
        type: 'compute_instance',
        variant: selectedOption as AddonVariantId,
      })
    }
  }

  return (
    <>
      <SidePanel
        size="xxlarge"
        visible={visible}
        onCancel={onClose}
        onConfirm={() => setShowConfirmationModal(true)}
        loading={isLoading}
        disabled={
          isFreePlan || isLoading || !hasChanges || blockDowngradeDueToPitr || !canUpdateCompute
        }
        tooltip={
          isFreePlan
            ? 'Unable to update compute instance on a free plan'
            : !canUpdateCompute
              ? 'You do not have permission to update compute instance'
              : undefined
        }
        header={
          <div className="flex items-center justify-between">
            <h4>Change project compute size</h4>
            <Button asChild type="default" icon={<IconExternalLink strokeWidth={1.5} />}>
              <Link
                href="https://supabase.com/docs/guides/platform/compute-add-ons"
                target="_blank"
                rel="noreferrer"
              >
                About compute sizes
              </Link>
            </Button>
          </div>
        }
      >
        <SidePanel.Content>
          <div className="py-6 space-y-4">
            {selectedProject?.infra_compute_size === 'nano' && subscription?.plan.id !== 'free' && (
              <Alert_Shadcn_ variant="default">
                <IconInfo strokeWidth={2} />
                <AlertTitle_Shadcn_>Free compute upgrade to Micro</AlertTitle_Shadcn_>
                <AlertDescription_Shadcn_>
                  Paid Plans include a free upgrade to Micro compute. Your project is ready to
                  upgrade for no additional charges.
                </AlertDescription_Shadcn_>
              </Alert_Shadcn_>
            )}

            <p className="text-sm">
              For the database, compute size refers to the amount of CPU and memory allocated to the
              database instance.
            </p>

            <div className="pb-4">
              {isFreePlan && (
                <Alert
                  withIcon
                  className="mb-4"
                  variant="info"
                  title="Changing your compute size is only available on the Pro plan"
                  actions={
                    <Button asChild type="default">
                      <Link href={`/org/${organization?.slug}/billing?panel=subscriptionPlan`}>
                        View available plans
                      </Link>
                    </Button>
                  }
                >
                  Upgrade your plan to change the compute size of your project
                </Alert>
              )}
              <Radio.Group
                type="large-cards"
                size="tiny"
                id="compute-instance"
                label={<p className="text-sm">Choose the compute size you want to use</p>}
                onChange={(event: any) => setSelectedOption(event.target.value)}
              >
                {availableOptions.map((option) => (
                  <Radio
                    className="col-span-3 !p-0"
                    disabled={isFreePlan}
                    name="compute-instance"
                    key={option.identifier}
                    checked={selectedOption === option.identifier}
                    label={option.name}
                    value={option.identifier}
                  >
                    <div className="w-full group">
                      <div className="border-b border-default px-4 py-2">
                        <p className="text-sm flex justify-between">
                          {option.name}{' '}
                          {(subscriptionCompute?.variant.identifier === option.identifier ||
                            (!subscriptionCompute &&
                              option.identifier ===
                                `ci_${selectedProject?.infra_compute_size}`)) && (
                            <Badge>Current</Badge>
                          )}
                          {selectedProject?.infra_compute_size === 'nano' &&
                            option.identifier === 'ci_micro' && <Badge>Free Upgrade</Badge>}
                        </p>
                      </div>
                      <div className="px-4 py-2">
                        <p className="text-foreground-light">
                          {option.meta?.memory_gb ?? 0} GB memory
                        </p>
                        <p className="text-foreground-light">
                          {option.meta?.cpu_cores ?? 0}-core {cpuArchitecture} CPU (
                          {option.meta?.cpu_dedicated ? 'Dedicated' : 'Shared'})
                        </p>
                        <div className="flex justify-between items-center mt-2">
                          <div className="flex items-center space-x-1">
                            <span className="text-foreground text-sm">
                              {/* Price needs to be exact here */}${option.price}
                            </span>
                            <span className="text-foreground-light translate-y-[1px]">
                              {' '}
                              / {option.price_interval === 'monthly' ? 'month' : 'hour'}
                            </span>
                          </div>
                          {option.price_interval === 'hourly' && (
                            <Tooltip.Root delayDuration={0}>
                              <Tooltip.Trigger>
                                <div className="flex items-center">
                                  <IconInfo
                                    size={14}
                                    strokeWidth={2}
                                    className="hover:text-foreground-light"
                                  />
                                </div>
                              </Tooltip.Trigger>
                              <Tooltip.Portal>
                                <Tooltip.Content side="bottom">
                                  <Tooltip.Arrow className="radix-tooltip-arrow" />
                                  <div
                                    className={[
                                      'rounded bg-alternative py-1 px-2 leading-none shadow',
                                      'border border-background',
                                    ].join(' ')}
                                  >
                                    <div className="flex items-center space-x-1">
                                      <p className="text-foreground text-sm">
                                        ${Number(option.price * 672).toFixed(0)} - $
                                        {Number(option.price * 744).toFixed(0)} per month
                                      </p>
                                    </div>
                                  </div>
                                </Tooltip.Content>
                              </Tooltip.Portal>
                            </Tooltip.Root>
                          )}
                        </div>
                      </div>
                    </div>
                  </Radio>
                ))}
              </Radio.Group>
            </div>

            {hasChanges && (
              <p className="text-sm text-foreground-light">
                There are no immediate charges when changing compute. Compute Hours are a
                usage-based item and you're billed at the end of your billing cycle based on your
                compute usage. Read more about{' '}
                <Link
                  href="https://supabase.com/docs/guides/platform/org-based-billing#usage-based-billing-for-compute"
                  target="_blank"
                  rel="noreferrer"
                  className="underline"
                >
                  Compute Billing
                </Link>
                .
              </p>
            )}

            {hasChanges && !blockDowngradeDueToPitr && (
              <Alert
                withIcon
                variant="info"
                title="Your project will need to be restarted when changing it's compute size"
              >
                Your project will be unavailable for up to 2 minutes while the changes take place.
              </Alert>
            )}

            {blockDowngradeDueToPitr && (
              <Alert
                withIcon
                variant="info"
                className="mb-4"
                title="Disable PITR before downgrading"
                actions={
                  <Button type="default" onClick={() => snap.setPanelKey('pitr')}>
                    Change PITR
                  </Button>
                }
              >
                <p>
                  You currently have PITR enabled. The minimum compute instance size for using PITR
                  is the Small Compute.
                </p>
                <p>
                  You need to disable PITR before downgrading Compute as it requires at least a
                  Small compute instance.
                </p>
              </Alert>
            )}

            {hasChanges &&
              subscription?.billing_via_partner &&
              subscription.scheduled_plan_change?.target_plan !== undefined && (
                <Alert_Shadcn_ variant={'warning'} className="mb-2">
                  <IconAlertTriangle className="h-4 w-4" />
                  <AlertDescription_Shadcn_>
                    You have a scheduled subscription change that will be canceled if you change
                    your compute size.
                  </AlertDescription_Shadcn_>
                </Alert_Shadcn_>
              )}
          </div>
        </SidePanel.Content>
      </SidePanel>

      <Modal
        size="medium"
        alignFooter="right"
        visible={showConfirmationModal}
        loading={isSubmitting}
        onCancel={() => setShowConfirmationModal(false)}
        onConfirm={() => onConfirmUpdateComputeInstance()}
        header="Confirm to upgrade compute instance now"
      >
        <Modal.Content>
          <div className="py-6">
            <Alert
              withIcon
              variant="warning"
              title="Your project will need to be restarted when changing it's compute size"
            >
              Your project will be unavailable for up to 2 minutes while the changes take place.
            </Alert>
          </div>
        </Modal.Content>
      </Modal>
    </>
  )
}

export default ComputeInstanceSidePanel
