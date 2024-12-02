import { CpuIcon, Lock, Microchip } from 'lucide-react'
import { useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'

import { components } from 'api-types'
import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { getCloudProviderArchitecture } from 'lib/cloudprovider-utils'
import { cn, FormField_Shadcn_, RadioGroupCard, RadioGroupCardItem, Skeleton } from 'ui'
import { ComputeBadge } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { DiskStorageSchemaType } from '../DiskManagement.schema'
import { ComputeInstanceAddonVariantId } from '../DiskManagement.types'
import {
  calculateComputeSizePrice,
  getAvailableComputeOptions,
  showMicroUpgrade,
} from '../DiskManagement.utils'
import { BillingChangeBadge } from '../ui/BillingChangeBadge'
import FormMessage from '../ui/FormMessage'
import { NoticeBar } from '../ui/NoticeBar'
import { InstanceSpecs } from 'lib/constants'

/**
 * to do: this could be a type from api-types
 */
type ComputeOption = {
  identifier: ComputeInstanceAddonVariantId
  name: string
  price: number
  price_interval: 'monthly' | 'hourly'
  meta?: InstanceSpecs
}

type ComputeSizeFieldProps = {
  form: UseFormReturn<DiskStorageSchemaType>
  disabled?: boolean
}

export function ComputeSizeField({ form, disabled }: ComputeSizeFieldProps) {
  const { ref } = useParams()
  const org = useSelectedOrganization()
  const { control, formState, setValue, trigger } = form

  const {
    /**
     * no error/isError states handled here, as a parent component handles them
     */
    data: subscription,
  } = useOrgSubscriptionQuery({ orgSlug: org?.slug })

  const {
    /**
     * projectContext is used for:
     *   - cloud provider
     *   - infra_compute_size
     */
    project,
    /**
     * isLoading is used to avoid a useCheckPermissions() race condition
     */
    isLoading: isProjectLoading,
    /**
     * to do: there is no error/isError variables available for useProjectContext
     */
  } = useProjectContext()
  const {
    data: addons,
    isLoading: isAddonsLoading,
    error: addonsError,
  } = useProjectAddonsQuery({ projectRef: ref })

  const isLoading = isProjectLoading || isAddonsLoading

  const availableAddons = useMemo(() => {
    return addons?.available_addons ?? []
  }, [addons])
  const availableOptions = useMemo(() => {
    /**
     * Returns the available compute options for the project
     * Also handles backwards compatibility for older API versions
     * Also handles a case in which Nano is not available from the API
     */
    return getAvailableComputeOptions(availableAddons, project?.cloud_provider)
  }, [availableAddons, project?.cloud_provider])

  const computeSizePrice = calculateComputeSizePrice({
    availableOptions: availableOptions,
    oldComputeSize: form.formState.defaultValues?.computeSize || 'ci_micro',
    newComputeSize: form.getValues('computeSize'),
    plan: subscription?.plan.id ?? 'free',
  })

  const showUpgradeBadge = showMicroUpgrade(
    subscription?.plan.id ?? 'free',
    project?.infra_compute_size ?? 'nano'
  )

  return (
    <FormField_Shadcn_
      name="computeSize"
      control={control}
      render={({ field }) => (
        <RadioGroupCard
          {...field}
          onValueChange={(value: ComputeInstanceAddonVariantId) => {
            setValue('computeSize', value, {
              shouldDirty: true,
              shouldValidate: true,
            })
            trigger('provisionedIOPS')
            trigger('throughput')
          }}
          defaultValue={field.value}
          disabled={disabled}
        >
          <FormItemLayout
            layout="horizontal"
            label={'Compute size'}
            id={field.name}
            labelOptional={
              <>
                <BillingChangeBadge
                  className={'mb-2'}
                  show={
                    formState.isDirty &&
                    formState.dirtyFields.computeSize &&
                    !formState.errors.computeSize
                  }
                  beforePrice={Number(computeSizePrice.oldPrice)}
                  afterPrice={Number(computeSizePrice.newPrice)}
                  free={showUpgradeBadge && form.watch('computeSize') === 'ci_micro' ? true : false}
                />
                <p className="text-foreground-lighter">
                  Hardware resources allocated to your Postgres database
                </p>
                <NoticeBar
                  showIcon={false}
                  type="default"
                  className="mt-3 border-violet-900 bg-violet-200 [&_h5]:text-violet-1100"
                  visible={showUpgradeBadge && form.watch('computeSize') === 'ci_nano'}
                  title={'Upgrade to Micro Compute at no additional charge'}
                  description="This Project is already paying for Micro Compute. You can upgrade to Micro Compute at any time when convenient."
                />
              </>
            }
          >
            <div className={!addonsError ? 'grid grid-cols-2 xl:grid-cols-3 flex-wrap gap-3' : ''}>
              {isLoading ? (
                Array(10)
                  .fill(0)
                  .map((_, i) => <Skeleton key={i} className="w-full h-[110px] rounded-md" />)
              ) : addonsError ? (
                <FormMessage message={'Failed to load Compute size options'} type="error">
                  <p>{addonsError?.message}</p>
                </FormMessage>
              ) : (
                availableOptions.map((compute: ComputeOption) => {
                  const cpuArchitecture = getCloudProviderArchitecture(project?.cloud_provider)

                  const lockedOption =
                    subscription?.plan.id !== 'free' &&
                    project?.infra_compute_size !== 'nano' &&
                    compute.identifier === 'ci_nano'

                  const price =
                    subscription?.plan.id !== 'free' &&
                    project?.infra_compute_size === 'nano' &&
                    compute.identifier === 'ci_nano'
                      ? availableOptions.find(
                          (option: ComputeOption) => option.identifier === 'ci_micro'
                        )?.price
                      : compute.price

                  return (
                    <RadioGroupCardItem
                      id={compute.identifier}
                      key={compute.identifier}
                      showIndicator={false}
                      value={compute.identifier}
                      className={cn(
                        'relative text-sm text-left flex flex-col gap-0 px-0 py-3 [&_label]:w-full group] w-full h-[110px]',
                        lockedOption && 'opacity-50'
                      )}
                      disabled={disabled || lockedOption}
                      // @ts-expect-error
                      label={
                        <>
                          {showUpgradeBadge && compute.identifier === 'ci_micro' && (
                            <div className="absolute -top-4 -right-3 text-violet-1100 flex items-center gap-1 bg-surface-75 py-0.5 px-2 rounded-full border border-violet-900">
                              <span>No additional charge</span>
                            </div>
                          )}
                          <div className="w-full flex flex-col gap-3 justify-between">
                            <div className="relative px-3 opacity-50 group-data-[state=checked]:opacity-100 flex justify-between">
                              <ComputeBadge
                                className="inline-flex font-semibold"
                                infraComputeSize={
                                  compute.name as components['schemas']['DbInstanceSize']
                                }
                              />
                              <div className="flex items-center space-x-1">
                                {lockedOption ? (
                                  <div className="bg border rounded-lg h-7 w-7 flex items-center justify-center">
                                    <Lock size={14} />
                                  </div>
                                ) : (
                                  <>
                                    <span className="text-foreground text-sm font-semibold">
                                      ${price}
                                    </span>
                                    <span className="text-foreground-light translate-y-[1px]">
                                      {' '}
                                      / {compute.price_interval === 'monthly' ? 'month' : 'hour'}
                                    </span>
                                  </>
                                )}
                              </div>
                            </div>

                            <div className="w-full">
                              <div className="px-3 text-sm flex flex-col gap-1">
                                <div className="text-foreground-light flex gap-2 items-center">
                                  <Microchip
                                    strokeWidth={1}
                                    size={14}
                                    className="text-foreground-lighter"
                                  />
                                  <span>
                                    {compute.identifier === 'ci_nano' && 'Up to '}
                                    {compute.meta?.memory_gb ?? 0} GB memory
                                  </span>
                                </div>
                                <div className="text-foreground-light flex gap-2 items-center">
                                  <CpuIcon
                                    strokeWidth={1}
                                    size={14}
                                    className="text-foreground-lighter"
                                  />
                                  <span>
                                    {compute.meta?.cpu_cores ?? 0}
                                    {compute.meta?.cpu_cores !== 'Shared' &&
                                      `-core ${cpuArchitecture}`}{' '}
                                    CPU
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </>
                      }
                    />
                  )
                })
              )}
            </div>
          </FormItemLayout>
        </RadioGroupCard>
      )}
    />
  )
}
