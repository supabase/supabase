import { NewProjectPrice } from './RestoreToNewProject.utils'

export const AdditionalMonthlySpend = ({
  additionalMonthlySpend,
}: {
  additionalMonthlySpend: NewProjectPrice
}) => {
  return (
    <div className="text-sm text-foreground-lighter border-t p-5">
      <p>
        The new project will have the same compute size and disk size as this project. You will be
        able to update the compute size and disk size after the new project is created in{' '}
        <span className="font-mono text-xs tracking-tighter text-foreground-light">
          Project Settings &gt; Compute and Disk
        </span>
      </p>
      <div className="flex flex-col gap-2 text-foreground mt-4">
        <div className="flex justify-between">
          <p>Additional Monthly Compute</p>
          <p className="font-mono text-right text-light">${additionalMonthlySpend.computePrice}</p>
        </div>
        <div className="flex justify-between">
          <p>Additional Monthly Disk</p>
          <p className="font-mono text-right text-light">${additionalMonthlySpend.diskPrice}</p>
        </div>
        <div className="flex justify-between border-t pt-2">
          <p>Total</p>
          <p className="font-mono text-right text-brand">
            ${additionalMonthlySpend.computePrice + additionalMonthlySpend.diskPrice}
          </p>
        </div>
      </div>
    </div>
  )
}
