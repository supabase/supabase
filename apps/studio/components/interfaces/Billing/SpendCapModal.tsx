import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

import { DocsButton } from '@/components/ui/DocsButton'
import { DOCS_URL } from '@/lib/constants'

interface SpendCapModalProps {
  visible: boolean
  onHide: () => void
}

const SpendCapModal = ({ visible, onHide }: SpendCapModalProps) => {
  return (
    <AlertDialog open={visible} onOpenChange={() => onHide()}>
      <AlertDialogContent size="xlarge">
        <AlertDialogHeader>
          <AlertDialogTitle>
            <div className="flex justify-between items-center">
              <span>Spend Cap</span>
              <DocsButton href={`${DOCS_URL}/guides/platform/cost-control#spend-cap`} />
            </div>
          </AlertDialogTitle>
          <AlertDialogDescription asChild>
            <div className="space-y-4">
              <p className="text-sm">
                Enabling the Spend Cap limits your usage to your plan's quota, which controls costs
                but can restrict your service. Disabling the spend cap removes these limits, but any
                extra usage beyond the plan's limit will be charged per usage.
              </p>
              <p className="text-sm">
                Launching additional projects or enabling project add-ons will incur additional
                monthly fees independent of your Spend Cap.
              </p>

              {/* Maybe instead of a table, show something more interactive like a spend cap playground */}
              {/* Maybe ideate this in Figma first but this is good enough for now */}

              <Table>
                <TableHeader className="[&_th]:h-7">
                  <TableRow>
                    <TableHead className="w-[50%]">Item</TableHead>
                    <TableHead className="w-[25%]">Limit</TableHead>
                    <TableHead className="w-[25%]">Rate</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody className="[&_td]:py-2">
                  <TableRow>
                    <TableCell>Disk Size</TableCell>
                    <TableCell>8 GB per project</TableCell>
                    <TableCell translate="no">$0.125 per GB</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Egress</TableCell>
                    <TableCell>250 GB</TableCell>
                    <TableCell translate="no">$0.09 per GB</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Auth MAUs</TableCell>
                    <TableCell>100,000</TableCell>
                    <TableCell translate="no">$0.00325 per user</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Auth Third-Party MAUs</TableCell>
                    <TableCell>100,000</TableCell>
                    <TableCell translate="no">$0.00325 per user</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Auth Single Sign-On MAUs</TableCell>
                    <TableCell>50</TableCell>
                    <TableCell translate="no">$0.015 per user</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Storage Size</TableCell>
                    <TableCell>100 GB</TableCell>
                    <TableCell translate="no">$0.021 per GB</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Storage Image Transformations</TableCell>
                    <TableCell>100 origin images</TableCell>
                    <TableCell translate="no">$5 per 1000 images</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Realtime Concurrent Peak Connections</TableCell>
                    <TableCell>500</TableCell>
                    <TableCell translate="no">$10 per 1000</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Realtime Messages</TableCell>
                    <TableCell>5 Million</TableCell>
                    <TableCell translate="no">$2.50 per Million</TableCell>
                  </TableRow>

                  <TableRow>
                    <TableCell>Function Invocations</TableCell>
                    <TableCell>2 Million</TableCell>
                    <TableCell translate="no">$2 per Million</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogAction onClick={() => onHide()}>Understood</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

export default SpendCapModal
