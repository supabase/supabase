import { ChevronRight } from 'lucide-react'

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
import { ButtonTooltip } from 'components/ui/ButtonTooltip'

const TableHeaderRow = () => (
  <TableRow>
    <TableHead className="w-[128px] pl-5">Disk attribute</TableHead>
    <TableHead className="text-right">-</TableHead>
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

const TableDataRow = ({
  attribute,
  defaultValue,
  newValue,
  unit,
  beforePrice,
  afterPrice,
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
      {beforePrice !== afterPrice ? (
        <BillingChangeBadge show={true} beforePrice={beforePrice} afterPrice={afterPrice} />
      ) : (
        <span className="text-xs font-mono">${beforePrice}</span>
      )}
    </TableCell>
  </TableRow>
)

interface DiskSizeMeterProps {
  isDialogOpen: boolean
  setIsDialogOpen: (isOpen: boolean) => void
  isWithinCooldown: boolean
  form: any // Replace 'any' with the actual type of your form
  loading: boolean
  onSubmit: (values: any) => Promise<void> // Replace 'any' with the actual type of form values
  iopsPrice: { oldPrice: string; newPrice: string }
  throughputPrice: { oldPrice: string; newPrice: string }
  diskSizePrice: { oldPrice: string; newPrice: string }
}

export const DiskManagementReviewAndSubmitDialog = ({
  isDialogOpen,
  setIsDialogOpen,
  isWithinCooldown,
  form,
  loading,
  onSubmit,
  iopsPrice,
  throughputPrice,
  diskSizePrice,
}: DiskSizeMeterProps) => {
  const isDirty = Object.keys(form.formState.dirtyFields)

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
              text: 'Currently within cooldown period from previous disk change',
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
              beforePrice={Number(diskSizePrice.oldPrice)}
              afterPrice={Number(diskSizePrice.newPrice)}
            />
            <TableDataRow
              attribute="IOPS"
              defaultValue={form.formState.defaultValues?.provisionedIOPS}
              newValue={form.getValues('provisionedIOPS')}
              unit="IOPS"
              beforePrice={Number(iopsPrice.oldPrice)}
              afterPrice={Number(iopsPrice.newPrice)}
            />
            <TableDataRow
              attribute="Throughput"
              defaultValue={form.formState.defaultValues?.throughput}
              newValue={form.getValues('throughput')}
              unit="MiBps"
              beforePrice={Number(throughputPrice.oldPrice)}
              afterPrice={Number(throughputPrice.newPrice)}
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
            Review changes
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
