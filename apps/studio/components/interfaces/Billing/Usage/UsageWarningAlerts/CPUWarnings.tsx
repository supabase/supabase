import { AlertTitle } from '@ui/components/shadcn/ui/alert'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { AlertDescription_Shadcn_, Alert_Shadcn_, Button } from 'ui'

interface CPUWarningsProps {
  isFreePlan: boolean
  upgradeUrl: string
  severity?: 'warning' | 'critical' | null
}

const CPUWarnings = ({ isFreePlan, upgradeUrl, severity }: CPUWarningsProps) => {
  if (severity === 'warning') {
    return (
      <Alert_Shadcn_ variant="warning">
        <AlertCircle />
        <AlertTitle>Your max CPU usage has exceeded 80%</AlertTitle>
        <AlertDescription_Shadcn_>
          High CPU usage could result in slower queries, disruption of daily back up routines, and
          in rare cases, your instance may become unresponsive. If you need more resources, consider
          upgrading to a larger compute add-on.
        </AlertDescription_Shadcn_>
        <div className="mt-3 flex items-center space-x-2">
          <Button asChild type="default">
            <Link href="https://supabase.com/docs/guides/platform/exhaust-cpu">Learn more</Link>
          </Button>
          <Button asChild type="warning">
            <Link href={upgradeUrl}>
              {isFreePlan ? 'Upgrade project' : 'Change compute add-on'}
            </Link>
          </Button>
        </div>
      </Alert_Shadcn_>
    )
  }

  if (severity === 'critical') {
    return (
      <Alert_Shadcn_ variant="destructive">
        <AlertCircle />
        <AlertTitle>Your max CPU usage has reached 100%</AlertTitle>
        <AlertDescription_Shadcn_>
          High CPU usage could result in slower queries, disruption of daily back up routines, and
          in rare cases, your instance may become unresponsive. If you need more resources, consider
          upgrading to a larger compute add-on.
        </AlertDescription_Shadcn_>
        <div className="mt-3 flex items-center space-x-2">
          <Button asChild type="default">
            <Link href="https://supabase.com/docs/guides/platform/exhaust-cpu">Learn more</Link>
          </Button>
          <Button asChild type="danger">
            <Link href={upgradeUrl}>
              {isFreePlan ? 'Upgrade project' : 'Change compute add-on'}
            </Link>
          </Button>
        </div>
      </Alert_Shadcn_>
    )
  }

  return null
}

export default CPUWarnings
