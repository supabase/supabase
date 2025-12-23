import { SupportCategories } from '@supabase/shared-types/out/constants'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { AlertCircle } from 'lucide-react'
import { Button } from 'ui'
import { FailedStateProps, UPGRADE_STATE_CONTENT } from '../types'

export const FailedState = ({
  projectRef,
  projectName,
  displayTargetVersion,
  error,
  initiatedAt,
  targetVersion,
  onReturnToProject,
  isLoading,
}: FailedStateProps) => {
  const content = UPGRADE_STATE_CONTENT.failed

  const subject = 'Upgrade%20failed%20for%20project'
  const message = `Upgrade information:%0A• Initiated at: ${initiatedAt}%0A• Target Version: ${targetVersion}%0A• Error: ${error}`

  return (
    <div className="grid gap-4">
      <div className="relative mx-auto max-w-[300px]">
        <AlertCircle className="text-amber-900" size={40} strokeWidth={1.5} />
      </div>
      <div className="space-y-2">
        <p className="text-center">We ran into an issue while upgrading your project</p>
        <p className="mt-4 text-center text-sm text-foreground-light w-full md:w-[450px] mx-auto">
          Your project is back online and its data is not affected. Please reach out to us via our
          support form for assistance with the upgrade.
        </p>
      </div>
      <div className="flex items-center mx-auto space-x-2">
        <Button asChild type="default">
          <SupportLink
            queryParams={{
              category: SupportCategories.DATABASE_UNRESPONSIVE,
              projectRef: projectRef,
              subject,
              message,
            }}
          >
            Contact support
          </SupportLink>
        </Button>
        <Button loading={isLoading} disabled={isLoading} onClick={onReturnToProject}>
          Return to project
        </Button>
      </div>
    </div>
  )
}

