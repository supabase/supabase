'use client'

import { Organization } from '~/data/organizations'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import Link from 'next/link'
import { plans } from 'shared-data/plans'
import { Button, cn } from 'ui'

import { Check } from './PricingIcons'
import UpgradePlan from './UpgradePlan'
import { isCrossZoneHref } from '@/lib/cross-zone'

interface PricingPlansProps {
  organizations?: Organization[]
  hasExistingOrganizations?: boolean
}

const PricingPlans = ({ organizations, hasExistingOrganizations }: PricingPlansProps) => {
  const sendTelemetryEvent = useSendTelemetryEvent()
  const orgSlug = organizations?.[0]?.slug

  return (
    <div className="mx-auto lg:container lg:px-16 xl:px-12 flex flex-col">
      <div className="relative z-10 mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md grid lg:max-w-none lg:grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-0">
          {plans.map((plan) => {
            const isProPlan = plan.name === 'Pro'
            const isFreePlan = plan.name === 'Free'
            const isTeamPlan = plan.name === 'Team'
            const isUpgradablePlan = isProPlan || isTeamPlan
            const features = plan.features
            const footer = plan.footer

            const sendPricingEvent = () => {
              sendTelemetryEvent({
                action: 'www_pricing_plan_cta_clicked',
                properties: {
                  plan: plan.name,
                  showUpgradeText: isUpgradablePlan && hasExistingOrganizations ? true : false,
                  section: 'main',
                },
                ...(orgSlug && { groups: { organization: orgSlug } }),
              })
            }

            return (
              <div
                key={`row-${plan.name}`}
                className={cn(
                  'flex flex-col lg:row-span-2 lg:grid lg:grid-rows-subgrid lg:gap-y-0 border xl:border-r-0 last:border-r rounded-xl xl:rounded-none first:rounded-l-xl last:rounded-r-xl',
                  isProPlan &&
                    'relative z-10 border! bg-surface-300 codeblock-drop-shadow rounded-xl! xl:-m-1',
                  !isProPlan && 'bg-background dark:bg-surface-75',
                  isFreePlan &&
                    'xl:relative xl:before:absolute xl:before:-top-px xl:before:left-full xl:before:size-4 xl:before:border-t xl:before:bg-background dark:xl:before:bg-surface-75 xl:after:absolute xl:after:-bottom-px xl:after:left-full xl:after:size-4 xl:after:border-b xl:after:bg-background dark:xl:after:bg-surface-75',
                  isTeamPlan &&
                    'xl:relative xl:border-l-0 xl:before:absolute xl:before:-top-px xl:before:right-full xl:before:size-4 xl:before:border-t xl:before:bg-background dark:xl:before:bg-surface-75 xl:after:absolute xl:after:-bottom-px xl:after:right-full xl:after:size-4 xl:after:border-b xl:after:bg-background dark:xl:after:bg-surface-75'
                )}
              >
                <div
                  className={cn(
                    'flex flex-col px-8 xl:px-6 2xl:px-8 pt-6',
                    isProPlan ? 'rounded-tr-[9px] rounded-tl-[9px] xl:pt-7' : '',
                    isFreePlan && 'xl:pr-7 2xl:pr-9',
                    isTeamPlan && 'xl:pl-7 2xl:pl-9'
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex flex-1 items-center justify-between gap-2 pb-2">
                      <h3 className="text-foreground text-2xl font-medium flex items-center gap-4 font-mono">
                        {plan.name}
                      </h3>
                      {plan.nameBadge && (
                        <span className="control-surface-shadows inline-flex h-6 items-center rounded-md bg-primary/5 px-2.5 shadow-(--button-shadow-default)">
                          <span className="shimmer [--shimmer-color:oklch(from_currentColor_calc(l_-_0.2)_c_h)] dark:[--shimmer-color:initial] whitespace-nowrap text-xs leading-4 font-medium text-primary motion-reduce:animate-none">
                            {plan.nameBadge}
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-foreground-light text-sm 2xl:pr-4 mb-6 lg:min-h-[3lh]">
                    {plan.description}
                  </p>
                  <div className="mb-6">
                    <p
                      className={cn(
                        'text-foreground-lighter text-[13px] leading-4 min-h-lh',
                        !plan.priceLabel && 'max-lg:hidden'
                      )}
                    >
                      {plan.priceLabel}
                    </p>
                    <div className="flex items-baseline mt-2 lg:min-h-12">
                      <p
                        className={cn(
                          'text-foreground font-mono',
                          plan.name !== 'Enterprise' ? 'text-5xl' : 'text-4xl'
                        )}
                        translate="no"
                      >
                        {plan.name !== 'Enterprise' ? '$' : ''}
                        {plan.priceMonthly}
                      </p>
                      <p className="text-foreground-lighter ml-1 text-[13px] leading-4">
                        {plan.costUnit}
                      </p>
                    </div>
                  </div>
                  {isUpgradablePlan && hasExistingOrganizations ? (
                    <UpgradePlan
                      planId={plan.planId}
                      organizations={organizations}
                      onClick={sendPricingEvent}
                    />
                  ) : (
                    <Button block size="large" variant={isProPlan ? 'primary' : 'default'} asChild>
                      {isCrossZoneHref(plan.href) ? (
                        <a href={plan.href} onClick={sendPricingEvent}>
                          {plan.cta}
                        </a>
                      ) : (
                        <Link href={plan.href} onClick={sendPricingEvent}>
                          {plan.cta}
                        </Link>
                      )}
                    </Button>
                  )}
                  {footer || isUpgradablePlan ? (
                    <p className="mt-4 recessed-surface rounded-lg px-3 py-2.5 text-[13px] leading-5 text-foreground-light whitespace-pre-wrap text-pretty">
                      {isUpgradablePlan ? (
                        <span>
                          First project included.
                          <br />
                          Additional from $10/mo.
                          <Link
                            href="#addon-compute"
                            className="block w-fit underline underline-offset-2 hover:text-foreground"
                          >
                            See how pricing scales
                          </Link>
                        </span>
                      ) : (
                        footer
                      )}
                    </p>
                  ) : null}
                  <div aria-hidden="true" className="mt-auto pt-6">
                    <div className="h-0.5 groove" />
                  </div>
                </div>
                <div
                  className={cn(
                    'border-default flex rounded-bl-[4px] rounded-br-[4px] flex-1 flex-col px-8 xl:px-6 2xl:px-8 py-6',
                    isProPlan && 'xl:pb-7',
                    isFreePlan && 'xl:pr-7 2xl:pr-9',
                    isTeamPlan && 'xl:pl-7 2xl:pl-9'
                  )}
                >
                  <p
                    className={cn(
                      'text-foreground-lighter text-[13px] mt-2 mb-4 lg:min-h-lh',
                      !plan.preface && 'max-lg:hidden'
                    )}
                  >
                    {plan.preface}
                  </p>
                  <ul className="text-[13px] flex-1 text-foreground-lighter">
                    {features.map((feature) => (
                      <li
                        key={typeof feature === 'string' ? feature : feature[0]}
                        className="flex flex-col py-2 first:mt-0"
                      >
                        <div className="flex items-start">
                          <div className="flex h-lh w-6 shrink-0 items-center">
                            <Check className="size-5 -ml-0.5" />
                          </div>
                          <span className="text-foreground mb-0">
                            {typeof feature === 'string' ? feature : feature[0]}
                          </span>
                        </div>
                        {typeof feature !== 'string' && (
                          <p className="ml-6 text-foreground-lighter">{feature[1]}</p>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default PricingPlans
