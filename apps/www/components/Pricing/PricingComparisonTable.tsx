import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Button, Select, cn } from 'ui'
import { PricingTableRowDesktop, PricingTableRowMobile } from '~/components/Pricing/PricingTableRow'
import Telemetry, { TelemetryEvent } from '~/lib/telemetry'
import { useTelemetryProps } from 'common/hooks/useTelemetryProps'

import gaEvents from '~/lib/gaEvents'
import Solutions from '~/data/Solutions'
import { pricing } from 'shared-data/pricing'
import { plans } from 'shared-data/plans'

const PricingComparisonTable = () => {
  const router = useRouter()
  const telemetryProps = useTelemetryProps()
  const [activeMobilePlan, setActiveMobilePlan] = useState('Free')

  const sendTelemetryEvent = async (event: TelemetryEvent) => {
    await Telemetry.sendEvent(event, telemetryProps, router)
  }

  const MobileHeader = ({
    description,
    priceDescription,
    price,
    plan,
    showDollarSign = true,
    from = false,
  }: {
    description: string
    priceDescription: string
    price: string
    plan: string
    showDollarSign?: boolean
    from?: boolean
  }) => {
    const selectedPlan = plans.find((p) => p.name === plan)!

    return (
      <div className="mt-8 px-4 mobile-header">
        <h2 className="text-foreground text-3xl font-medium uppercase font-mono">{plan}</h2>
        <div className="flex items-baseline gap-2">
          {from && <span className="text-foreground text-base">From</span>}
          {showDollarSign ? (
            <span className="h1 font-mono">
              {plan !== 'Enterprise' ? '$' : ''}
              {price}
            </span>
          ) : (
            <span className="text-foreground-light">{price}</span>
          )}

          <p className="p">{priceDescription}</p>
        </div>
        <p className="p">{description}</p>
        <Button asChild size="medium" type={plan === 'Enterprise' ? 'default' : 'primary'} block>
          <Link
            href={selectedPlan.href}
            onClick={() =>
              sendTelemetryEvent(gaEvents[`www_pricing_comparison_${plan.toLowerCase()}_mobile`])
            }
          >
            {selectedPlan.cta}
          </Link>
        </Button>
      </div>
    )
  }

  return (
    <div
      id="compare-plans"
      className="sm:pb-18 container relative mx-auto px-4 pb-16 md:pb-16 lg:px-16 xl:px-20"
    >
      {/* <!-- xs to lg --> */}
      <div className="lg:hidden">
        {/* Free - Mobile  */}
        <div className="bg-background p-2 sticky top-14 z-10 pt-4">
          <div className="bg-surface-100 rounded-lg border py-2 px-4 flex justify-between items-center">
            <label className="text-foreground-lighter">Change plan</label>
            <Select
              id="change-plan"
              name="Change plan"
              layout="vertical"
              value={activeMobilePlan}
              className="min-w-[120px]"
              onChange={(e) => setActiveMobilePlan(e.target.value)}
            >
              <Select.Option value="Free">Free</Select.Option>
              <Select.Option value="Pro">Pro</Select.Option>
              <Select.Option value="Team">Team</Select.Option>
              <Select.Option value="Enterprise">Enterprise</Select.Option>
            </Select>
          </div>
        </div>
        {activeMobilePlan === 'Free' && (
          <>
            <MobileHeader
              plan="Free"
              price={'0'}
              priceDescription={'/month'}
              description={'Perfect for hobby projects and experiments'}
            />
            <PricingTableRowMobile
              category={pricing.database}
              plan={'free'}
              icon={Solutions['database'].icon}
              sectionId="database"
            />
            <PricingTableRowMobile
              category={pricing.auth}
              plan={'free'}
              icon={Solutions['authentication'].icon}
              sectionId="auth"
            />
            <PricingTableRowMobile
              category={pricing.storage}
              plan={'free'}
              icon={Solutions['storage'].icon}
              sectionId="storage"
            />
            <PricingTableRowMobile
              category={pricing.realtime}
              plan={'free'}
              icon={Solutions['realtime'].icon}
              sectionId="realtime"
            />
            <PricingTableRowMobile
              category={pricing['edge_functions']}
              plan={'free'}
              icon={Solutions['functions'].icon}
              sectionId="edge-functions"
            />
            <PricingTableRowMobile
              category={pricing.dashboard}
              plan={'free'}
              icon={pricing.dashboard.icon}
              sectionId="dashboard"
            />
            <PricingTableRowMobile
              category={pricing.security}
              plan={'free'}
              icon={pricing.security.icon}
              sectionId="security"
            />
            <PricingTableRowMobile
              category={pricing.support}
              plan={'free'}
              icon={pricing.support.icon}
              sectionId="support"
            />
          </>
        )}

        {activeMobilePlan === 'Pro' && (
          <>
            <MobileHeader
              plan="Pro"
              from={false}
              price={'25'}
              priceDescription={'/month + additional use'}
              description={'Everything you need to scale your project into production'}
            />
            <PricingTableRowMobile
              category={pricing.database}
              plan={'pro'}
              icon={Solutions['database'].icon}
            />
            <PricingTableRowMobile
              category={pricing.auth}
              plan={'pro'}
              icon={Solutions['authentication'].icon}
            />
            <PricingTableRowMobile
              category={pricing.storage}
              plan={'pro'}
              icon={Solutions['storage'].icon}
            />
            <PricingTableRowMobile
              category={pricing.realtime}
              plan={'pro'}
              icon={Solutions['realtime'].icon}
            />
            <PricingTableRowMobile
              category={pricing['edge_functions']}
              plan={'pro'}
              icon={Solutions['functions'].icon}
            />
            <PricingTableRowMobile
              category={pricing.dashboard}
              plan={'pro'}
              icon={pricing.dashboard.icon}
            />
            <PricingTableRowMobile
              category={pricing.security}
              plan={'pro'}
              icon={pricing.security.icon}
            />
            <PricingTableRowMobile
              category={pricing.support}
              plan={'pro'}
              icon={pricing.support.icon}
            />
          </>
        )}

        {activeMobilePlan === 'Team' && (
          <>
            <MobileHeader
              plan="Team"
              from={false}
              price={'599'}
              priceDescription={'/month + additional use'}
              description={'Collaborate with different permissions and access patterns'}
            />
            <PricingTableRowMobile
              category={pricing.database}
              plan={'team'}
              icon={Solutions['database'].icon}
            />
            <PricingTableRowMobile
              category={pricing.auth}
              plan={'team'}
              icon={Solutions['authentication'].icon}
            />
            <PricingTableRowMobile
              category={pricing.storage}
              plan={'team'}
              icon={Solutions['storage'].icon}
            />
            <PricingTableRowMobile
              category={pricing.realtime}
              plan={'team'}
              icon={Solutions['realtime'].icon}
            />
            <PricingTableRowMobile
              category={pricing['edge_functions']}
              plan={'team'}
              icon={Solutions['functions'].icon}
            />
            <PricingTableRowMobile
              category={pricing.dashboard}
              plan={'team'}
              icon={pricing.dashboard.icon}
            />
            <PricingTableRowMobile
              category={pricing.security}
              plan={'team'}
              icon={pricing.security.icon}
            />
            <PricingTableRowMobile
              category={pricing.support}
              plan={'team'}
              icon={pricing.support.icon}
            />
          </>
        )}

        {activeMobilePlan === 'Enterprise' && (
          <>
            <MobileHeader
              plan="Enterprise"
              price={'Contact us for a quote'}
              priceDescription={''}
              description={'Designated support team, account manager and technical specialist'}
              showDollarSign={false}
            />
            <PricingTableRowMobile
              category={pricing.database}
              plan={'enterprise'}
              icon={Solutions['database'].icon}
            />
            <PricingTableRowMobile
              category={pricing.auth}
              plan={'enterprise'}
              icon={Solutions['authentication'].icon}
            />
            <PricingTableRowMobile
              category={pricing.storage}
              plan={'enterprise'}
              icon={Solutions['storage'].icon}
            />
            <PricingTableRowMobile
              category={pricing.realtime}
              plan={'enterprise'}
              icon={Solutions['realtime'].icon}
            />
            <PricingTableRowMobile
              category={pricing['edge_functions']}
              plan={'enterprise'}
              icon={Solutions['functions'].icon}
            />
            <PricingTableRowMobile
              category={pricing.dashboard}
              plan={'enterprise'}
              icon={pricing.dashboard.icon}
            />
            <PricingTableRowMobile
              category={pricing.security}
              plan={'enterprise'}
              icon={pricing.security.icon}
            />
            <PricingTableRowMobile
              category={pricing.support}
              plan={'enterprise'}
              icon={pricing.support.icon}
            />
          </>
        )}
      </div>

      {/* <!-- lg+ --> */}
      <div className="hidden lg:block">
        <table className="h-px w-full table-fixed">
          <caption className="sr-only">Pricing plan comparison</caption>
          <thead className="bg-background sticky top-[62px] z-10">
            <tr>
              <th
                className="text-foreground w-1/3 px-6 pt-2 pb-2 text-left text-sm font-normal"
                scope="col"
              >
                <span className="sr-only">Feature by</span>
                <span
                  className="h-0.25 absolute bottom-0 left-0 w-full"
                  style={{ height: '1px' }}
                />
              </th>

              {plans.map((plan) => (
                <th
                  className="text-foreground w-1/4 px-0 text-left text-sm font-normal"
                  scope="col"
                  key={plan.name}
                >
                  <span className="flex flex-col px-6 pr-2 pt-2 gap-1.5">
                    <span className="flex flex-col xl:flex-row xl:items-end gap-1">
                      <h3 className="text-lg xl:text-xl 2xl:text-2xl leading-5 uppercase font-mono font-normal flex items-center">
                        {plan.name}
                      </h3>
                      <p
                        className={cn(
                          'text-foreground-lighter -my-1 xl:m-0',
                          plan.name === 'Enterprise' && 'xl:opacity-0'
                        )}
                      >
                        <span className="text-foreground-lighter font-mono text-xl mr-1 tracking-tighter">
                          {plan.name !== 'Enterprise' && '$'}
                          {plan.priceMonthly}
                        </span>
                        {['Free', 'Pro', 'Team'].includes(plan.name) && (
                          <span className="text-[13px] leading-4 mt-1">{plan.costUnit}</span>
                        )}
                      </p>
                    </span>
                    <span className="flex flex-col justify-between h-full pb-2">
                      <Button
                        asChild
                        size="tiny"
                        type={plan.name === 'Enterprise' ? 'default' : 'primary'}
                        block
                      >
                        <Link
                          href={plan.href}
                          onClick={() =>
                            sendTelemetryEvent(
                              gaEvents[`www_pricing_comparison_${plan.name.toLowerCase()}`]
                            )
                          }
                        >
                          {plan.cta}
                        </Link>
                      </Button>
                    </span>
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="border-default divide-border divide-y first:divide-y-0">
            <PricingTableRowDesktop
              category={pricing.database}
              icon={Solutions['database'].icon}
              sectionId="database"
            />
            <PricingTableRowDesktop
              category={pricing.auth}
              icon={Solutions['authentication'].icon}
              sectionId="auth"
            />
            <PricingTableRowDesktop
              category={pricing.storage}
              icon={Solutions['storage'].icon}
              sectionId="storage"
            />
            <PricingTableRowDesktop
              category={pricing.realtime}
              icon={Solutions['realtime'].icon}
              sectionId="realtime"
            />
            <PricingTableRowDesktop
              category={pricing['edge_functions']}
              icon={Solutions['functions'].icon}
              sectionId="edge-functions"
            />
            <PricingTableRowDesktop
              category={pricing.dashboard}
              icon={pricing.dashboard.icon}
              sectionId="dashboard"
            />
            <PricingTableRowDesktop
              category={pricing.security}
              icon={pricing.security.icon}
              sectionId="security"
            />
            <PricingTableRowDesktop
              category={pricing.support}
              icon={pricing.support.icon}
              sectionId="support"
            />
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default PricingComparisonTable
