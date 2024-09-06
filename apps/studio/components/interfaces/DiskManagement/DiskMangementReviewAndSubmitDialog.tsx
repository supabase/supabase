import { ChevronRight } from 'lucide-react'
import React from 'react'
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
  calculateDiskSizePrice: string
  calculateIOPSPrice: string
  calculateThroughputPrice: string | undefined
}

const TableHeaderRow: React.FC = () => (
  <TableRow>
    <TableHead className="w-[200px] pl-5">Disk attribute</TableHead>
    <TableHead>Unit</TableHead>
    <TableHead className="text-right pr-5">Price</TableHead>
  </TableRow>
)

interface TableDataRowProps {
  attribute: string
  defaultValue: string | number
  newValue: string | number
  unit: string
  price: number
}

const TableDataRow: React.FC<TableDataRowProps> = ({
  attribute,
  defaultValue,
  newValue,
  unit,
  price,
}) => (
  <TableRow>
    <TableCell className="font-medium pl-5">{attribute}</TableCell>
    <TableCell>
      <div className="flex justify-start">
        <Badge
          size="large"
          className="!bg-alternative border bg-opacity-100 inline-flex items-center gap-1 text-xs"
        >
          <span className="font-mono text-foreground-muted">
            {defaultValue}
            {unit}
          </span>
          <ChevronRight size={12} className="text-foreground-muted" />
          <span className="font-mono text-foreground">
            {newValue}
            {unit}
          </span>
        </Badge>
      </div>
    </TableCell>
    <TableCell className="text-right pr-5">
      <div className="flex justify-end">
        <BillingChangeBadge beforePrice={0} afterPrice={price} show={true} />
      </div>
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
            const isValid = await form.trigger() // Triggers validation for all fields
            if (isValid) {
              setIsDialogOpen(true) // Open the dialog only if the form is valid
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
              attribute="Disk Size"
              defaultValue={form.formState.defaultValues?.totalSize}
              newValue={form.getValues('totalSize')}
              unit="GiB"
              price={parseFloat(calculateDiskSizePrice)}
            />
            <TableDataRow
              attribute="IOPS"
              defaultValue={form.formState.defaultValues?.provisionedIOPS}
              newValue={form.getValues('provisionedIOPS')}
              unit="IOPS"
              price={parseFloat(calculateIOPSPrice)}
            />
            <TableDataRow
              attribute="Throughput"
              defaultValue={form.formState.defaultValues?.throughput}
              newValue={form.getValues('throughput')}
              unit="MiBps"
              price={calculateThroughputPrice ? parseFloat(calculateThroughputPrice) : 0}
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
              // Simulating a 5 second delay
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
