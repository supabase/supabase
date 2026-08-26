import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  DialogTrigger,
  Table,
  TableBody,
  TableCell,
  TableFooter,
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
  const { isLoading, isError, retry, totalCost, compute, disk, iops, throughput } = replicaCost

  const showNewDiskManagementUI = project?.cloud_provider === 'AWS'
  const showError = isError && !isLoading

  return (
    <Dialog>
      <Admonition
        type={showError ? 'warning' : 'note'}
        layout="responsive"
        title={
          showError
            ? 'Unable to estimate additional cost'
            : `Estimated additional cost${isLoading ? '' : ` of ${totalCost}/month`}`
        }
        description={
          showError
            ? 'We couldn’t load the required pricing data.'
            : 'Based on your primary database configuration.'
        }
        className="mb-0 rounded-none border-x-0"
        actions={
          showError ? (
            <Button type="button" variant="default" size="tiny" onClick={retry}>
              Retry
            </Button>
          ) : (
            <DialogTrigger asChild>
              <Button type="button" variant="default" size="tiny" disabled={isLoading}>
                View breakdown
              </Button>
            </DialogTrigger>
          )
        }
      />
      <DialogContent size="medium" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Read replica cost breakdown</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          {showNewDiskManagementUI ? (
            <>
              <p className="mb-3 text-sm text-foreground-light">
                The replica matches your primary compute and includes 25% additional disk capacity
                for WAL files.
              </p>
              <Card>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead className="w-[140px]">Item</TableHead>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Monthly cost</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    <TableRow>
                      <TableCell>Compute size</TableCell>
                      <TableCell className="text-foreground-lighter">{compute.label}</TableCell>
                      <TableCell className="text-right font-mono" translate="no">
                        {compute.cost}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>Disk size</TableCell>
                      <TableCell className="text-foreground-lighter">{disk.label}</TableCell>
                      <TableCell className="text-right font-mono" translate="no">
                        {disk.cost}
                      </TableCell>
                    </TableRow>
                    <TableRow>
                      <TableCell>IOPS</TableCell>
                      <TableCell className="text-foreground-lighter">{iops.label}</TableCell>
                      <TableCell className="text-right font-mono" translate="no">
                        {iops.cost}
                      </TableCell>
                    </TableRow>
                    {disk.type === 'gp3' && (
                      <TableRow>
                        <TableCell>Throughput</TableCell>
                        <TableCell className="text-foreground-lighter">
                          {throughput.label}
                        </TableCell>
                        <TableCell className="text-right font-mono" translate="no">
                          {throughput.cost}
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                  <TableFooter>
                    <TableRow>
                      <TableCell colSpan={2} className="font-medium">
                        Estimated total
                      </TableCell>
                      <TableCell className="text-right font-mono font-medium" translate="no">
                        {totalCost}
                      </TableCell>
                    </TableRow>
                  </TableFooter>
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
          <TaxDisclaimer className="mt-3 text-sm text-foreground-light" />
        </DialogSection>
      </DialogContent>
    </Dialog>
  )
}
