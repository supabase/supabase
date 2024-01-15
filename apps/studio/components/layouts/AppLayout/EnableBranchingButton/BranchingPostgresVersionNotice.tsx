import { useParams } from 'common'
import Link from 'next/link'
import { AlertDescription_Shadcn_, AlertTitle_Shadcn_, Alert_Shadcn_, Button } from 'ui'

import { AlertCircleIcon } from 'lucide-react'
import { useAppStateSnapshot } from 'state/app-state'

const BranchingPostgresVersionNotice = () => {
  const { ref } = useParams()
  const snap = useAppStateSnapshot()

  return (
    <Alert_Shadcn_ className="rounded-none px-7 py-6 [&>svg]:top-6 [&>svg]:left-6 !border-t-0 !border-l-0 !border-r-0">
      <AlertCircleIcon />
      <AlertTitle_Shadcn_ className="text-base">
        Your project needs to be on Postgres 15 to enable branching
      </AlertTitle_Shadcn_>
      <AlertDescription_Shadcn_>
        Head over to your project's infrastructure settings to upgrade to the latest version of
        Postgres before enabling branching.
      </AlertDescription_Shadcn_>
      <AlertDescription_Shadcn_>
        <Button size="tiny" type="default" className="mt-4">
          <Link
            href={`/project/${ref}/settings/infrastructure`}
            onClick={() => snap.setShowEnableBranchingModal(false)}
          >
            Head to project settings
          </Link>
        </Button>
      </AlertDescription_Shadcn_>
    </Alert_Shadcn_>
  )
}

export default BranchingPostgresVersionNotice
