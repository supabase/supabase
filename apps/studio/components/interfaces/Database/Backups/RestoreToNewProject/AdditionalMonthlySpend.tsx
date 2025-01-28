import { instanceSizeSpecs } from 'data/projects/new-project.constants'
import { useProjectContext } from 'components/layouts/ProjectLayout/ProjectContext'

export const AdditionalMonthlySpend = () => {
  const { project } = useProjectContext()

  /**
   * New project will have the same compute size and disk size as the original project
   */
  function getAdditionalMonthlySpend() {
    const currentProjectComputeSize = project?.infra_compute_size
    if (!currentProjectComputeSize) {
      return null
    }

    if (currentProjectComputeSize === 'nano') {
      return null
    }

    const additionalMonthlySpend = instanceSizeSpecs[currentProjectComputeSize]

    return additionalMonthlySpend
  }

  const additionalMonthlySpend = getAdditionalMonthlySpend()
  if (!additionalMonthlySpend) {
    return null
  }

  return (
    <div className="text-sm text-foreground-lighter border-t p-5">
      <p>
        The new project will have the same compute size and disk size as this project. You will be
        able to update the compute size and disk size after the new project is created in{' '}
        <span className="font-mono text-xs tracking-tighter text-foreground-light">
          Project Settings &gt; Compute and Disk
        </span>
      </p>
      <div className="flex justify-between text-foreground mt-2">
        <p>Additional Monthly Compute + Disk Cost</p>
        <p className="font-mono text-right text-brand">${additionalMonthlySpend.priceMonthly}</p>
      </div>
    </div>
  )
}
