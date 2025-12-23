import { CheckCircle } from 'lucide-react'
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
      <div className="relative mx-auto max-w-[300px]">
        <CheckCircle className="text-brand-link" size={40} strokeWidth={1.5} />
      </div>
      <div className="space-y-2">
        <p className="text-center">Upgrade completed!</p>
        <p className="mt-4 text-center text-sm text-foreground-light w-[300px] mx-auto">
          Your project has been successfully upgraded to Postgres {displayTargetVersion} and is now
          back online.
        </p>
      </div>
      <div className="mx-auto">
        <Button loading={isLoading} disabled={isLoading} onClick={onReturnToProject}>
          Return to project
        </Button>
      </div>
    </PageSection>
  )
}
