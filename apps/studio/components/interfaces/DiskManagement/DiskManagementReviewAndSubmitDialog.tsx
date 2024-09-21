import { ChevronRight } from 'lucide-react'
import { UseFormReturn } from 'react-hook-form'

import { ButtonTooltip } from 'components/ui/ButtonTooltip'
import {
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
} from 'ui'
import BillingChangeBadge from './BillingChangeBadge'
import { DiskStorageSchemaType } from './DiskManagementPanelSchema'
import { DiskMangementCoolDownSection } from './DiskManagementCoolDownSection'
import {
  calculateDiskSizePrice,
  calculateIOPSPrice,
  calculateThroughputPrice,
} from './DiskManagement.utils'
import { useOrgSubscriptionQuery } from 'data/subscriptions/org-subscription-query'
import { useSelectedOrganization } from 'hooks/misc/useSelectedOrganization'
import { DiskType } from './DiskManagement.constants'
import { formatCurrency } from 'lib/helpers'

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
            <span className="text-xs font-mono text-foreground-muted">{defaultValue}</span>
            <ChevronRight size={12} strokeWidth={2} className="text-foreground-muted" />
            <span className="text-xs font-mono text-foreground">{newValue}</span>
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
  isWithinCooldown: boolean
  setIsDialogOpen: (isOpen: boolean) => void
  onSubmit: (values: DiskStorageSchemaType) => Promise<void>
}

export const DiskManagementReviewAndSubmitDialog = ({
  isDialogOpen,
  setIsDialogOpen,
  isWithinCooldown,
  form,
  numReplicas,
  loading,
  onSubmit,
}: DiskSizeMeterProps) => {
  const org = useSelectedOrganization()
  const { data: subscription } = useOrgSubscriptionQuery({ orgSlug: org?.slug })

  const planId = subscription?.plan.id ?? ''
  const isDirty = Object.keys(form.formState.dirtyFields).length > 0

  const replicaTooltipText = `Price change includes primary database and ${numReplicas} replica${numReplicas > 1 ? 's' : ''}`

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

  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <ButtonTooltip
          htmlType="submit"
          type="primary"
          onClick={async (e) => {
            e.preventDefault()
            const isValid = await form.trigger()
            if (isValid) setIsDialogOpen(true)
          }}
          disabled={isWithinCooldown || !isDirty}
          tooltip={{
            content: {
              side: 'bottom',
              text: isWithinCooldown
                ? 'Currently within cooldown period from previous disk change'
                : undefined,
            },
          }}
        >
          Review changes
        </ButtonTooltip>
      </DialogTrigger>
      <DialogContent size="large">
        <DialogHeader>
          <DialogTitle>Review changes</DialogTitle>
          <DialogDescription>
            Disk configuration changes will be applied shortly once confirmed.
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />

        <Table>
          <TableHeader className="font-mono uppercase text-xs [&_th]:h-auto [&_th]:pb-2 [&_th]:pt-4">
            <TableHeaderRow />
          </TableHeader>
          <TableBody className="[&_td]:py-0 [&_tr]:h-[50px] [&_tr]:border-dotted">
            <TableDataRow
              hidePrice
              attribute="Storage Type"
              defaultValue={form.formState.defaultValues?.storageType ?? ''}
              newValue={form.getValues('storageType')}
              unit="-"
              beforePrice={0}
              afterPrice={0}
            />
            <TableDataRow
              attribute="IOPS"
              defaultValue={form.formState.defaultValues?.provisionedIOPS?.toLocaleString() ?? 0}
              newValue={form.getValues('provisionedIOPS')?.toLocaleString()}
              unit="IOPS"
              beforePrice={Number(iopsPrice.oldPrice)}
              afterPrice={Number(iopsPrice.newPrice)}
              priceTooltip={numReplicas > 0 ? replicaTooltipText : undefined}
            />
            {form.getValues('storageType') === 'gp3' ? (
              <TableDataRow
                attribute="Throughput"
                defaultValue={form.formState.defaultValues?.throughput?.toLocaleString() ?? 0}
                newValue={form.getValues('throughput')?.toLocaleString() ?? 0}
                unit="MB/s"
                beforePrice={Number(throughputPrice.oldPrice)}
                afterPrice={Number(throughputPrice.newPrice)}
                priceTooltip={numReplicas > 0 ? replicaTooltipText : undefined}
              />
            ) : (
              <TableRow>
                <TableCell className="pl-5">
                  <div className="flex flex-row gap-2 items-center">
                    <span>Throughput</span>
                  </div>
                </TableCell>
                <TableCell colSpan={3}>
                  <p className="text-foreground-lighter text-xs text-center">
                    Throughput is not configurable for io2 storage type
                  </p>
                </TableCell>
              </TableRow>
            )}
            <TableDataRow
              attribute="Disk size"
              defaultValue={form.formState.defaultValues?.totalSize?.toLocaleString() ?? 0}
              newValue={form.getValues('totalSize')?.toLocaleString()}
              unit="GB"
              beforePrice={Number(diskSizePrice.oldPrice)}
              afterPrice={Number(diskSizePrice.newPrice)}
              priceTooltip={numReplicas > 0 ? replicaTooltipText : undefined}
            />
          </TableBody>
        </Table>

        <DialogSectionSeparator />

        <DiskMangementCoolDownSection />

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
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
