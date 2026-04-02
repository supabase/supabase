import { AlertTitle } from '@ui/components/shadcn/ui/alert'
import { AlertCircle } from 'lucide-react'
import Link from 'next/link'
import { Alert_Shadcn_, AlertDescription_Shadcn_, Button } from 'ui'

import { DOCS_URL } from '@/lib/constants'

interface RAMWarningsProps {
  hasAccessToComputeSizes: boolean
  upgradeUrl: string
  severity?: 'warning' | 'critical' | null
}

export const RAMWarnings = ({
  hasAccessToComputeSizes,
  upgradeUrl,
  severity,
}: RAMWarningsProps) => {
  if (severity === 'warning') {
    return (
      <Alert_Shadcn_ variant="warning">
        <AlertCircle />
        <AlertTitle>Your memory usage has exceeded 80%</AlertTitle>
        <AlertDescription_Shadcn_>
          High memory usage could result in overall degraded performance, and in rare cases, your
          instance may become unresponsive. If you need more resources, consider upgrading to a
          larger compute add-on.
        </AlertDescription_Shadcn_>
        <div className="mt-3 flex items-center space-x-2">
          <Button asChild type="default">
            <Link href={`${DOCS_URL}/guides/troubleshooting/exhaust-ram`}>Learn more</Link>
          </Button>
          <Button asChild type="warning">
            <Link href={upgradeUrl}>
              {hasAccessToComputeSizes ? 'Change compute add-on' : 'Upgrade project'}
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
        <AlertTitle>Your memory usage has reached 100%</AlertTitle>
        <AlertDescription_Shadcn_>
          High memory usage could result in overall degraded performance, and in rare cases, your
          instance may become unresponsive. If you need more resources, consider upgrading to a
          larger compute add-on.
        </AlertDescription_Shadcn_>
        <div className="mt-3 flex items-center space-x-2">
          <Button asChild type="default">
            <Link href={`${DOCS_URL}/guides/troubleshooting/high-cpu-usage`}>Learn more</Link>
          </Button>
          <Button asChild type="danger">
            <Link href={upgradeUrl}>
              {hasAccessToComputeSizes ? 'Change compute add-on' : 'Upgrade project'}
            </Link>
          </Button>
        </div>
      </Alert_Shadcn_>
    )
  }

  return null
}
