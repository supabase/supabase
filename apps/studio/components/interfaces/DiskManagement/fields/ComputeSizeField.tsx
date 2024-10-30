import { components } from 'api-types'
import { useParams } from 'common'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { getCloudProviderArchitecture } from 'lib/cloudprovider-utils'
import { CpuIcon, Microchip } from 'lucide-react'
import { useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'
import { FormField_Shadcn_, RadioGroupCard, RadioGroupCardItem, Skeleton } from 'ui'
import { ComputeBadge } from 'ui-patterns'
import { FormItemLayout } from 'ui-patterns/form/FormItemLayout/FormItemLayout'
import { BillingChangeBadge } from '../ui/BillingChangeBadge'
import { calculateComputeSizePrice, getAvailableComputeOptions } from '../DiskManagement.utils'
import { DiskStorageSchemaType } from '../DiskManagement.schema'
import FormMessage from '../ui/FormMessage'
import { ComputeInstanceAddonVariantId } from '../DiskMangement.types'

/**
 * to do: this could be a type from api-types
 */
type ComputeOption = {
  identifier: components['schemas']['AddonVariantId']
  name: string
  price: number
  price_interval: 'monthly' | 'hourly'
  meta?: {
    memory_gb?: number
    cpu_cores?: number
  }
}

type ComputeSizeFieldProps = {
  form: UseFormReturn<DiskStorageSchemaType>
  disabled?: boolean
}

export function ComputeSizeField({ form, disabled }: ComputeSizeFieldProps) {
  const { ref } = useParams()
  const { control, formState, setValue, trigger } = form

  const {
    /**
     * projectContext is used for:
     *   - cloud provider
     *   - infra_compute_size
     */
    project,
    /**
     * isLoading is used to avoud a useCheckPermissions() race condition
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
  })

  return (
    <FormField_Shadcn_
      name="computeSize"
      control={control}
      render={({ field }) => (
        <FormItemLayout
          layout="horizontal"
          label={'Compute size'}
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
              />
              <p>Hardware resources allocated to your postgres database</p>
            </>
          }
        >
          <RadioGroupCard
            className={!addonsError ? 'grid grid-cols-2 xl:grid-cols-3 flex-wrap gap-3' : ''}
            onValueChange={(value: ComputeInstanceAddonVariantId) => {
              setValue('computeSize', value, {
                shouldDirty: true,
                shouldValidate: true,
              })
              console.log('SET VALUE ON COMPUTE')
              trigger('provisionedIOPS')
              trigger('throughput')
            }}
            defaultValue={field.value}
            value={field.value}
            disabled={disabled}
          >
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
                return (
                  <RadioGroupCardItem
                    key={compute.identifier}
                    showIndicator={false}
                    value={compute.identifier}
                    className="text-sm text-left flex flex-col gap-0 px-0 py-3 overflow-hidden [&_label]:w-full group] w-full h-[110px]"
                    disabled={disabled}
                    // @ts-expect-error
                    label={
                      <div className="w-full flex flex-col gap-3 justify-between">
                        <div className="px-3 opacity-50 group-data-[state=checked]:opacity-100 flex justify-between">
                          <ComputeBadge
                            className="inline-flex font-semibold"
                            infraComputeSize={
                              compute.name as components['schemas']['DbInstanceSize']
                            }
                          />
                          <div className="flex items-center space-x-1">
                            <span className="text-foreground text-sm font-semibold">
                              ${compute.price}
                            </span>
                            <span className="text-foreground-light translate-y-[1px]">
                              {' '}
                              / {compute.price_interval === 'monthly' ? 'month' : 'hour'}
                            </span>
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
                              <span>{compute.meta?.memory_gb ?? 0} GB memory</span>
                            </div>
                            <div className="text-foreground-light flex gap-2 items-center">
                              <CpuIcon
                                strokeWidth={1}
                                size={14}
                                className="text-foreground-lighter"
                              />
                              <span>
                                {compute.meta?.cpu_cores ?? 0}-core {cpuArchitecture} CPU
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    }
                  />
                )
              })
            )}
          </RadioGroupCard>
        </FormItemLayout>
      )}
    />
  )
}
