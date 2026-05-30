import { useParams } from 'common'
import { AlertCircleIcon } from 'lucide-react'
import Link from 'next/link'
import { Alert, AlertDescription, AlertTitle, Button } from 'ui'

import { useAppStateSnapshot } from '@/state/app-state'

export const BranchingPostgresVersionNotice = () => {
  const { ref } = useParams()
  const snap = useAppStateSnapshot()

  return (
    <Alert className="rounded-none px-7 py-6 [&>svg]:top-6 [&>svg]:left-6 border-t-0! border-l-0! border-r-0!">
      <AlertCircleIcon />
      <AlertTitle className="text-base">
        Your project needs to be on Postgres 15 to enable branching
      </AlertTitle>
      <AlertDescription>
        Head over to your project's infrastructure settings to upgrade to the latest version of
        Postgres before enabling branching.
      </AlertDescription>
      <AlertDescription>
        <Button size="tiny" type="default" className="mt-4">
          <Link
            href={`/project/${ref}/settings/infrastructure`}
            onClick={() => snap.setShowCreateBranchModal(false)}
          >
            Head to project settings
          </Link>
        </Button>
      </AlertDescription>
    </Alert>
  )
}
