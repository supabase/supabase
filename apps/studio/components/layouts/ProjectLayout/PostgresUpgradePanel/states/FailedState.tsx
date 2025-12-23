import { SupportCategories } from '@supabase/shared-types/out/constants'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { Button } from 'ui'
import { PageSection } from 'ui-patterns/PageSection'
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
    <PageSection>
      <div className="flex flex-row gap-x-2 items-center">
        <Button loading={isLoading} disabled={isLoading} onClick={onReturnToProject}>
          Return to project
        </Button>

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
      </div>
    </PageSection>
  )
}
