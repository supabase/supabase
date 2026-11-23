import { isArray } from 'lodash'
import type { ReactNode } from 'react'
import type { PricingInformation } from 'shared-data'
import { cn } from 'ui'

import { PlanCheckIcon } from './PlanIcons'

export interface PlanColumnProps {
  plan: PricingInformation
  price: ReactNode
  cta: ReactNode
  isCurrentPlan: boolean
  liftedSide?: 'left' | 'right'
  className?: string
}

/**
 * Subheadlines for the plans someone can upgrade to, written for a customer deciding
 * whether to pay rather than for the marketing pricing page. Plans without an entry fall
 * back to the shared `plan.description`, which `shared-data` also gives the pricing page.
 */
const PLAN_BENEFIT_HEADLINES: Partial<Record<PricingInformation['id'], string>> = {
  tier_pro: 'More compute, daily backups, no pausing, and email support whenever you need it.',
  tier_team: 'Compliance, access controls, and priority support for teams shipping to production.',
}

export const PlanColumn = ({
  plan,
  price,
  cta,
  isCurrentPlan,
  liftedSide,
  className,
}: PlanColumnProps) => {
  const hasPopularBadge = !isCurrentPlan && !!plan.nameBadge

  return (
    <div
      className={cn(
        'flex flex-col md:row-span-2 md:grid md:grid-rows-subgrid md:gap-y-0',
        'border rounded-xl col-span-12 md:col-span-6 xl:col-span-3',
        'xl:border-r-0 xl:rounded-none',
        plan.id === 'tier_free' && 'xl:rounded-l-xl',
        plan.id === 'tier_enterprise' && 'xl:border-r xl:rounded-r-xl',
        isCurrentPlan
          ? 'relative z-10 bg-surface-300 codeblock-drop-shadow xl:border! xl:rounded-xl! xl:-m-1'
          : 'bg-background dark:bg-surface-75',
        liftedSide === 'right' &&
          'xl:relative xl:before:absolute xl:before:-top-px xl:before:left-full xl:before:size-4 xl:before:border-t xl:before:bg-background dark:xl:before:bg-surface-75 xl:after:absolute xl:after:-bottom-px xl:after:left-full xl:after:size-4 xl:after:border-b xl:after:bg-background dark:xl:after:bg-surface-75',
        liftedSide === 'left' &&
          'xl:relative xl:border-l-0 xl:before:absolute xl:before:-top-px xl:before:right-full xl:before:size-4 xl:before:border-t xl:before:bg-background dark:xl:before:bg-surface-75 xl:after:absolute xl:after:-bottom-px xl:after:right-full xl:after:size-4 xl:after:border-b xl:after:bg-background dark:xl:after:bg-surface-75',
        className
      )}
    >
      <div
        className={cn(
          'flex flex-col px-6 pt-6',
          isCurrentPlan && 'xl:pt-7',
          liftedSide === 'right' && 'xl:pr-7',
          liftedSide === 'left' && 'xl:pl-7'
        )}
      >
        <div className="flex items-center justify-between gap-2 pb-2">
          <h3 className="text-foreground text-2xl font-medium font-mono">{plan.name}</h3>
          {isCurrentPlan ? (
            <span className="control-surface-shadows inline-flex h-6 items-center rounded-md px-2.5 shadow-(--button-shadow-default) whitespace-nowrap text-xs leading-4 font-medium text-foreground-light">
              Current plan
            </span>
          ) : null}
          {hasPopularBadge ? (
            <span className="control-surface-shadows inline-flex h-6 items-center rounded-md bg-primary/5 px-2.5 shadow-(--button-shadow-default)">
              <span className="shimmer [--shimmer-color:oklch(from_currentColor_calc(l_-_0.2)_c_h)] dark:[--shimmer-color:initial] whitespace-nowrap text-xs leading-4 font-medium text-primary motion-reduce:animate-none">
                {plan.nameBadge}
              </span>
            </span>
          ) : null}
        </div>

        <p className="text-foreground-light text-sm mb-6 md:min-h-[3lh]">
          {PLAN_BENEFIT_HEADLINES[plan.id] ?? plan.description}
        </p>

        <div className="mb-6">
          <p className="text-foreground-lighter text-sm leading-4 min-h-lh">{plan.priceLabel}</p>
          <div className="flex items-baseline mt-2 min-h-12">
            {price}
            <p className="text-foreground-lighter ml-1 text-sm leading-4">{plan.costUnit}</p>
          </div>
        </div>

        {cta}

        {plan.footer ? (
          <p className="mt-4 recessed-surface rounded-lg px-3 py-2.5 text-sm leading-5 text-foreground-light whitespace-pre-wrap text-pretty">
            {plan.footer}
          </p>
        ) : null}

        <div aria-hidden="true" className="mt-auto pt-6">
          <div className="h-0.5 groove" />
        </div>
      </div>

      <div
        className={cn(
          'flex flex-1 flex-col px-6 py-6',
          isCurrentPlan && 'xl:pb-7',
          liftedSide === 'right' && 'xl:pr-7',
          liftedSide === 'left' && 'xl:pl-7'
        )}
      >
        <p className="text-foreground-lighter text-sm mt-2 mb-4">{plan.preface}</p>
        <ul className="text-sm flex-1 text-foreground-lighter">
          {plan.features.map((feature) => (
            <li
              key={typeof feature === 'string' ? feature : feature[0]}
              className="flex flex-col py-2 first:mt-0"
            >
              <div className="flex items-start">
                <div className="flex h-lh w-6 shrink-0 items-center">
                  <PlanCheckIcon className="size-5 -ml-0.5" />
                </div>
                <span className="text-foreground">
                  {typeof feature === 'string' ? feature : feature[0]}
                </span>
              </div>
              {typeof feature !== 'string' && isArray(feature) ? (
                <p className="ml-6 text-foreground-lighter">{feature[1]}</p>
              ) : null}
            </li>
          ))}
        </ul>
      </div>
    </div>
  )
}
