import Link from 'next/link'
import { Button, CriticalIcon } from 'ui'

import { useProjectContext } from './ProjectContext'

const PauseFailedState = () => {
  const { project } = useProjectContext()

  return (
    <div className="flex items-center justify-center h-full">
      <div className="bg-surface-100 border border-overlay rounded-md w-3/4 lg:w-1/2">
        <div className="space-y-6 pt-6">
          <div className="flex px-8 space-x-8">
            <div className="mt-1">
              <CriticalIcon className="w-5 h-5" />
            </div>
            <div className="space-y-1">
              <p>Something went wrong while pausing your project</p>
              <p className="text-sm text-foreground-light">
                Your project's data is intact, but your project is inaccessible due to the failure
                while pausing. Please contact support for assistance.
              </p>
            </div>
          </div>

          <div className="border-t border-overlay flex items-center justify-end py-4 px-8">
            <Button asChild type="default">
              <Link
                href={`/support/new?category=Database_unresponsive&ref=${project?.ref}&subject=Restoration%20failed%20for%20project`}
              >
                Contact support
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PauseFailedState
