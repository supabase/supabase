import React, { useEffect, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import dynamic from 'next/dynamic'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'
import { Accordion, Button, IconArrowUpRight, IconCheck, Select, cn } from 'ui'
import { ArrowDownIcon, InformationCircleIcon } from '@heroicons/react/outline'

import CTABanner from '~/components/CTABanner'
import ComputePricingModal from '~/components/Pricing/ComputePricingModal'
import DefaultLayout from '~/components/Layouts/Default'
import PricingAddons from '~/components/Pricing/PricingAddons'
import { PricingTableRowDesktop, PricingTableRowMobile } from '~/components/Pricing/PricingTableRow'

import Solutions from '~/data/Solutions'
import pricingFaq from '~/data/PricingFAQ.json'
import { pricing } from 'shared-data/pricing'
import { plans } from 'shared-data/plans'

const CostControlAnimation = dynamic(() => import('~/components/Pricing/CostControlAnimation'))

export default function IndexPage() {
  const router = useRouter()
  const { asPath } = useRouter()
  const [showComputeModal, setShowComputeModal] = useState(false)
  const [activeMobilePlan, setActiveMobilePlan] = useState('Free')
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
  })

  const meta_title = 'Pricing & fees | Supabase'
  const meta_description =
    'Explore Supabase fees and pricing information. Find our competitive pricing plans, with no hidden pricing. We have a generous free plan for those getting started, and Pay As You Go for those scaling up.'

  // Ability to scroll into pricing sections like storage
  useEffect(() => {
    /**
     * As we render a mobile and a desktop row for each item and just display based on screen size, we cannot navigate by simple id hash
     * on both mobile and desktop. To handle both cases, we actually need to check screen size
     */

    const hash = asPath.split('#')[1]
    if (!hash) return

    let device = 'desktop'
    if (window.matchMedia('screen and (max-width: 1024px)').matches) {
      device = 'mobile'
    }

    const element = document.querySelector(`#${hash}-${device}`)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }
  }, [asPath])

  if (!mounted) return null

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
    return (
      <div className="mt-8 px-4 mobile-header">
        <h2 className="text-brand text-3xl font-medium uppercase font-mono">{plan}</h2>
        <div className="flex items-baseline gap-2">
          {from && <span className="text-foreground text-base">From</span>}
          {showDollarSign ? (
            <span className="h1">
              {plan !== 'Enterprise' ? '$' : ''}
              {price}
            </span>
          ) : (
            <span className="text-foreground-light">{price}</span>
          )}

          <p className="p">{priceDescription}</p>
        </div>
        <p className="p">{description}</p>
        <Button asChild size="medium" block>
          <Link href="https://supabase.com/dashboard/new">Get started</Link>
        </Button>
      </div>
    )
  }

  return (
    <DefaultLayout>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/${router.pathname}`,
          images: [
            {
              url: `https://supabase.com/images/og/og-image-v2.jpg`,
            },
          ],
        }}
      />

      <div>
        <div className="relative z-10 py-8 xl:py-16 2xl:py-20">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl space-y-2 lg:max-w-none">
              <p className="text-brand text-base">Pricing</p>
              <h1 className="h1">
                Predictable pricing,
                <br className="block lg:hidden" /> designed to scale
              </h1>
              <p className="p text-lg leading-5">
                Start building for free, collaborate with a team, then scale to millions of users.
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto lg:container lg:px-16 xl:px-12 flex flex-col">
          <div className="relative z-10 mx-auto w-full px-4 sm:px-6 lg:px-8">
            <div className="mx-auto max-w-md grid lg:max-w-none lg:grid-cols-2 xl:grid-cols-4 gap-4 xl:gap-0">
              {plans.map((plan) => {
                const isPromoPlan = plan.name === 'Pro'

                return (
                  <div
                    key={`row-${plan.name}`}
                    className={cn(
                      'flex flex-col border border-r-0 last:border-r bg-surface-100 rounded-xl xl:rounded-none first:rounded-l-xl last:rounded-r-xl',
                      isPromoPlan ? 'border-brand border-2 !rounded-xl xl:-my-8' : ''
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
                        <a href={plan.href}>{plan.cta}</a>
                      </Button>

                      <div
                        className={cn(
                          'text-foreground flex items-baseline text-5xl font-normal lg:text-4xl xl:text-4xl border-b border-default min-h-[155px]',
                          plan.priceLabel ? 'pt-6' : 'pt-10'
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
                                    plan.name !== 'Enterprise' ? 'text-4xl' : 'text-4xl'
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
                                <div className="-mt-2">
                                  <span
                                    data-tip={plan.warningTooltip}
                                    className={cn(
                                      'bg-brand-500 text-brand-600 rounded-md bg-opacity-30 py-0.5 px-2 text-[13px] leading-4 inline-flex gap-1 items-center',
                                      plan.warningTooltip && 'hover:cursor-pointer'
                                    )}
                                  >
                                    {plan.warningTooltip && (
                                      <InformationCircleIcon className="w-3 h-3" />
                                    )}
                                    {plan.warning}
                                  </span>
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
                        <p className="text-foreground-lighter text-[13px] mt-2 mb-4">
                          {plan.preface}
                        </p>
                      )}
                      <ul role="list" className="text-[13px] flex-1 text-foreground-lighter">
                        {plan.features.map((feature) => (
                          <li
                            key={typeof feature === 'string' ? feature : feature[0]}
                            className="flex flex-col py-2 first:mt-0"
                          >
                            <div className="flex items-center">
                              <div className="flex w-6">
                                <IconCheck
                                  className="text-brand h-4 w-4"
                                  aria-hidden="true"
                                  strokeWidth={3}
                                />
                              </div>
                              <span className="text-foreground mb-0">
                                {typeof feature === 'string' ? feature : feature[0]}
                              </span>
                            </div>
                            {typeof feature !== 'string' && (
                              <p className="ml-6 text-foreground-lighter">
                                {feature[1]} {isPromoPlan && ' *'}
                              </p>
                            )}
                          </li>
                        ))}
                      </ul>

                      <div className="flex flex-col gap-6 mt-auto prose">
                        <div className="space-y-2 mt-12">
                          {plan.footer && (
                            <p className="text-[13px] leading-5 text-foreground-lighter whitespace-pre-wrap mb-0">
                              {isPromoPlan && '* '}
                              {plan.footer}
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

        <div className="text-center mt-10 xl:mt-16 mx-auto max-w-lg flex flex-col gap-8">
          <p className="text-foreground-lighter">
            <strong className="font-normal text-foreground">Usage-based billing</strong> ensures you
            pay only for the resources you consume, making it a cost-effective choice for projects
            of all sizes.
          </p>
          <div className="flex justify-center gap-2">
            <a href="#compare-plans">
              <Button size="tiny" type="secondary" iconRight={<ArrowDownIcon className="w-3" />}>
                Compare Plans
              </Button>
            </a>
            <Button
              size="tiny"
              type="default"
              asChild
              iconRight={<IconArrowUpRight className="w-4" />}
            >
              <a href="/docs/guides/platform/org-based-billing" target="_blank">
                Learn how billing works
              </a>
            </Button>
          </div>
        </div>
      </div>

      <div
        id="addons"
        className="sm:py-18 container relative mx-auto px-4 py-16 shadow-sm md:py-24 lg:px-12 lg:pt-32 lg:pb-12"
      >
        <PricingAddons setShowComputeModal={setShowComputeModal} />

        <div
          id="cost-control"
          className="grid lg:grid-cols-2 gap-8 items-center mt-12 lg:mt-8 max-w-6xl mx-auto"
        >
          <div className="lg:py-12">
            <span className="bg-brand-400 text-brand-600 rounded-md bg-opacity-30 inline-block py-0.5 px-2 text-[13px] leading-4 mt-2">
              Available for Pro plan
            </span>
            <h2 className="text-foreground text-4xl mt-4">Predictable cost control</h2>
            <p className="mt-2 mb-4 prose lg:max-w-lg">
              The Pro plan has a spend cap enabled by default to keep costs under control. If you
              expect a usage spike and need to go beyond the plan limits, simply switch off the
              spend cap to pay for additional resources.
            </p>
            <Button asChild size="tiny" type="default">
              <Link href="/docs/guides/platform/spend-cap" target="_blank">
                Learn about Cost Control
              </Link>
            </Button>
          </div>
          <div className="relative h-full min-h-[14rem] flex items-center justify-end">
            <CostControlAnimation className="w-full lg:max-w-md aspect-video" />
          </div>
        </div>
      </div>

      <div className="bg-background">
        <div className="sm:py-18 container relative mx-auto px-4 py-16 md:py-24 lg:px-16 lg:py-24 xl:px-20">
          <div className="sm:mb-18 mb-16 md:mb-24 lg:mb-24">
            {/* <!-- xs to lg --> */}

            <div className="lg:hidden">
              {/* Free - Mobile  */}
              <div className="bg-slate-200 p-2 sticky top-14 z-10 pt-4">
                <div className="bg-slate-300 rounded-lg border border-slate-500 py-2 px-4 flex justify-between items-center">
                  <label className="text-foreground-lighter">Change plan</label>
                  <Select
                    id="change-plan"
                    name="Change plan"
                    layout="vertical"
                    value={activeMobilePlan}
                    className="min-w-[120px] bg-slate-400 text-red-500"
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
                    description={
                      'Designated support team, account manager and technical specialist'
                    }
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
                      <div
                        className="h-0.25 absolute bottom-0 left-0 w-full"
                        style={{ height: '1px' }}
                      ></div>
                    </th>

                    {plans.map((plan) => (
                      <th
                        className="text-foreground w-1/4 px-0 text-left text-sm font-normal"
                        scope="col"
                        key={plan.name}
                      >
                        <div className="flex flex-col px-6 pr-2 pt-2 gap-1.5">
                          <div className="flex flex-col xl:flex-row xl:items-end gap-1">
                            <h3 className="text-lg xl:text-xl 2xl:text-2xl leading-5 font-mono font-normal flex items-center">
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
                          </div>
                          <div className="flex flex-col justify-between h-full pb-2">
                            <Button
                              asChild
                              size="tiny"
                              type={plan.name === 'Enterprise' ? 'default' : 'primary'}
                              block
                            >
                              <Link href={plan.href} as={plan.href}>
                                {plan.cta}
                              </Link>
                            </Button>
                          </div>
                        </div>
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
                <tfoot>
                  <tr className="border-default border-t">
                    <th className="sr-only" scope="row">
                      Choose your plan
                    </th>

                    <td className="px-6 pt-5">
                      <Button asChild size="tiny" type="primary" block>
                        <Link
                          href="https://supabase.com/dashboard/new?plan=free"
                          as="https://supabase.com/dashboard/new?plan=free"
                        >
                          Get Started
                        </Link>
                      </Button>
                    </td>

                    <td className="px-6 pt-5">
                      <Button asChild size="tiny" type="primary" block>
                        <Link
                          href="https://supabase.com/dashboard/new?plan=pro"
                          as="https://supabase.com/dashboard/new?plan=pro"
                        >
                          Get Started
                        </Link>
                      </Button>
                    </td>

                    <td className="px-6 pt-5">
                      <Button asChild size="tiny" type="primary" block>
                        <Link href="https://supabase.com/dashboard/new?plan=team">Get Started</Link>
                      </Button>
                    </td>

                    <td className="px-6 pt-5">
                      <Button asChild size="tiny" type="default" block>
                        <Link href="https://forms.supabase.com/enterprise">Contact Us</Link>
                      </Button>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
        <div id="faq" className="border-t">
          <div className="mx-auto max-w-5xl gap-y-10 gap-x-10 lg:grid-cols-2">
            <div className="sm:py-18 mx-auto px-6 py-16 md:py-24 lg:px-16 lg:py-24 xl:px-20">
              <h2 className="h3 text-center">Frequently asked questions</h2>
              <div className="my-16">
                <Accordion
                  type="default"
                  openBehaviour="multiple"
                  chevronAlign="right"
                  justified
                  size="medium"
                  className="text-foreground-light"
                >
                  {pricingFaq.map((faq, i) => {
                    return (
                      <div className="border-b py-2" key={i}>
                        <Accordion.Item
                          header={<span className="text-foreground">{faq.question}</span>}
                          id={`faq--${i.toString()}`}
                        >
                          <ReactMarkdown className="text-foreground-lighter prose">
                            {faq.answer}
                          </ReactMarkdown>
                        </Accordion.Item>
                      </div>
                    )
                  })}
                </Accordion>
              </div>
              <p className="p text-center">
                Can&apos;t find the answer to your question?{' '}
                <a
                  target="_blank"
                  href="https://supabase.com/dashboard/support/new"
                  className="transition underline text-brand-link hover:text-brand-600"
                >
                  Open a support ticket
                </a>{' '}
                to receive help from our team of experts.
              </p>
              <p className="p text-center">
                For enterprise enquries,{' '}
                <a
                  target="_blank"
                  href="https://supabase.com/dashboard/support/new"
                  className="transition underline text-brand-link hover:text-brand-600"
                >
                  you can contact the team here
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      </div>
      <CTABanner />
      <ComputePricingModal
        showComputeModal={showComputeModal}
        setShowComputeModal={setShowComputeModal}
      />
    </DefaultLayout>
  )
}
