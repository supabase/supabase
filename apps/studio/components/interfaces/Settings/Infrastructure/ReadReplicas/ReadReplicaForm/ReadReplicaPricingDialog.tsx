import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogDescription,
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
import { Admonition } from 'ui-patterns/Admonition'

import { useGetReplicaCost } from './useGetReplicaCost'
import { TaxDisclaimer } from '@/components/interfaces/Billing/TaxDisclaimer'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'

interface ReadReplicaPricingDialogProps {
  replicaCost: ReturnType<typeof useGetReplicaCost>
}

export const ReadReplicaPricingDialog = ({ replicaCost }: ReadReplicaPricingDialogProps) => {
  const { data: project } = useSelectedProjectQuery()
  const { totalCost, compute, disk, iops, throughput } = replicaCost

  const showNewDiskManagementUI = project?.cloud_provider === 'AWS'

  return (
    <Dialog>
      <Admonition
        type="note"
        layout="responsive"
        title="Additional monthly cost"
        description={`Estimated increase: ${totalCost}/month based on your primary database configuration.`}
        className="mb-0 rounded-none border-x-0"
        actions={
          <DialogTrigger asChild>
            <Button type="button" variant="default" size="tiny">
              View breakdown
            </Button>
          </DialogTrigger>
        }
      />
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>Read replica cost breakdown</DialogTitle>
          <DialogDescription>
            The replica matches your primary compute and includes 25% additional disk capacity for
            WAL files.
          </DialogDescription>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          {showNewDiskManagementUI ? (
            <>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Item</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Monthly cost</TableHead>
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
                        <TableCell className="text-right font-mono" translate="no">
                          {throughput.cost}
                        </TableCell>
                      </TableRow>
                    )}
                    <TableRow className="border-t border-solid">
                      <TableCell colSpan={2} className="font-medium">
                        Estimated total
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium" translate="no">
                        {totalCost}
                      </TableCell>
                    </TableRow>
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
      </DialogContent>
    </Dialog>
  )
}
