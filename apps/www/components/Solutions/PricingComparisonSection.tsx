import { Check, Minus } from 'lucide-react'
import React, { type FC, type ReactNode } from 'react'
import { cn } from 'ui'
import { TextLink } from 'ui-patterns/TextLink'

import SectionContainer from '@/components/Layouts/SectionContainer'

export interface PricingComparisonPlan {
  name: string
  /** Highlights the column visually (eg. the recommended plan). */
  highlight?: boolean
}

export interface PricingComparisonRow {
  feature: ReactNode
  /** One value per plan, in the same order as `plans`. Booleans render as a check or dash. */
  values: (ReactNode | boolean)[]
}

export interface PricingComparisonSectionProps {
  id?: string
  heading: ReactNode
  subheading?: ReactNode
  plans: PricingComparisonPlan[]
  rows: PricingComparisonRow[]
  cta?: {
    label: string
    url: string
  }
  className?: string
}

const PlanValue = ({ value }: { value: ReactNode | boolean }) => {
  if (value === true) {
    return <Check className="w-4 h-4 text-brand" strokeWidth={2} aria-label="Included" />
  }
  if (value === false) {
    return (
      <Minus className="w-4 h-4 text-foreground-muted" strokeWidth={2} aria-label="Not included" />
    )
  }
  return <span className="text-sm text-foreground">{value}</span>
}

const PricingComparisonSection: FC<PricingComparisonSectionProps> = ({
  id,
  heading,
  subheading,
  plans,
  rows,
  cta,
  className,
}) => {
  return (
    <SectionContainer id={id} className={cn('flex flex-col gap-8 py-16 md:py-24', className)}>
      <div className="flex flex-col gap-2 max-w-xl">
        <h2 className="h2 text-foreground-lighter m-0!">{heading}</h2>
        {subheading && <p className="text-foreground-lighter">{subheading}</p>}
      </div>

      <div className="w-full overflow-x-auto border border-default rounded-lg bg-surface-75">
        <table className="w-full min-w-[480px] border-collapse text-left">
          <thead>
            <tr className="border-b border-default">
              <th
                scope="col"
                className="py-4 px-4 md:px-6 text-sm font-normal text-foreground-light"
              >
                What you get
              </th>
              {plans.map((plan) => (
                <th
                  key={plan.name}
                  scope="col"
                  className={cn(
                    'py-4 px-4 md:px-6 text-sm font-medium text-center',
                    plan.highlight ? 'text-foreground bg-surface-100' : 'text-foreground'
                  )}
                >
                  {plan.name}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, rowIndex) => (
              <tr
                key={rowIndex}
                className="border-b border-default last:border-b-0 hover:bg-surface-100/50 transition-colors"
              >
                <th
                  scope="row"
                  className="py-3 px-4 md:px-6 text-sm font-normal text-foreground-light"
                >
                  {row.feature}
                </th>
                {row.values.map((value, valueIndex) => (
                  <td
                    key={valueIndex}
                    className={cn(
                      'py-3 px-4 md:px-6 text-center',
                      plans[valueIndex]?.highlight && 'bg-surface-100'
                    )}
                  >
                    <span className="flex items-center justify-center">
                      <PlanValue value={value} />
                    </span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {cta && <TextLink hasChevron label={cta.label} url={cta.url} className="mt-2" />}
    </SectionContainer>
  )
}

export default PricingComparisonSection
