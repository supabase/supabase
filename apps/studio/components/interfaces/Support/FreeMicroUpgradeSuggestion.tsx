import { Admonition } from 'ui-patterns/Admonition'

import { isEligibleForFreeMicroUpgrade } from './FreeMicroUpgradeSuggestion.utils'
import { NO_PROJECT_MARKER } from './SupportForm.utils'
import { getInfrastructurePath } from '@/components/interfaces/Settings/Infrastructure/Infrastructure.utils'
import { InlineLink } from '@/components/ui/InlineLink'
import type { OrganizationPlanID } from '@/data/organizations/organization-query'
import { useProjectDetailQuery } from '@/data/projects/project-detail-query'

interface FreeMicroUpgradeSuggestionProps {
  projectRef?: string
  planId?: OrganizationPlanID
  className?: string
}

export const FreeMicroUpgradeSuggestion = ({
  projectRef,
  planId,
  className,
}: FreeMicroUpgradeSuggestionProps) => {
  const hasProject = !!projectRef && projectRef !== NO_PROJECT_MARKER
  const { data: project } = useProjectDetailQuery({ ref: projectRef }, { enabled: hasProject })

  const isEligible = isEligibleForFreeMicroUpgrade({
    planId,
    computeSize: project?.infra_compute_size,
  })

  if (!hasProject || !isEligible) return null

  return (
    <Admonition
      type="default"
      className={className}
      title="Your project is eligible for a free compute upgrade"
    >
      Your plan includes a free upgrade from Nano to Micro compute, which doubles the memory.{' '}
      <InlineLink href={`${getInfrastructurePath(projectRef)}?upgrade=micro`}>
        Upgrade to Micro
      </InlineLink>
      .
    </Admonition>
  )
}
