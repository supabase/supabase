import { PermissionAction } from '@supabase/shared-types/out/constants'
import { ChevronRight } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { formatCurrency } from 'lib/helpers'
import {
  Alert_Shadcn_,
  AlertTitle_Shadcn_,
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  WarningIcon,
} from 'ui'
import BillingChangeBadge from './BillingChangeBadge'
import { DiskType } from './DiskManagement.constants'
import {
  calculateComputeSizePrice,
  calculateDiskSizePrice,
  calculateIOPSPrice,
  calculateThroughputPrice,
  getAvailableComputeOptions,
} from './DiskManagement.utils'
import { DiskMangementCoolDownSection } from './DiskManagementCoolDownSection'
import { DiskStorageSchemaType } from './DiskManagementPanel.schema'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { useMemo } from 'react'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { DiskMangementRestartRequiredSection } from './DiskManagementRestartRequiredSection'

const TableHeaderRow = () => (
  <TableRow>
    <TableHead className="w-[140px] pl-5">Disk attribute</TableHead>
    <TableHead className="text-right">-</TableHead>
    <TableHead className="w-[100px]">Unit</TableHead>
    <TableHead className="text-right pr-5">Price Change</TableHead>
  </TableRow>
)

interface TableDataRowProps {
  attribute: string
  defaultValue: string | number
  newValue: string | number
  unit: string
  beforePrice: number
  afterPrice: number
  hidePrice?: boolean
  priceTooltip?: string
}

const TableDataRow = ({
  attribute,
  defaultValue,
  newValue,
  unit,
  beforePrice,
  afterPrice,
  hidePrice = false,
  priceTooltip,
}: TableDataRowProps) => (
  <TableRow>
    <TableCell className="pl-5">
      <div className="flex flex-row gap-2 items-center">
        <span>{attribute}</span>
      </div>
    </TableCell>
    <TableCell className="text-right font-mono">
      {defaultValue !== newValue ? (
        <Badge variant="default" className="bg-alternative bg-opacity-100">
          <div className="flex items-center gap-1">
            <span className="text-xs font-mono text-foreground-muted">
              {defaultValue.toString().replace('ci_', '')}
            </span>
            <ChevronRight size={12} strokeWidth={2} className="text-foreground-muted" />
            <span className="text-xs font-mono text-foreground">
              {newValue.toString().replace('ci_', '')}
            </span>
          </div>
        </Badge>
      ) : (
        <span className="text-xs font-mono">
          <span className="text-foreground-muted"></span>
          {defaultValue}
        </span>
      )}
    </TableCell>
    <TableCell className="text-xs font-mono">{unit}</TableCell>
    <TableCell className="text-right pr-5">
      {hidePrice ? (
        <span className="text-xs font-mono">-</span>
      ) : beforePrice !== afterPrice ? (
        <BillingChangeBadge
          show={true}
          beforePrice={beforePrice}
          afterPrice={afterPrice}
          tooltip={priceTooltip}
        />
      ) : (
        <span className="text-xs font-mono">{formatCurrency(beforePrice)}</span>
      )}
    </TableCell>
  </TableRow>
)

