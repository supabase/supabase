import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ArrowRight } from 'lucide-react'
import { useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'
import {
  Alert_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  ButtonProps,
  cn,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  WarningIcon,
} from 'ui'

import { DiskStorageSchemaType } from './DiskManagement.schema'
import { DiskManagementMessage } from './DiskManagement.types'
import {
  calculateComputeSizePrice,
  calculateDiskSizePrice,
  calculateIOPSPrice,
  calculateThroughputPrice,
  getAvailableComputeOptions,
  mapAddOnVariantIdToComputeSize,
} from './DiskManagement.utils'
import { DISK_AUTOSCALE_CONFIG_DEFAULTS, DiskType } from './ui/DiskManagement.constants'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useProjectAddonsQuery } from '@/data/subscriptions/project-addons-query'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import {
  useIsAwsNimbusCloudProvider,
  useSelectedProjectQuery,
} from '@/hooks/misc/useSelectedProject'
import { formatCurrency } from '@/lib/helpers'

interface BreakdownRowProps {
  label: string
  description?: string
  children: React.ReactNode
}

const BreakdownRow = ({ label, description, children }: BreakdownRowProps) => (
  <div className="flex items-start justify-between py-3 px-0 border-b border-dashed last:border-b-0">
    <div className="flex flex-col gap-0.5">
      <span className="text-sm text-foreground-light">{label}</span>
      {description && <span className="text-xs text-warning-600 max-w-72">{description}</span>}
    </div>
    {children}
  </div>
)

const ValueChange = ({ from, to }: { from: string; to: string }) => (
  <span className="text-sm font-mono uppercase">
    <span className="text-foreground-lighter">{from}</span>
    <span className="text-foreground-lighter mx-2">&rarr;</span>
    <span className="text-foreground">{to}</span>
  </span>
)

const PriceDelta = ({ delta }: { delta: number }) => (
  <span className={cn('text-xs', delta >= 0 ? 'text-brand' : 'text-destructive')}>
    {delta >= 0 ? `+${formatCurrency(delta)}` : `-${formatCurrency(Math.abs(delta))}`}{' '}
    <span className="text-foreground-lighter">per month</span>
  </span>
)

interface DiskSizeMeterProps {
  loading: boolean
  form: UseFormReturn<DiskStorageSchemaType>
  numReplicas: number
  isDialogOpen: boolean
  disabled?: boolean
  setIsDialogOpen: (isOpen: boolean) => void
  onSubmit: (values: DiskStorageSchemaType) => Promise<void>

  buttonSize?: ButtonProps['size']
  message?: DiskManagementMessage | null
}

