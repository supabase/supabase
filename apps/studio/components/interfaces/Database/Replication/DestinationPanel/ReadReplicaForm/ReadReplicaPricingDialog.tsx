import { DocsButton } from 'components/ui/DocsButton'
import { InlineLinkClassName } from 'components/ui/InlineLink'
import { useSelectedProjectQuery } from 'hooks/misc/useSelectedProject'
import { DOCS_URL } from 'lib/constants'
import {
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

export const ReadReplicaPricingDialog = () => {
  const { data: project } = useSelectedProjectQuery()
  const { compute, disk, iops, throughput } = useGetReplicaCost()

  const showNewDiskManagementUI = project?.cloud_provider === 'AWS'

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className={cn(InlineLinkClassName, 'text-sm text-foreground-light')}>
          Learn more
        </button>
      </DialogTrigger>
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
              <Table>
                <TableHeader className="font-mono uppercase text-xs [&_th]:h-auto [&_th]:pb-2 [&_th]:pt-4">
                  <TableRow>
                    <TableHead className="w-[140px] pl-0">Item</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right pr-0">Cost (/month)</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_td]:py-0 [&_tr]:h-[50px] [&_tr]:border-dotted">
                  <TableRow>
                    <TableCell className="pl-0">Compute size</TableCell>
                    <TableCell>{compute.label}</TableCell>
                    <TableCell className="text-right font-mono pr-0" translate="no">
                      {compute.cost}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-0">Disk size</TableCell>
                    <TableCell>{disk.label}</TableCell>
                    <TableCell className="text-right font-mono pr-0" translate="no">
                      {disk.cost}
                    </TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell className="pl-0">IOPS</TableCell>
                    <TableCell>{iops.label}</TableCell>
                    <TableCell className="text-right font-mono pr-0" translate="no">
                      {iops.cost}
                    </TableCell>
                  </TableRow>
                  {disk.type === 'gp3' && (
                    <TableRow>
                      <TableCell className="pl-0">Throughput</TableCell>
                      <TableCell>{throughput.label}</TableCell>
                      <TableCell className="text-right font-mono pr-0">{throughput.cost}</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
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
        </DialogSection>

        <DialogFooter>
          <DocsButton href={`${DOCS_URL}/guides/platform/manage-your-usage/read-replicas`} />
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
