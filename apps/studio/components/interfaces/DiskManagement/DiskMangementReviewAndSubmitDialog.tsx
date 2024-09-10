import { ChevronRight } from 'lucide-react'
import React from 'react'
import {
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
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'
import BillingChangeBadge from './BillingChangeBadge'
import { DiskMangementCoolDownSection } from './DiskMangementCoolDownSection'

interface DiskSizeMeterProps {
  isDialogOpen: boolean
  setIsDialogOpen: (isOpen: boolean) => void
  form: any // Replace 'any' with the actual type of your form
  loading: boolean
  onSubmit: (values: any) => Promise<void> // Replace 'any' with the actual type of form values
  calculateDiskSizePrice: { oldPrice: string; newPrice: string }
  calculateIOPSPrice: { oldPrice: string; newPrice: string }
  calculateThroughputPrice: { oldPrice: string; newPrice: string }
}

const TableHeaderRow: React.FC = () => (
  <TableRow>
    <TableHead className="w-[200px] pl-5">Disk attribute</TableHead>
    <TableHead>Unit</TableHead>
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
}

const TableDataRow: React.FC<TableDataRowProps> = ({
  attribute,
  defaultValue,
  newValue,
  unit,
  beforePrice,
  afterPrice,
}) => (
  <TableRow>
    <TableCell className="pl-5">
      <div className="flex flex-row gap-2 items-center">
        <span>{attribute}</span>
        <div className="flex flex-row items-center gap-1">
          <span className="text-foreground-muted">{defaultValue}</span>
          <ChevronRight size={12} strokeWidth={2} className="text-foreground-muted" />
          <span className="text-xs">{newValue}</span>
        </div>
      </div>
    </TableCell>
    <TableCell>{unit}</TableCell>
    <TableCell className="text-right pr-5">
      {beforePrice !== afterPrice ? (
        <BillingChangeBadge show={true} beforePrice={beforePrice} afterPrice={afterPrice} />
      ) : (
        <span className="text-xs font-mono">
          <span className="text-foreground-muted">no change - </span>${beforePrice}
        </span>
      )}
    </TableCell>
  </TableRow>
)

export const DiskManagementReviewAndSubmitDialog: React.FC<DiskSizeMeterProps> = ({
  isDialogOpen,
  setIsDialogOpen,
  form,
  loading,
  onSubmit,
  calculateDiskSizePrice,
  calculateIOPSPrice,
  calculateThroughputPrice,
}) => {
  return (
    <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
      <DialogTrigger asChild>
        <Button
          htmlType="submit"
          type="primary"
          onClick={async (e) => {
            e.preventDefault()
            const isValid = await form.trigger()
            if (isValid) {
              setIsDialogOpen(true)
            }
          }}
          disabled={!form.formState.isDirty}
        >
          Review changes
        </Button>
      </DialogTrigger>
      <DialogContent size="large">
        <DialogHeader>
          <DialogTitle>Review changes</DialogTitle>
          <DialogDescription>
            Disk configuration changes will take effect after the next restart.
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />

        <Table>
          <TableCaption>Please take note of the above billing changes</TableCaption>
          <TableHeader className="font-mono uppercase text-xs [&_th]:h-auto [&_th]:pb-2 [&_th]:pt-4">
            <TableHeaderRow />
          </TableHeader>
          <TableBody className="[&_td]:py-0 [&_tr]:h-[50px] [&_tr]:border-dotted">
            <TableDataRow
              attribute="Disk size"
              defaultValue={form.formState.defaultValues?.totalSize}
              newValue={form.getValues('totalSize')}
              unit="GiB"
              beforePrice={Number(calculateDiskSizePrice.oldPrice)}
              afterPrice={Number(calculateDiskSizePrice.newPrice)}
            />
            <TableDataRow
              attribute="IOPS"
              defaultValue={form.formState.defaultValues?.provisionedIOPS}
              newValue={form.getValues('provisionedIOPS')}
              unit="IOPS"
              beforePrice={Number(calculateIOPSPrice.oldPrice)}
              afterPrice={Number(calculateIOPSPrice.newPrice)}
            />
            <TableDataRow
              attribute="Throughput"
              defaultValue={form.formState.defaultValues?.throughput}
              newValue={form.getValues('throughput')}
              unit="MiBps"
              beforePrice={Number(calculateThroughputPrice.oldPrice)}
              afterPrice={Number(calculateThroughputPrice.newPrice)}
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
            Accept changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
