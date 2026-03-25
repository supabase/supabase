import { SupportCategories } from '@supabase/shared-types/out/constants'
import { useParams } from 'common'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { DocsButton } from 'components/ui/DocsButton'
import { InlineLink } from 'components/ui/InlineLink'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useCheckEntitlements } from 'hooks/misc/useCheckEntitlements'
import { useIsFeatureEnabled } from 'hooks/misc/useIsFeatureEnabled'
import { useSelectedOrganizationQuery } from 'hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { getCloudProviderArchitecture } from 'lib/cloudprovider-utils'
import { DOCS_URL, InstanceSpecs } from 'lib/constants'
import { formatCurrency } from 'lib/helpers'
import { ChevronRight, CpuIcon, Lock, Microchip } from 'lucide-react'
import { useEffect, useMemo, useState } from 'react'
import { UseFormReturn } from 'react-hook-form'
import {
  cn,
  FormField_Shadcn_,
  RadioGroupCard,
  RadioGroupCardItem,
  Skeleton,
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from 'ui'
import { ComputeBadge } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'

import { DiskStorageSchemaType } from '../DiskManagement.schema'
import { ComputeInstanceAddonVariantId, InfraInstanceSize } from '../DiskManagement.types'
import {
  calculateComputeSizePrice,
  ComputeAddonVariant,
  getAvailableComputeOptions,
} from '../DiskManagement.utils'
import { BillingChangeBadge } from '../ui/BillingChangeBadge'
import FormMessage from '../ui/FormMessage'
import { NoticeBar } from '../ui/NoticeBar'

const INITIALLY_VISIBLE_COUNT = 6

// Variant IDs for sizes beyond the initial visible set (2XL and above)
const LARGE_COMPUTE_VARIANT_IDS = [
  'ci_2xlarge',
  'ci_4xlarge',
  'ci_8xlarge',
  'ci_12xlarge',
  'ci_16xlarge',
  'ci_24xlarge',
  'ci_24xlarge_optimized_memory',
  'ci_24xlarge_optimized_cpu',
  'ci_24xlarge_high_memory',
  'ci_48xlarge',
  'ci_48xlarge_optimized_memory',
  'ci_48xlarge_optimized_cpu',
  'ci_48xlarge_high_memory',
]

/**
 * to do: this could be a type from api-types
 */
type ComputeSizeFieldProps = {
  form: UseFormReturn<DiskStorageSchemaType>
  disabled?: boolean
}

export function ComputeSizeField({ form, disabled }: ComputeSizeFieldProps) {
  const { ref } = useParams()
  const { data: org } = useSelectedOrganizationQuery()
  const { data: project, isPending: isProjectLoading } = useSelectedProjectQuery()

  const { hasAccess: entitledUpdateCompute, isLoading: isEntitlementLoading } =
    useCheckEntitlements('instances.compute_update_available_sizes')

  const showComputePrice = useIsFeatureEnabled('project_addons:show_compute_price')

  const { computeSize, storageType } = form.watch()

  const {
    data: addons,
    isPending: isAddonsLoading,
    error: addonsError,
  } = useProjectAddonsQuery({ projectRef: ref })

  const isLoading = isProjectLoading || isAddonsLoading || isEntitlementLoading

  const { control, formState, setValue, trigger } = form

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

  // Expand by default if the project's current compute size is in the hidden set
  const [showAllSizes, setShowAllSizes] = useState(() =>
    LARGE_COMPUTE_VARIANT_IDS.includes(computeSize)
  )

  // Also expand if computeSize changes to a large size after mount (e.g. after a form reset)
  useEffect(() => {
    if (LARGE_COMPUTE_VARIANT_IDS.includes(computeSize) && !showAllSizes) {
      setShowAllSizes(true)
    }
  }, [computeSize]) // eslint-disable-line react-hooks/exhaustive-deps

  const subscriptionPitr = addons?.selected_addons.find((addon) => addon.type === 'pitr')

  const computeSizePrice = calculateComputeSizePrice({
    availableOptions: availableOptions,
    oldComputeSize: form.formState.defaultValues?.computeSize || 'ci_micro',
    newComputeSize: form.getValues('computeSize'),
    plan: org?.plan.id ?? 'free',
  })

  const projectComputeSize = project?.infra_compute_size ?? 'nano'
  const showUpgradeBadge = entitledUpdateCompute && projectComputeSize === 'nano'

  const baselineComputeVariantId = form.formState.defaultValues?.computeSize ?? 'ci_micro'
  const baselineHourlyPrice =
    availableOptions.find((o) => o.identifier === baselineComputeVariantId)?.price ?? 0

  const visibleOptions = showAllSizes
    ? availableOptions
    : availableOptions.slice(0, INITIALLY_VISIBLE_COUNT)
  const hasHiddenOptions = availableOptions.length > INITIALLY_VISIBLE_COUNT

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
            label="Compute size"
            id={field.name}
            className="gap-5"
            labelOptional={
              <>
                <BillingChangeBadge
                  className="mb-2"
                  show={
                    formState.isDirty &&
                    formState.dirtyFields.computeSize &&
                    !formState.errors.computeSize
                  }
                  beforePrice={Number(computeSizePrice.oldPrice)}
                  afterPrice={Number(computeSizePrice.newPrice)}
                  free={showUpgradeBadge && computeSize === 'ci_micro' ? true : false}
                />
                <p className="text-foreground-lighter">
                  Hardware resources allocated to your Postgres database
                </p>

                <div className="mt-3">
                  <DocsButton
                    abbrev={false}
                    href={`${DOCS_URL}/guides/platform/compute-and-disk`}
                  />
                </div>

                <NoticeBar
                  showIcon={false}
                  type="default"
                  className="mt-3 border-violet-900 bg-violet-200 [&_h5]:text-violet-1100"
                  visible={showUpgradeBadge && form.watch('computeSize') === 'ci_nano'}
                  title={'Upgrade to Micro Compute'}
                  description="This Project is already paying for Micro Compute. You can upgrade to Micro Compute at any time when convenient."
                />
              </>
            }
          >
            <div
              className={
                !addonsError
                  ? 'grid gap-4 grid-cols-[repeat(auto-fit,minmax(min(100%,13em),1fr))]'
                  : ''
              }
            >
              {isLoading ? (
                Array(6)
                  .fill(0)
                  .map((_, i) => <Skeleton key={i} className="w-full h-[130px] rounded-md" />)
              ) : addonsError ? (
                <FormMessage message={'Failed to load Compute size options'} type="error">
                  <p>{addonsError?.message}</p>
                </FormMessage>
              ) : (
                <>
                  {visibleOptions.map((compute) => {
                    const cpuArchitecture = getCloudProviderArchitecture(project?.cloud_provider)

                    const lockedMicroDueToPITR =
                      compute.identifier === 'ci_micro' && !!subscriptionPitr
                    const lockedNanoDueToPlan =
                      org?.plan.id !== 'free' &&
                      project?.infra_compute_size !== 'nano' &&
                      compute.identifier === 'ci_nano'

                    const lockedOption = lockedNanoDueToPlan || lockedMicroDueToPITR

                    const price =
                      org?.plan.id !== 'free' &&
                      project?.infra_compute_size === 'nano' &&
                      compute.identifier === 'ci_nano'
                        ? availableOptions.find(
                            (option: ComputeAddonVariant) => option.identifier === 'ci_micro'
                          )?.price
                        : compute.price

                    const monthlyDelta =
                      price !== undefined
                        ? Math.round((price - baselineHourlyPrice) * 720 * 100) / 100
                        : null
                    const isBaseline = compute.identifier === baselineComputeVariantId

                    const cpuLabel = (() => {
                      const cpuCores = compute.meta?.cpu_cores
                      if (typeof cpuCores === 'number') {
                        return `${cpuCores}-core ${cpuArchitecture} CPU`
                      }
                      if (cpuCores) {
                        return `${cpuCores} CPU`
                      }
                      return 'CPU'
                    })()

                    return (
                      <RadioGroupCardItem
                        showIndicator={false}
                        id={compute.identifier}
                        key={compute.identifier}
                        value={compute.identifier}
                        className={cn(
                          'relative text-sm text-left flex flex-col gap-0 px-0 py-3 [&_label]:w-full group] w-full h-[130px]',
                          lockedOption && 'opacity-50'
                        )}
                        disabled={disabled || lockedOption}
                        label={
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div>
                                {showUpgradeBadge && compute.identifier === 'ci_micro' && (
                                  <div className="absolute -top-4 -right-3 text-violet-1100 flex items-center gap-1 bg-surface-75 py-0.5 px-2 rounded-full border border-violet-900">
                                    <span>No additional charge</span>
                                  </div>
                                )}
                                <div className="w-full flex flex-col gap-3 justify-between">
                                  <div className="relative px-3 opacity-50 group-data-[state=checked]:opacity-100 flex justify-between">
                                    <ComputeBadge
                                      className="inline-flex font-semibold"
                                      infraComputeSize={compute.name as InfraInstanceSize}
                                    />
                                    <div className="flex items-center space-x-1">
                                      {lockedOption ? (
                                        <div className="bg border rounded-lg h-7 w-7 flex items-center justify-center">
                                          <Lock size={14} />
                                        </div>
                                      ) : (
                                        showComputePrice && (
                                          <div className="flex flex-col items-end gap-0.5">
                                            <div className="flex items-center space-x-1">
                                              <span
                                                className="text-foreground text-sm font-semibold"
                                                translate="no"
                                              >
                                                ${price}
                                              </span>
                                              <span className="text-foreground-light translate-y-[1px]">
                                                {' '}
                                                /{' '}
                                                {compute.price_interval === 'monthly'
                                                  ? 'month'
                                                  : 'hour'}
                                              </span>
                                            </div>
                                            {monthlyDelta !== null && !isBaseline && (
                                              <span
                                                className={cn(
                                                  'text-xs font-mono tabular-nums',
                                                  monthlyDelta > 0 ? 'text-warning' : 'text-brand'
                                                )}
                                                translate="no"
                                              >
                                                {monthlyDelta > 0 ? '+' : ''}
                                                {formatCurrency(monthlyDelta)}/mo
                                              </span>
                                            )}
                                          </div>
                                        )
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
                                        <span>{cpuLabel}</span>
                                      </div>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </TooltipTrigger>
                            {lockedMicroDueToPITR && (
                              <TooltipContent side="bottom" className="w-64 text-center">
                                Project has PITR enabled which requires a minimum of Small compute.
                                Please{' '}
                                <InlineLink href="/project/_/settings/addons?panel=pitr">
                                  disable PITR
                                </InlineLink>{' '}
                                first before selecting Micro
                              </TooltipContent>
                            )}
                          </Tooltip>
                        }
                      />
                    )
                  })}

                  {showAllSizes && (
                    <RadioGroupCardItem
                      id="larger-compute"
                      key="larger-compute"
                      showIndicator={false}
                      value="larger-compute"
                      onClick={(e) => e.preventDefault()}
                      className={cn(
                        'relative text-sm text-left flex flex-col gap-0 px-0 py-3 [&_label]:w-full group] w-full h-[130px]'
                      )}
                      label={
                        <SupportLink
                          queryParams={{
                            projectRef: ref,
                            category: SupportCategories.SALES_ENQUIRY,
                            subject: 'Enquiry about larger instance sizes',
                          }}
                        >
                          <div className="w-full flex flex-col gap-3 justify-between">
                            <div className="relative px-3 flex justify-between">
                              <ComputeBadge infraComputeSize=">16XL" />

                              <div className="flex items-center space-x-1 opacity-50 ">
                                <span className="text-foreground-light text-sm">Contact Us</span>
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
                                  <span>Custom memory</span>
                                </div>
                                <div className="text-foreground-light flex gap-2 items-center">
                                  <CpuIcon
                                    strokeWidth={1}
                                    size={14}
                                    className="text-foreground-lighter"
                                  />
                                  <span>Custom CPU</span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </SupportLink>
                      }
                    />
                  )}
                </>
              )}
            </div>

            {!isLoading && !addonsError && hasHiddenOptions && (
              <button
                type="button"
                onClick={() => setShowAllSizes((prev) => !prev)}
                className="mt-2 flex items-center gap-1 text-sm text-foreground-lighter hover:text-foreground-light transition-colors"
              >
                <ChevronRight
                  size={14}
                  strokeWidth={1.5}
                  className={cn('transition-transform', showAllSizes && 'rotate-90')}
                />
                {showAllSizes ? 'Show fewer sizes' : 'Show all sizes'}
              </button>
            )}
          </FormItemLayout>
        </RadioGroupCard>
      )}
    />
  )
}
