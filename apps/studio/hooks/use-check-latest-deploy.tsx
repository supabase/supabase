import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'

import { IS_PLATFORM } from 'common'
import { useDeploymentCommitQuery } from 'data/utils/deployment-commit-query'
import { Button, StatusIcon } from 'ui'

const DeployCheckToast = ({ id, onDismiss }: { id: string | number; onDismiss: () => void }) => {
  const router = useRouter()

  return (
    <div className="flex gap-3 flex-col w-full">
      <div className="flex gap-3 flex-row">
        <StatusIcon variant="default" className="mt-0.5" />
        <div className="flex w-full justify-between flex-col text-sm">
          <p className="text-foreground">A new version of this page is available</p>
          <p className="text-foreground-light">Refresh to see the latest changes.</p>
        </div>
      </div>

      <div className="flex gap-5 justify-end">
        <Button
          type="outline"
          onClick={() => {
            toast.dismiss(id)
            onDismiss()
          }}
        >
          Not now
        </Button>
        <Button onClick={() => router.reload()}>Refresh</Button>
      </div>
    </div>
  )
}

// This hook checks if the user is using old Studio pages and shows a toast to refresh the page. It's only triggered if
// the user has been more than 24 hours and a new version of Studio is available.
export function useCheckLatestDeploy() {
  const [currentCommitTime, setCurrentCommitTime] = useState('')
  const [isDismissed, setIsDismissed] = useState(false)
  const { data: commit } = useDeploymentCommitQuery({
    enabled: IS_PLATFORM,
    staleTime: 30 * 60 * 1000, // 30 minutes
  })

  useEffect(() => {
    // if the fetched commit is undefined is undefined
    if (!commit || commit.commitTime === 'unknown') {
      return
    }

    // set the current commit on first load
    if (!currentCommitTime) {
      setCurrentCommitTime(commit.commitTime)
      return
    }

    // // if the current commit is the same as the fetched commit, do nothing
    if (currentCommitTime === commit.commitTime) {
      return
    }

    // // if the app showed the toast once and the user has dismissed the toast, don't ping them again
    if (isDismissed) {
      return
    }

    // Check if the time difference between commits is more than 24 hours
    const hourDiff = dayjs(commit.commitTime).diff(dayjs(currentCommitTime), 'hour')
    if (hourDiff < 24) {
      return
    }

    // show the toast
    toast.custom((id) => <DeployCheckToast id={id} onDismiss={() => setIsDismissed(true)} />, {
      duration: Infinity,
    })
  }, [commit, isDismissed, currentCommitTime])
}
