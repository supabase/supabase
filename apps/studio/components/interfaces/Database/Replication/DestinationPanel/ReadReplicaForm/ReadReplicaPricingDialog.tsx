import {
  Card,
  cn,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
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

import { useGetReplicaCost } from './useGetReplicaCost'
import { TaxDisclaimer } from '@/components/interfaces/Billing/TaxDisclaimer'
import { DocsButton } from '@/components/ui/DocsButton'
import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { DOCS_URL } from '@/lib/constants'

export const ReadReplicaPricingDialog = () => {
  const { data: project } = useSelectedProjectQuery()
  const { totalCost, compute, disk, iops, throughput } = useGetReplicaCost()

  const showNewDiskManagementUI = project?.cloud_provider === 'AWS'

  return (
    <Dialog>
      <p className="text-sm">
        New replica will cost an additional <span translate="no">{totalCost}/month</span>.{' '}
        <DialogTrigger asChild>
          <button
            type="button"
            className={cn(InlineLinkClassName, 'cursor-pointer text-foreground-light')}
          >
            Learn more
          </button>
        </DialogTrigger>
      </p>
      <DialogContent
        size={showNewDiskManagementUI ? 'medium' : 'small'}
        aria-describedby={undefined}
      >
        <DialogHeader>
          <DialogTitle>Calculating costs for a new read replica</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          {showNewDiskManagementUI ? (
            <>
              <p className="text-foreground-light text-sm mb-2">
                Read replicas will match the compute size of your primary database and will include
                25% more disk size than the primary database to accommodate WAL files.
              </p>

              <p className="text-foreground-light text-sm">
                The additional cost for the replica breaks down to:
              </p>

              <Card className="mt-2">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Item</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Cost (/month)</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody className="[&_td]:py-0 [&_tr]:h-[50px] [&_tr]:border-dotted">
                    <TableRow>
                      <TableCell>Compute size</TableCell>
                      <TableCell>{compute.label}</TableCell>
                      <TableCell className="text-right font-mono" translate="no">
                        {compute.cost}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Disk size</TableCell>
                      <TableCell>{disk.label}</TableCell>
                      <TableCell className="text-right font-mono" translate="no">
                        {disk.cost}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>IOPS</TableCell>
                      <TableCell>{iops.label}</TableCell>
                      <TableCell className="text-right font-mono" translate="no">
                        {iops.cost}
                      </TableCell>
                    </TableRow>
                    {disk.type === 'gp3' && (
                      <TableRow>
                        <TableCell>Throughput</TableCell>
                        <TableCell>{throughput.label}</TableCell>
                        <TableCell className="text-right font-mono">{throughput.cost}</TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </Card>
            </>
          ) : (
            <p className="text-foreground-light text-sm">
              Read replicas will be on the same compute size as your primary database. Deploying a
              read replica on the <span className="text-foreground">{compute.label}</span> size
              incurs additional{' '}
              <span className="text-foreground" translate="no">
                {compute?.priceDescription}
              </span>
              .
            </p>
          )}
          <TaxDisclaimer className="mt-3" />
        </DialogSection>

        <DialogFooter>
          <DocsButton href={`${DOCS_URL}/guides/platform/manage-your-usage/read-replicas`} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