interface DiskSizeMeterProps {
  loading: boolean
  form: UseFormReturn<DiskStorageSchemaType>
  numReplicas: number
  isDialogOpen: boolean
  disabled?: boolean
  setIsDialogOpen: (isOpen: boolean) => void
  onSubmit: (values: DiskStorageSchemaType) => Promise<void>
  message?: {
    type: 'error' | 'warning'
    message: string
  }
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
}: DiskSizeMeterProps) => {
  const { project } = useProjectContext()
  const org = useSelectedOrganization()

  /**
   * Queries
   * */
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: org?.slug })
  const {
    data: addons,
    isLoading: isAddonsLoading,
    error: addonsError,
    isSuccess: isAddonsSuccess,
  } = useProjectAddonsQuery({ projectRef: project?.ref })

  const canUpdateDiskConfiguration = useCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: {
      project_id: project?.id,
    },
  })

  const planId = subscription?.plan.id ?? ''
  const isDirty = !!Object.keys(form.formState.dirtyFields).length
  const replicaTooltipText = `Price change includes primary database and ${numReplicas} replica${numReplicas > 1 ? 's' : ''}`

  /**
   * Handle compute instances
   */
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
  })

  const diskSizePrice = calculateDiskSizePrice({
    planId,
    oldSize: form.formState.defaultValues?.totalSize || 0,
    oldStorageType: form.formState.defaultValues?.storageType as DiskType,
    newSize: form.getValues('totalSize'),
    newStorageType: form.getValues('storageType') as DiskType,
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

  const hasDiskConfigChanges =
    form.formState.defaultValues?.provisionedIOPS !== form.getValues('provisionedIOPS') ||
    (form.formState.defaultValues?.throughput !== form.getValues('throughput') &&
      form.getValues('storageType') === 'gp3') ||
    form.formState.defaultValues?.totalSize !== form.getValues('totalSize')

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <ButtonTooltip
          size="medium"
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
      {loading && <h1>is loading</h1>}
      <DialogContent className="min-w-[620px]">
        <DialogHeader>
          <DialogTitle>Review changes</DialogTitle>
          <DialogDescription>Changes will be applied shortly once confirmed.</DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />

        <Table>
          <TableHeader className="font-mono uppercase text-xs [&_th]:h-auto [&_th]:pb-2 [&_th]:pt-4">
            <TableHeaderRow />
          </TableHeader>
          <TableBody className="[&_td]:py-0 [&_tr]:h-[50px] [&_tr]:border-dotted">
            {form.formState.defaultValues?.computeSize !== form.getValues('computeSize') && (
              <TableDataRow
                attribute="Compute size"
                defaultValue={form.formState.defaultValues?.computeSize ?? ''}
                newValue={form.getValues('computeSize')}
                unit="-"
                beforePrice={Number(computeSizePrice.oldPrice)}
                afterPrice={Number(computeSizePrice.newPrice)}
              />
            )}
            {form.formState.defaultValues?.storageType !== form.getValues('storageType') && (
              <TableDataRow
                hidePrice
                attribute="Storage Type"
                defaultValue={form.formState.defaultValues?.storageType ?? ''}
                newValue={form.getValues('storageType')}
                unit="-"
                beforePrice={0}
                afterPrice={0}
              />
            )}
            {form.formState.defaultValues?.provisionedIOPS !==
              form.getValues('provisionedIOPS') && (
              <TableDataRow
                attribute="IOPS"
                defaultValue={form.formState.defaultValues?.provisionedIOPS?.toLocaleString() ?? 0}
                newValue={form.getValues('provisionedIOPS')?.toLocaleString()}
                unit="IOPS"
                beforePrice={Number(iopsPrice.oldPrice)}
                afterPrice={Number(iopsPrice.newPrice)}
                priceTooltip={numReplicas > 0 ? replicaTooltipText : undefined}
              />
            )}
            {form.formState.defaultValues?.throughput !== form.getValues('throughput') &&
              form.getValues('storageType') === 'gp3' && (
                <TableDataRow
                  attribute="Throughput"
                  defaultValue={form.formState.defaultValues?.throughput?.toLocaleString() ?? 0}
                  newValue={form.getValues('throughput')?.toLocaleString() ?? 0}
                  unit="MB/s"
                  beforePrice={Number(throughputPrice.oldPrice)}
                  afterPrice={Number(throughputPrice.newPrice)}
                  priceTooltip={numReplicas > 0 ? replicaTooltipText : undefined}
                />
              )}
            {form.formState.defaultValues?.totalSize !== form.getValues('totalSize') && (
              <TableDataRow
                attribute="Disk size"
                defaultValue={form.formState.defaultValues?.totalSize?.toLocaleString() ?? 0}
                newValue={form.getValues('totalSize')?.toLocaleString()}
                unit="GB"
                beforePrice={Number(diskSizePrice.oldPrice)}
                afterPrice={Number(diskSizePrice.newPrice)}
                priceTooltip={numReplicas > 0 ? replicaTooltipText : undefined}
              />
            )}
          </TableBody>
        </Table>

        <div className="flex flex-col gap-2 p-5">
          {form.formState.defaultValues?.computeSize !== form.getValues('computeSize') && (
            <DiskMangementRestartRequiredSection />
          )}
          {hasDiskConfigChanges && <DiskMangementCoolDownSection />}
        </div>

        {/* <DialogSectionSeparator /> */}

        <DialogFooter>
          <Button block size="small" type="default" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>

          <Button
            block
            size="small"
            htmlType="submit"
            loading={loading}
            onClick={async () => {
              await onSubmit(form.getValues())
            }}
          >
            Confirm changes
          </Button>

          {message && (
            <Alert_Shadcn_ variant={message.type === 'error' ? 'destructive' : 'default'}>
              <WarningIcon />
              <AlertTitle_Shadcn_>{message.message}</AlertTitle_Shadcn_>
            </Alert_Shadcn_>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
