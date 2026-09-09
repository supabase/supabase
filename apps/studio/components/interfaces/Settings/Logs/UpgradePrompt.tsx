import Link from 'next/link'
import {
  Button,
  Card,
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogSection,
  DialogSectionSeparator,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from 'ui'

import { TIER_QUERY_LIMITS } from './Logs.constants'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'

interface Props {
  show: boolean
  setShowUpgradePrompt: (value: boolean) => void
  title?: string
  description?: string
  source?: string
}
/**
 * @param show - whether to show the modal
 * @param setShowUpgradePrompt - function to set the show state
 * @param title - title of the modal
 * @param description - description of the modal
 * @param source - source of the upgrade prompt used to track the source of the upgrade prompt in the billing page
 * @returns
 */
const UpgradePrompt: React.FC<Props> = ({
  show,
  setShowUpgradePrompt,
  title = 'Log retention',
  description = 'Logs can be retained up to a duration of 3 months depending on the plan that your project is on.',
  source = 'logsRetentionUpgradePrompt',
}) => {
  const { data: organization } = useSelectedOrganizationQuery()

  return (
    <Dialog open={show} onOpenChange={() => setShowUpgradePrompt(false)}>
      <DialogContent size="medium">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>
        <DialogSectionSeparator />
        <DialogSection>
          <div className="space-y-4">
            <p className="text-sm">{description}</p>
            <Card>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Plan</TableHead>
                    <TableHead>Retention duration</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow>
                    <TableCell>Free</TableCell>
                    <TableCell>{TIER_QUERY_LIMITS.FREE.text}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Pro</TableCell>
                    <TableCell>{TIER_QUERY_LIMITS.PRO.text}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Team</TableCell>
                    <TableCell>{TIER_QUERY_LIMITS.TEAM.text}</TableCell>
                  </TableRow>
                  <TableRow>
                    <TableCell>Enterprise</TableCell>
                    <TableCell>{TIER_QUERY_LIMITS.ENTERPRISE.text}</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </Card>
          </div>
        </DialogSection>
        <DialogFooter className="flex justify-end gap-3">
          <Button variant="default" onClick={() => setShowUpgradePrompt(false)}>
            Close
          </Button>
          <Button asChild size="tiny">
            <Link
              href={`/org/${organization?.slug}/billing?panel=subscriptionPlan&source=${source}`}
            >
              Upgrade
            </Link>
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export default UpgradePrompt
