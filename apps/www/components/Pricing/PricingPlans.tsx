import React, { FC } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button, cn, IconCheck } from 'ui'
import Telemetry, { TelemetryEvent } from '~/lib/telemetry'
import { useTelemetryProps } from 'common/hooks/useTelemetryProps'

import gaEvents from '~/lib/gaEvents'
import { pickFeatures, pickFooter, plans } from 'shared-data/plans'

const PricingPlans: FC = () => {
  const router = useRouter()
  const telemetryProps = useTelemetryProps()

  const sendTelemetryEvent = async (event: TelemetryEvent) => {
    await Telemetry.sendEvent(event, telemetryProps, router)
  }

  return (
    <div className="mx-auto lg:container lg:px-16 xl:px-12 flex flex-col">
      <div className="relative z-10 mx-auto w-full px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-md grid lg:max-w-none lg:grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-0">
          {plans.map((plan) => {
            const isPromoPlan = plan.name === 'Pro'
            const isTeamPlan = plan.name === 'Team'
            const features = pickFeatures(plan)
            const footer = pickFooter(plan)

            return (
              <div
                key={`row-${plan.name}`}
                className={cn(
                  'flex flex-col border xl:border-r-0 last:border-r bg-surface-100 rounded-xl xl:rounded-none first:rounded-l-xl last:rounded-r-xl',
                  isPromoPlan && 'border-brand !border-2 !rounded-xl xl:-my-8',
                  isTeamPlan && 'xl:border-l-0'
                )}
              >
                <div
                  className={cn(
                    'px-8 xl:px-4 2xl:px-8 pt-6',
                    isPromoPlan ? 'rounded-tr-[9px] rounded-tl-[9px]' : ''
                  )}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2 pb-2">
                      <h3 className="text-2xl font-normal uppercase flex items-center gap-4 font-mono">
                        {plan.name}
                      </h3>
                      {plan.nameBadge && (
                        <span className="bg-brand-500 text-brand-600 rounded-md bg-opacity-30 py-0.5 px-2 text-[13px] leading-4 inline-flex gap-1 items-center">
                          {plan.nameBadge}
                        </span>
                      )}
                    </div>
                  </div>
                  <p
                    className={cn(
                      'text-foreground-light mb-4 text-sm 2xl:pr-4',
                      isPromoPlan && 'xl:mb-12'
                    )}
                  >
                    {plan.description}
                  </p>
                  <Button
                    block
                    size="small"
                    type={plan.name === 'Enterprise' ? 'default' : 'primary'}
                    asChild
                  >
                    <Link
                      href={plan.href}
                      onClick={() =>
                        sendTelemetryEvent(
                          gaEvents[`www_pricing_hero_plan_${plan.name.toLowerCase()}`]
                        )
                      }
                    >
                      {plan.cta}
                    </Link>
                  </Button>

                  <div
                    className={cn(
                      'text-foreground flex items-baseline text-5xl font-normal lg:text-4xl xl:text-4xl border-b border-default lg:min-h-[175px]',
                      plan.priceLabel ? 'py-6 lg:pb-0 pt-6' : 'py-8 lg:pb-0 lg:pt-10'
                    )}
                  >
                    <div className="flex flex-col gap-1">
                      <div className="flex items-end gap-2">
                        <div>
                          {plan.priceLabel && (
                            <p className="text-foreground-lighter ml-1 text-[13px] leading-4 font-normal">
                              {plan.priceLabel}
                            </p>
                          )}

                          <div className="flex items-end">
                            <p
                              className={`mt-2 pb-1 font-mono ${
                                plan.name !== 'Enterprise' ? 'text-5xl' : 'text-4xl'
                              }`}
                            >
                              {plan.name !== 'Enterprise' ? '$' : ''}
                              {plan.priceMonthly}
                            </p>
                            <p className="text-foreground-lighter mb-1.5 ml-1 text-[13px] leading-4">
                              {plan.costUnit}
                            </p>
                          </div>

                          {plan.warning && (
                            <div className="mt-4 flex flex-col gap-1">
                              <span
                                className={cn(
                                  'text-[13px] leading-4 inline-flex gap-1 items-center'
                                )}
                              >
                                {plan.warning}
                              </span>
                              {(plan.name === 'Pro' || plan.name === 'Team') && (
                                <Link
                                  href="#addon-compute"
                                  className="hover:underline text-foreground-lighter text-[13px] m-0 p-0 leading-3"
                                >
                                  Need more compute?
                                </Link>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div
                  className={cn(
                    'border-default flex rounded-bl-[4px] rounded-br-[4px] flex-1 flex-col px-8 xl:px-4 2xl:px-8 py-6',
                    isPromoPlan && 'mb-0.5 rounded-bl-[4px] rounded-br-[4px]'
                  )}
                >
                  {plan.preface && (
                    <p className="text-foreground-lighter text-[13px] mt-2 mb-4">{plan.preface}</p>
                  )}
                  <ul className="text-[13px] flex-1 text-foreground-lighter">
                    {features.map((feature) => (
                      <li
                        key={typeof feature === 'string' ? feature : feature[0]}
                        className="flex flex-col py-2 first:mt-0"
                      >
                        <div className="flex items-center">
                          <div className="flex w-6">
                            <IconCheck
                              className={cn(
                                'h-4 w-4',
                                plan.name === 'Enterprise' ? 'text-foreground' : 'text-brand'
                              )}
                              aria-hidden="true"
                              strokeWidth={3}
                            />
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

                  <div className="flex flex-col gap-6 mt-auto prose">
                    <div className="space-y-2 mt-12">
                      {footer && (
                        <p className="text-[13px] leading-5 text-foreground-lighter whitespace-pre-wrap mb-0">
                          {footer}
                        </p>
                      )}
                    </div>
                  </div>
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
