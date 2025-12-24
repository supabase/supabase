import { SupportCategories } from '@supabase/shared-types/out/constants'
import { SupportLink } from 'components/interfaces/Support/SupportLink'
import { Button } from 'ui'
import { PageSection } from 'ui-patterns/PageSection'
import { UpgradeStepsTable } from '../UpgradeStepsTable'
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

  const subject = encodeURIComponent('Upgrade failed for project')
  const message = encodeURIComponent(
    `Upgrade information:\n- Initiated at: ${initiatedAt}\n- Target Version: ${targetVersion}\n- Error: ${error}`
  )

  return (
    <PageSection>
      <div className="flex flex-col gap-y-3">
        <h3 className="text-lg">{content.stepsHeading}</h3>
        <UpgradeStepsTable variant="failed" />
      </div>

      <div className="flex flex-row gap-x-2 items-center justify-end">
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
