import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ArrowRight } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'
import {
  Alert_Shadcn_,
  AlertTitle_Shadcn_,
  Button,
  ButtonProps,
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

import { DiskStorageSchemaType } from '../DiskManagement.schema'
import { DiskManagementMessage } from '../DiskManagement.types'
import { DISK_AUTOSCALE_CONFIG_DEFAULTS } from '../ui/DiskManagement.constants'
import {
  BreakdownRow,
  PriceDelta,
  ValueChange,
} from './DiskManagementReviewAndSubmitDialog.components'
import { useDiskManagementReviewChanges } from './DiskManagementReviewAndSubmitDialog.hooks'
import { TaxDisclaimer } from '@/components/interfaces/Billing/TaxDisclaimer'
import { ButtonTooltip } from '@/components/ui/ButtonTooltip'
import { useAsyncCheckPermissions } from '@/hooks/misc/useCheckPermissions'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { formatCurrency } from '@/lib/helpers'

interface DiskManagementReviewAndSubmitDialogProps {
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
}: DiskManagementReviewAndSubmitDialogProps) => {
  const { data: project } = useSelectedProjectQuery()

  const { can: canUpdateDiskConfiguration } = useAsyncCheckPermissions(
    PermissionAction.UPDATE,
    'projects',
    { resource: { project_id: project?.id } }
  )

  const isDirty = !!Object.keys(form.formState.dirtyFields).length

  const {
    computeSizePrice,
    diskSizePrice,
    iopsPrice,
    throughputPrice,
    totalBeforePrice,
    totalAfterPrice,
    hasComputeChanges,
    hasTotalSizeChanges,
    hasStorageTypeChanges,
    hasIOPSChanges,
    hasGrowthPercentChanges,
    hasMinIncrementChanges,
    hasMaxSizeChanges,
    anyBillableDiskChange,
    anyDiskAttributeChange,
    showThroughputRow,
    hasAnyBreakdownRows,
    oldComputeLabel,
    newComputeLabel,
  } = useDiskManagementReviewChanges(form, numReplicas)

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

        {(hasComputeChanges || anyBillableDiskChange) && (
          <>
            <div className="relative flex border-b">
              <div className="flex-1 flex flex-col items-center gap-2 py-6 px-4 border-r bg-linear-to-t from-[hsl(var(--background-surface-100))] to-transparent">
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
                <span className="absolute inset-0 bg-brand/10 rounded-full" />
                <span className="animate-badge-shimmer pointer-events-none absolute inset-0 bg-linear-to-br from-transparent via-brand/20 to-transparent blur-md" />
                <ArrowRight size={16} className="text-brand-600 relative z-10" strokeWidth={2.5} />
              </div>

              <div className="flex-1 flex flex-col items-center gap-2 py-6 px-4 bg-linear-to-t from-[hsl(var(--background-surface-100))] to-transparent">
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
            <TaxDisclaimer className="px-5 py-2 text-center border-b" />
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
              <BreakdownRow
                label="IOPS"
                description={
                  anyDiskAttributeChange && !hasTotalSizeChanges && !hasStorageTypeChanges
                    ? 'For 4 hours after changes you will not be able to modify disk attributes.'
                    : undefined
                }
              >
                <div className="flex flex-col items-end gap-0.5">
                  <ValueChange
                    from={(form.formState.defaultValues?.provisionedIOPS ?? 0).toLocaleString()}
                    to={(form.getValues('provisionedIOPS') ?? 0).toLocaleString()}
                  />
                  <PriceDelta delta={Number(iopsPrice.newPrice) - Number(iopsPrice.oldPrice)} />
                </div>
              </BreakdownRow>
            )}
            {showThroughputRow && (
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
              <Alert_Shadcn_ variant={message.type === 'error' ? 'destructive' : 'default'}>
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
