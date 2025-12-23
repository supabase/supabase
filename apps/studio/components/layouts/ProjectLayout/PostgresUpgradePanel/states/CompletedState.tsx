import { Button } from 'ui'
import { PageSection } from 'ui-patterns/PageSection'
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
      <Button loading={isLoading} disabled={isLoading} onClick={onReturnToProject}>
        Return to project
      </Button>
    </PageSection>
  )
}
