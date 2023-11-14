import Link from 'next/link'
import { Alert, Button } from 'ui'

// [Joshen] In the future, conditionals should be from resource exhaustion endpoint as single source of truth
interface DiskIOBandwidthWarningsProps {
  isFreePlan: boolean
  hasLatest: boolean
  upgradeUrl: string
  currentBillingCycleSelected: boolean
  latestIoBudgetConsumption: number
  highestIoBudgetConsumption: number
}

const DiskIOBandwidthWarnings = ({
  isFreePlan,
  hasLatest,
  currentBillingCycleSelected,
  upgradeUrl,
  latestIoBudgetConsumption,
  highestIoBudgetConsumption,
}: DiskIOBandwidthWarningsProps) => {
  if (hasLatest && latestIoBudgetConsumption >= 100) {
    return (
      <Alert withIcon variant="danger" title="Your Disk IO Budget has been used up">
        <p className="mb-4">
          Your workload has used up all your Disk IO Budget and is now running at the baseline
          performance. If you need consistent disk performance, consider upgrading to a larger
          compute add-on.
        </p>
        <Button asChild type="danger">
          <Link href={upgradeUrl}>{isFreePlan ? 'Upgrade project' : 'Change compute add-on'}</Link>
        </Button>
      </Alert>
    )
  }

  if (hasLatest && latestIoBudgetConsumption >= 80) {
    return (
      <Alert withIcon variant="danger" title="You are close to running out of Disk IO Budget">
        <p className="mb-4">
          Your workload has consumed {latestIoBudgetConsumption}% of your Disk IO Budget. If you use
          up all your Disk IO Budget, your instance will reverted to baseline performance. If you
          need consistent disk performance, consider upgrading to a larger compute add-on.
        </p>
        <Button asChild type="danger">
          <Link href={upgradeUrl}>{isFreePlan ? 'Upgrade project' : 'Change compute add-on'}</Link>
        </Button>
      </Alert>
    )
  }

  if (currentBillingCycleSelected && highestIoBudgetConsumption >= 100) {
    return (
      <Alert withIcon variant="warning" title="You ran out of IO Budget at least once">
        <p className="mb-4">
          Your workload has used up all your Disk IO Budget and reverted to baseline performance at
          least once during this billing cycle. If you need consistent disk performance, consider
          upgrading to a larger compute add-on.
        </p>
        <Button asChild type="warning">
          <Link href={upgradeUrl}>{isFreePlan ? 'Upgrade project' : 'Change compute add-on'}</Link>
        </Button>
      </Alert>
    )
  }

  if (currentBillingCycleSelected && highestIoBudgetConsumption >= 80) {
    return (
      <Alert
        withIcon
        variant="warning"
        title="You were close to using all your IO Budget at least once"
      >
        <p className="mb-4">
          Your workload has consumed {highestIoBudgetConsumption}% of your Disk IO budget during
          this billing cycle. If you use up all your Disk IO Budget, your instance will reverted to
          baseline performance. If you need consistent disk performance, consider upgrading to a
          larger compute add-on.
        </p>
        <Button asChild type="warning">
          <Link href={upgradeUrl}>{isFreePlan ? 'Upgrade project' : 'Change compute add-on'}</Link>
        </Button>
      </Alert>
    )
  }

  return null
}

export default DiskIOBandwidthWarnings
