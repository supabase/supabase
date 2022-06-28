import { FC, useState } from 'react'
import { Button, IconAlertCircle, IconPauseCircle } from '@supabase/ui'

import { Project } from 'types'
import Link from '@supabase/ui/dist/cjs/components/Typography/Link'
import router from 'next/router'
import { useStore, useSubscriptionStats } from 'hooks'
import { DEFAULT_FREE_PROJECTS_LIMIT } from 'lib/constants'

interface Props {
  project: Project
}

const ProjectPausedState: FC<Props> = ({ project }) => {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const { ref } = router.query
  const { ui } = useStore()
  const subscriptionStats = useSubscriptionStats()
  const freeProjectsLimit = ui.profile?.free_project_limit ?? DEFAULT_FREE_PROJECTS_LIMIT
  console.log(subscriptionStats)

  return (
    <>
      <div className="mx-auto mt-8 mb-16 w-full max-w-7xl">
        <div className="mx-6">
          <div className="bg-scale-300 border-scale-400 flex h-[500px] items-center justify-center rounded border p-8">
            <div className="grid w-[420px] gap-4">
              <div className="mx-auto flex max-w-[300px] items-center justify-center space-x-4 lg:space-x-8">
                <IconPauseCircle className="text-scale-1100" size={50} strokeWidth={1.5} />
              </div>

              <p className="text-center">This project is paused.</p>

              <div className="flex items-center justify-center gap-4">
                <Button
                  // onClick={}
                  size="small"
                  loading={isSubmitting}
                  type="primary"
                >
                  Restore
                </Button>

                <Link href={`/project/${ref}/settings/general`}>
                  <Button
                    // onClick={}
                    size="small"
                    loading={isSubmitting}
                    type="default"
                    tabIndex={-1}
                  >
                    <a>Delete</a>
                  </Button>
                </Link>
              </div>

              <div className="mt-4 flex gap-4 border-t pt-8">
                <IconAlertCircle className="text-red-900" size={35} strokeWidth={2} />
                <div>
                  <p className="text-md">
                    Your account can only have <u>{freeProjectsLimit} free projects.</u>
                  </p>
                  <p className="text-scale-900 mt-2 text-sm">
                    To restore this project you'll need to pause or delete an existing free project
                    first.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

export default ProjectPausedState
