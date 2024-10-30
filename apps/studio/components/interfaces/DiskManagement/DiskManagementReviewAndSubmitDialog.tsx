import { PermissionAction } from '@supabase/shared-types/out/constants'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'
import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useProjectAddonsQuery } from 'data/subscriptions/project-addons-query'
import { useCheckPermissions } from 'hooks/misc/useCheckPermissions'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { formatCurrency } from 'lib/helpers'
import { ChevronRight } from 'lucide-react'
import { useMemo } from 'react'
import { UseFormReturn } from 'react-hook-form'
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
import { DiskStorageSchemaType } from './DiskManagement.schema'
import {
  calculateComputeSizePrice,
  calculateDiskSizePrice,
  calculateIOPSPrice,
  calculateThroughputPrice,
  getAvailableComputeOptions,
  mapAddOnVariantIdToComputeSize,
} from './DiskManagement.utils'
import { DiskMangementRestartRequiredSection } from './DiskManagementRestartRequiredSection'
import { BillingChangeBadge } from './ui/BillingChangeBadge'
import { DiskType } from './ui/DiskManagement.constants'
import { DiskMangementCoolDownSection } from './ui/DiskManagementCoolDownSection'

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
              {defaultValue.toString()}
            </span>
            <ChevronRight size={12} strokeWidth={2} className="text-foreground-muted" />
            <span className="text-xs font-mono text-foreground">{newValue.toString()}</span>
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

  const { formState, getValues } = form

  const canUpdateDiskConfiguration = useCheckPermissions(PermissionAction.UPDATE, 'projects', {
    resource: {
      project_id: project?.id,
    },
  })

  /**
   * Queries
   * */
  const {
    data: subscription,
    // request deps in Form handle errors and loading
  } = useOrgSubscriptionQuery({ orgSlug: org?.slug })
  const {
    data: addons,
    // request deps in Form handle errors and loading
  } = useProjectAddonsQuery({ projectRef: project?.ref })

  const planId = subscription?.plan.id ?? 'free'
  const isDirty = !!Object.keys(form.formState.dirtyFields).length
  const replicaTooltipText = `Price change includes primary database and ${numReplicas} replica${numReplicas > 1 ? 's' : ''}`

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
      <DialogContent className="min-w-[620px]">
        <DialogHeader>
          <DialogTitle>Review changes</DialogTitle>
          <DialogDescription>Changes will be applied shortly once confirmed.</DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <div className="flex flex-col gap-2 p-5">
          <DiskMangementRestartRequiredSection
            visible={form.formState.defaultValues?.computeSize !== form.getValues('computeSize')}
            title="Compute resizes trigger project restarts."
            description="Project will restart automatically on confirmation."
          />
          {hasDiskConfigChanges && <DiskMangementCoolDownSection />}
        </div>
        <DialogSectionSeparator />
        <Table>
          <TableHeader className="font-mono uppercase text-xs [&_th]:h-auto [&_th]:pb-2 [&_th]:pt-4">
            <TableHeaderRow />
          </TableHeader>
          <TableBody className="[&_td]:py-0 [&_tr]:h-[50px] [&_tr]:border-dotted">
            {form.formState.defaultValues?.computeSize !== form.getValues('computeSize') && (
              <TableDataRow
                attribute="Compute size"
                defaultValue={mapAddOnVariantIdToComputeSize(
                  form.formState.defaultValues?.computeSize ?? 'ci_nano'
                )}
                newValue={mapAddOnVariantIdToComputeSize(form.getValues('computeSize'))}
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
                  unit="MiB/s"
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

        {/* <DialogSectionSeparator /> */}

        <DialogFooter>
          <Button block size="large" type="default" onClick={() => setIsDialogOpen(false)}>
            Cancel
          </Button>

          <Button
            block
            type={'warning'}
            size="large"
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
