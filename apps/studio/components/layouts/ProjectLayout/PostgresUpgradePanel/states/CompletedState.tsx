import { Button } from 'ui'
import { PageSection } from 'ui-patterns/PageSection'
import { UpgradeStepsTable } from '../UpgradeStepsTable'
import { CompletedStateProps, UPGRADE_STATE_CONTENT } from '../types'

export const CompletedState = ({
  projectRef,
  projectName,
  displayTargetVersion,
  targetVersion,
  onReturnToProject,
  isLoading,
}: CompletedStateProps) => {
  const content = UPGRADE_STATE_CONTENT.completed

  return (
    <PageSection>
      <div className="flex flex-col gap-y-3">
        <h3 className="text-lg">{content.stepsHeading}</h3>
        <UpgradeStepsTable variant="completed" />
      </div>

      <div className="flex flex-row gap-x-2 items-center justify-end">
        <Button loading={isLoading} disabled={isLoading} onClick={onReturnToProject}>
          Return to project
        </Button>
      </div>
    </PageSection>
  )
}
