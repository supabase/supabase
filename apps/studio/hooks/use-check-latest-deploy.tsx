import dayjs from 'dayjs'
import { useRouter } from 'next/router'
import { useEffect, useRef, useState } from 'react'
import { toast } from 'sonner'

import { useDeploymentCommitQuery } from 'data/utils/deployment-commit-query'
import { Button, StatusIcon } from 'ui'

const DeployCheckToast = ({ id }: { id: string | number }) => {
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
        <Button type="outline" onClick={() => toast.dismiss(id)}>
          Not now
        </Button>
        <Button onClick={() => router.reload()}>Refresh</Button>
      </div>
    </div>
  )
}

// This hook checks if the user is using old Studio pages and shows a toast to refresh the page. It's only triggered if
// there's a new version of Studio is available, and the user has been on the old dashboard (based on commit) for more than 24 hours.
// [Joshen] K-Dog has a suggestion here to bring down the time period here by checking commits
export function useCheckLatestDeploy() {
  const [isToastShown, setIsToastShown] = useState(false)

  const { data } = useDeploymentCommitQuery()
  const commit = data?.deploymentCommit
  const latestCommit = data?.latestCommit

  const commitLoggedRef = useRef(false)
  useEffect(() => {
    if (commit && !commitLoggedRef.current) {
      const commitTime =
        commit.time === 'unknown'
          ? 'unknown time'
          : dayjs(commit.time).format('YYYY-MM-DD HH:mm:ss Z')
      console.log(`Supabase Studio is running commit ${commit.sha} deployed at ${commitTime}.`)
      commitLoggedRef.current = true
    }
  }, [commit])

  useEffect(() => {
    if (
      !commit?.time ||
      commit.time === 'unknown' ||
      !latestCommit?.time ||
      latestCommit.time === 'unknown'
    ) {
      return
    }

    // prevent showing the toast again if user has already seen and dismissed it
    if (isToastShown) {
      return
    }

    // check if the time difference between commits is more than 24 hours
    const hourDiff = dayjs(latestCommit.time).diff(dayjs(commit.time), 'hour')
    if (hourDiff < 24) {
      return
    }

    // show the toast
    toast.custom((id) => <DeployCheckToast id={id} />, {
      duration: Infinity,
      position: 'bottom-right',
    })
    setIsToastShown(true)
  }, [commit?.time, latestCommit?.time, isToastShown])
}
