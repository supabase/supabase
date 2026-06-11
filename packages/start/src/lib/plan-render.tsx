import { Fragment } from 'react'

/** Renders the plan, tinting markdown heading lines with the brand color. */
export function renderPlan(plan: string) {
  return plan.split('\n').map((line, i) => {
    const isHeading = line.startsWith('#')
    return (
      <Fragment key={i}>
        <span className={isHeading ? 'font-semibold text-brand-600' : undefined}>{line}</span>
        {'\n'}
      </Fragment>
    )
  })
}
