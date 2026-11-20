import { Tooltip, TooltipContent, TooltipTrigger } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

import { NewProjectPrice } from './RestoreToNewProject.utils'
import { InlineLinkClassName } from '@/components/ui/InlineLink'
import { useSelectedOrganizationQuery } from '@/hooks/misc/useSelectedOrganization'
import { useSelectedProjectQuery } from '@/hooks/misc/useSelectedProject'
import { getComputeSizeLabel } from '@/lib/compute-labels'

export const AdditionalMonthlySpend = ({
  additionalMonthlySpend,
}: {
  additionalMonthlySpend: NewProjectPrice
}) => {
  const { data: project } = useSelectedProjectQuery()
  const { data: organization } = useSelectedOrganizationQuery()
  const isSpendCapEnabled = organization?.usage_billing_enabled === false
  const computeLabel = getComputeSizeLabel(project?.infra_compute_size)

  return (
    <div className="text-sm text-foreground-light border-t p-5">
      <div className="flex flex-col gap-y-2">
        <p>
          The new project will start with the same{' '}
          <Tooltip>
            <TooltipTrigger className={InlineLinkClassName}>compute size</TooltipTrigger>
            <TooltipContent side="bottom">{computeLabel}</TooltipContent>
          </Tooltip>{' '}
          as your current project, but the disk size will be increased to 1.5× to ensure the restore
          completes successfully.
        </p>

        <p>
          You will be able to update the compute size and disk size after the new project is created
          in <span className="text-foreground-light">Project Settings &gt; Infrastructure</span>.
        </p>

        {isSpendCapEnabled && (
          <Admonition type="note" title="Disk usage warning expected">
            <p className="leading-normal!">
              Your new project's disk size will exceed the limit allowed with Spend Cap enabled. The
              restore will still complete, but you'll see an exceeding usage warning until you
              disable Spend Cap.
            </p>
          </Admonition>
        )}
      </div>

      <div className="flex flex-col gap-2 text-foreground mt-4">
        <div className="flex justify-between">
          <p>Additional Monthly Compute</p>
          <p className="font-mono text-right text-light">${additionalMonthlySpend.computePrice}</p>
        </div>
        <div className="flex justify-between">
          <p>Additional Monthly Disk</p>
          <p className="font-mono text-right text-light">${additionalMonthlySpend.diskPrice}</p>
        </div>
        <div className="flex justify-between border-t pt-3">
          <p>Total</p>
          <p className="font-mono text-right text-primary">
            ${additionalMonthlySpend.computePrice + additionalMonthlySpend.diskPrice}
          </p>
        </div>
      </div>
    </div>
  )
}