export const DiskManagementReviewAndSubmitDialog = ({
  isDialogOpen,
  setIsDialogOpen,
  disabled,
  form,
  numReplicas,
  loading,
  onSubmit,
  message,
  buttonSize = 'medium',
}: DiskSizeMeterProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: org } = useSelectedOrganizationQuery()
  const isAwsNimbus = useIsAwsNimbusCloudProvider()

  const isAwsK8sProject = project?.cloud_provider === 'AWS_K8S'

  const { formState, getValues } = form

  const { can: canUpdateDiskConfiguration } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'projects',
    {
      resource: {
        project_id: project?.id,
      },
    }
  )

  const { data: addons } = useProjectAddonsQuery({ projectRef: project?.ref })

  const planId = org?.plan.id ?? 'free'
  const isDirty = !!Object.keys(form.formState.dirtyFields).length

  const availableAddons = useMemo(() => {
    return addons?.available_addons ?? []
  }, [addons])
  const availableOptions = useMemo(() => {
    return getAvailableComputeOptions(availableAddons, project?.cloud_provider)
  }, [availableAddons, project?.cloud_provider])

  const computeSizePrice = calculateComputeSizePrice({
    availableOptions,
    oldComputeSize: form.formState.defaultValues?.computeSize || 'ci_micro',
    newComputeSize: form.getValues('computeSize'),
    plan: org?.plan.id ?? 'free',
  })
  const diskSizePrice = calculateDiskSizePrice({
    planId: planId,
    oldSize: formState.defaultValues?.totalSize || 0,
    oldStorageType: formState.defaultValues?.storageType as DiskType,
    newSize: getValues('totalSize'),
    newStorageType: getValues('storageType') as DiskType,
    numReplicas,
  })
  const iopsPrice = calculateIOPSPrice({
    oldStorageType: form.formState.defaultValues?.storageType as DiskType,
    oldProvisionedIOPS: form.formState.defaultValues?.provisionedIOPS || 0,
    newStorageType: form.getValues('storageType') as DiskType,
    newProvisionedIOPS: form.getValues('provisionedIOPS'),
    numReplicas,
  })
  const throughputPrice = calculateThroughputPrice({
    storageType: form.getValues('storageType') as DiskType,
    newThroughput: form.getValues('throughput') || 0,
    oldThroughput: form.formState.defaultValues?.throughput || 0,
    numReplicas,
  })

  const hasComputeChanges =
    form.formState.defaultValues?.computeSize !== form.getValues('computeSize')
  const hasTotalSizeChanges =
    !isAwsK8sProject &&
    !isAwsNimbus &&
    form.formState.defaultValues?.totalSize !== form.getValues('totalSize')
  const hasStorageTypeChanges =
    !isAwsK8sProject &&
    !isAwsNimbus &&
    form.formState.defaultValues?.storageType !== form.getValues('storageType')
  const hasThroughputChanges =
    !isAwsK8sProject &&
    !isAwsNimbus &&
    form.formState.defaultValues?.throughput !== form.getValues('throughput')
  const hasIOPSChanges =
    !isAwsK8sProject &&
    !isAwsNimbus &&
    form.formState.defaultValues?.provisionedIOPS !== form.getValues('provisionedIOPS')

  const hasGrowthPercentChanges =
    !isAwsK8sProject &&
    !isAwsNimbus &&
    form.formState.defaultValues?.growthPercent !== form.getValues('growthPercent')
  const hasMinIncrementChanges =
    !isAwsK8sProject &&
    !isAwsNimbus &&
    form.formState.defaultValues?.minIncrementGb !== form.getValues('minIncrementGb')
  const hasMaxSizeChanges =
    !isAwsK8sProject &&
    !isAwsNimbus &&
    form.formState.defaultValues?.maxSizeGb !== form.getValues('maxSizeGb')

  const hasDiskConfigChanges =
    hasIOPSChanges ||
    (hasThroughputChanges && form.getValues('storageType') === 'gp3') ||
    hasTotalSizeChanges

  const totalBeforePrice =
    Number(computeSizePrice.oldPrice) +
    Number(diskSizePrice.oldPrice) +
    Number(iopsPrice.oldPrice) +
    Number(throughputPrice.oldPrice)

  const totalAfterPrice =
    Number(computeSizePrice.newPrice) +
    Number(diskSizePrice.newPrice) +
    Number(iopsPrice.newPrice) +
    Number(throughputPrice.newPrice)

  const oldComputeLabel = mapAddOnVariantIdToComputeSize(
    form.formState.defaultValues?.computeSize ?? 'ci_nano'
  )
  const newComputeLabel = mapAddOnVariantIdToComputeSize(form.getValues('computeSize'))

  const hasAnyBreakdownRows =
    hasComputeChanges ||
    hasStorageTypeChanges ||
    hasIOPSChanges ||
    (form.getValues('storageType') === 'gp3' && hasThroughputChanges) ||
    hasTotalSizeChanges ||
    hasGrowthPercentChanges ||
    hasMinIncrementChanges ||
    hasMaxSizeChanges

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <ButtonTooltip
          size={buttonSize}
          htmlType="submit"
          type="primary"
          onClick={async (e) => {
            e.preventDefault()
            const isValid = await form.trigger()
            if (isValid) setIsDialogOpen(true)
          }}
          disabled={disabled || !isDirty}
          tooltip={{
            content: {
              side: 'bottom',
              text: !canUpdateDiskConfiguration
                ? 'You need additional permissions to update disk configuration'
                : disabled
                  ? 'Current form values are invalid'
                  : undefined,
            },
          }}
        >
          Review changes
        </ButtonTooltip>
      </DialogTrigger>
      <DialogContent className="min-w-[560px] p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 py-4">
          <DialogTitle>Review changes</DialogTitle>
          <DialogDescription>Changes will be applied shortly after confirmation.</DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />

        {hasComputeChanges && (
          <>
            <div className="relative flex border-b">
              <div className="flex-1 flex flex-col items-center gap-2 py-6 px-4 border-r">
                <span className="text-xs uppercase tracking-widest font-mono text-foreground-lighter">
                  Before
                </span>
                <span className="text-3xl text-foreground-light tabular-nums" translate="no">
                  {formatCurrency(totalBeforePrice)}
                </span>
                <span className="text-xs uppercase tracking-widest font-mono text-foreground-lighter">
                  per month
                </span>
              </div>

              <div className="animate-badge-pulse absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-dash-sidebar border border-brand-500 flex items-center justify-center z-10 overflow-hidden">
                <span className="absolute inset-0 bg-brand bg-opacity-10 rounded-full" />
                <span className="animate-badge-shimmer pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent via-brand/20 to-transparent blur-md" />
                <ArrowRight size={16} className="text-brand-600 relative z-10" strokeWidth={2.5} />
              </div>

              <div className="flex-1 flex flex-col items-center gap-2 py-6 px-4">
                <span className="text-xs uppercase tracking-widest font-mono text-foreground-lighter">
                  After
                </span>
                <span className="text-3xl text-foreground tabular-nums" translate="no">
                  {formatCurrency(totalAfterPrice)}
                </span>
                <span className="text-xs uppercase tracking-widest font-mono text-foreground-lighter">
                  per month
                </span>
              </div>
            </div>
          </>
        )}

        {hasAnyBreakdownRows && (
          <div className="py-0.5 px-5">
            {hasComputeChanges && (
              <BreakdownRow
                label="Compute size"
                description="Project will restart automatically on confirmation."
              >
                <div className="flex flex-col items-end gap-0.5">
                  <ValueChange from={oldComputeLabel} to={newComputeLabel} />
                  <PriceDelta
                    delta={Number(computeSizePrice.newPrice) - Number(computeSizePrice.oldPrice)}
                  />
                </div>
              </BreakdownRow>
            )}
            {hasStorageTypeChanges && (
              <BreakdownRow label="Storage type">
                <ValueChange
                  from={(form.formState.defaultValues?.storageType ?? '').toUpperCase()}
                  to={form.getValues('storageType').toUpperCase()}
                />
              </BreakdownRow>
            )}
            {(hasIOPSChanges || hasStorageTypeChanges) && (
              <BreakdownRow label="IOPS">
                <div className="flex flex-col items-end gap-0.5">
                  <ValueChange
                    from={(form.formState.defaultValues?.provisionedIOPS ?? 0).toLocaleString()}
                    to={(form.getValues('provisionedIOPS') ?? 0).toLocaleString()}
                  />
                  <PriceDelta delta={Number(iopsPrice.newPrice) - Number(iopsPrice.oldPrice)} />
                </div>
              </BreakdownRow>
            )}
            {form.getValues('storageType') === 'gp3' && hasThroughputChanges && (
              <BreakdownRow label="Throughput">
                <div className="flex flex-col items-end gap-0.5">
                  <ValueChange
                    from={`${(form.formState.defaultValues?.throughput ?? 0).toLocaleString()} MB/s`}
                    to={`${(form.getValues('throughput') ?? 0).toLocaleString()} MB/s`}
                  />
                  <PriceDelta
                    delta={Number(throughputPrice.newPrice) - Number(throughputPrice.oldPrice)}
                  />
                </div>
              </BreakdownRow>
            )}
            {(hasTotalSizeChanges || hasStorageTypeChanges) && (
              <BreakdownRow
                label="Disk size"
                description="For 4 hours after changes you will not be able to modify disk attributes."
              >
                <div className="flex flex-col items-end gap-0.5">
                  <ValueChange
                    from={`${(form.formState.defaultValues?.totalSize ?? 0).toLocaleString()} GB`}
                    to={`${(form.getValues('totalSize') ?? 0).toLocaleString()} GB`}
                  />
                  <PriceDelta
                    delta={Number(diskSizePrice.newPrice) - Number(diskSizePrice.oldPrice)}
                  />
                </div>
              </BreakdownRow>
            )}
            {hasGrowthPercentChanges && (
              <BreakdownRow label="Growth percent">
                <ValueChange
                  from={`${form.formState.defaultValues?.growthPercent ?? DISK_AUTOSCALE_CONFIG_DEFAULTS.growthPercent}%`}
                  to={`${form.getValues('growthPercent') ?? DISK_AUTOSCALE_CONFIG_DEFAULTS.growthPercent}%`}
                />
              </BreakdownRow>
            )}
            {hasMinIncrementChanges && (
              <BreakdownRow label="Min increment">
                <ValueChange
                  from={`${form.formState.defaultValues?.minIncrementGb ?? DISK_AUTOSCALE_CONFIG_DEFAULTS.minIncrementSize} GB`}
                  to={`${form.getValues('minIncrementGb') ?? DISK_AUTOSCALE_CONFIG_DEFAULTS.minIncrementSize} GB`}
                />
              </BreakdownRow>
            )}
            {hasMaxSizeChanges && (
              <BreakdownRow label="Max disk size">
                <ValueChange
                  from={(
                    form.formState.defaultValues?.maxSizeGb ??
                    DISK_AUTOSCALE_CONFIG_DEFAULTS.maxSizeGb
                  ).toLocaleString()}
                  to={(
                    form.getValues('maxSizeGb') ?? DISK_AUTOSCALE_CONFIG_DEFAULTS.maxSizeGb
                  ).toLocaleString()}
                />
              </BreakdownRow>
            )}
            {numReplicas > 0 && (
              <div className="py-2 text-xs text-foreground-muted">
                Price change includes primary database and {numReplicas} replica
                {numReplicas > 1 ? 's' : ''}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="px-5 py-4">
          <Button block size="large" type="default" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>
          <Button
            block
            type="primary"
            size="large"
            htmlType="submit"
            loading={loading}
            onClick={async () => {
              await onSubmit(form.getValues())
            }}
          >
            Confirm changes
          </Button>
        </DialogFooter>
        {message && (
          <>
            <DialogSectionSeparator />
            <DialogSection>
              <Alert_Shadcn_
                variant={message.type === 'error' ? 'destructive' : 'default'}
                className=""
              >
                <WarningIcon />
                <AlertTitle_Shadcn_>{message.message}</AlertTitle_Shadcn_>
              </Alert_Shadcn_>
            </DialogSection>
          </>
        )}
      </DialogContent>
    </Dialog>
  )
}
