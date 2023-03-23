import { Accordion, Button, IconCheck, Select } from 'ui'
import Solutions from 'data/Solutions.json'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { useState } from 'react'
import ReactMarkdown from 'react-markdown'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import { PricingTableRowDesktop, PricingTableRowMobile } from '~/components/Pricing/PricingTableRow'
import pricing from '~/data/Pricing.json'
import pricingFaq from '~/data/PricingFAQ.json'
import { useTheme } from 'common/Providers'
import ComputePricingModal from '~/components/Pricing/ComputePricingModal'

export default function IndexPage() {
  const router = useRouter()
  const { basePath } = useRouter()
  const { isDarkMode } = useTheme()
  const [showComputeModal, setShowComputeModal] = useState(false)
  const [activeMobileTier, setActiveMobileTier] = useState('Free')

  const meta_title = 'Pricing & fees | Supabase'
  const meta_description =
    'Explore Supabase fees and pricing information. Find our competitive pricing tiers, with no hidden pricing. We have generous free tiers for those getting started, and Pay As You Go for those scaling up.'

  /**
   * @mildtomato same plan metadata is also in /studio dashboard
   * would be good if this constant was shared across apps
   *
   * https://github.com/supabase/supabase/blob/master/www/pages/pricing/index.tsx
   */
  const tiers = [
    {
      name: 'Free',
      nameBadge: '',
      costUnit: 'per month per project',
      href: 'https://app.supabase.com/new/new-project',
      priceLabel: 'Starting from',
      priceMonthly: 0,
      warning: 'Limit of 2 free projects',
      description: 'Perfect for passion projects & simple websites.',
      preface: 'Get started with:',
      features: [
        'Up to 500MB database & 1GB file storage',
        'Up to 2GB bandwidth',
        'Up to 50MB file uploads',
        'Social OAuth providers',
        '50,000 monthly active users',
        'Up to 500K Edge Function invocations',
        '1-day log retention',
        'Community support',
      ],
      scale: 'Free projects are paused after 1 week of inactivity.',

      cta: 'Get Started',
    },
    {
      name: 'Pro',
      nameBadge: '',
      costUnit: 'per month per project',
      href: 'https://app.supabase.com/new/new-project',
      from: true,
      priceLabel: 'Starting from',
      warning: '+ usage',
      priceMonthly: 25,
      description: 'For production applications with the option to scale.',
      features: [
        '8GB database & 100GB file storage',
        '50GB bandwidth',
        '5GB file uploads',
        'Social OAuth providers',
        '100,000 monthly active users',
        '2M Edge Function invocations',
        'Daily backups',
        '7-day log retention',
        'No project pausing',
        'Email support',
      ],
      scale: 'Additional fees apply for usage and storage beyond the limits above.',
      shutdown: '',
      preface: 'Everything in the Free plan, plus:',
      additional: '',
      cta: 'Get Started',
    },
    {
      name: 'Enterprise',
      href: 'https://forms.supabase.com/enterprise',
      description: 'For large-scale applications managing serious workloads.',
      features: [
        `Designated Support manager & SLAs`,
        `Enterprise OAuth providers`,
        `SSO/ SAML`,
        `SOC2`,
        `Custom contracts & invoicing`,
        `On-premise support`,
        `24×7×365 premium enterprise support`,
        `Custom Security questionnaires`,
        `Private Slack channel`,
        `Uptime SLA`,
      ],
      priceLabel: '',
      priceMonthly: 'Contact us',
      preface: 'These apply to all projects within the organization:',
      scale: '',
      shutdown: '',
      cta: 'Contact Us',
    },
  ]

  const addons = [
    {
      name: 'Optimized Compute',
      heroImg: 'addons-compute-hero',
      icon: 'compute-upgrade',
      price: 'Starts from $5',
      description: 'Increase the capability of your database only for what you need.',
      leftCtaText: 'Documentation',
      leftCtaLink: 'https://supabase.com/docs/guides/platform/compute-add-ons',
      rightCtaText: 'See Pricing breakdown',
      rightCtaLink: '#open-modal',
    },
    {
      name: 'Custom Domain',
      heroImg: 'addons-domains-hero',
      icon: 'custom-domain-upgrade',
      price: 'Flat fee $10',
      description:
        'Use your own domain for your Supabase project to present a more polished product to your users.',
      leftCtaText: 'Documentation',
      leftCtaLink: 'https://supabase.com/docs/guides/platform/custom-domains',
      rightCtaText: 'See more',
      rightCtaLink: 'http://',
    },
    {
      name: 'Point in Time Recovery',
      heroImg: 'addons-pitr-hero',
      icon: 'pitr-upgrade',
      price: 'Starts from $100',
      description: 'Roll back to any specific point in time and ensure that data is not lost.',
      leftCtaText: 'Documentation',
      leftCtaLink: 'https://supabase.com/docs/guides/platform/backups',
      rightCtaText: 'See Pricing breakdown',
      rightCtaLink: 'http://',
    },
  ]

  const MobileHeader = ({
    // title,
    description,
    priceDescription,
    price,
    tier,
    showDollarSign = true,
    from = false,
  }: {
    description: string
    priceDescription: string
    price: string
    tier: string
    showDollarSign?: boolean
    from?: boolean
  }) => {
    return (
      <div className="mt-8 px-4 mobile-header">
        <h2 className="gradient-text-brand-500 dark:gradient-text-brand-100 text-3xl font-medium uppercase font-mono">
          {tier}
        </h2>
        <div className="flex items-baseline gap-2">
          {from && <span className="text-scale-1200 text-base">From</span>}
          {showDollarSign ? (
            <span className="h1">${price}</span>
          ) : (
            <span className="text-scale-1100">{price}</span>
          )}

          <p className="p">{priceDescription}</p>
        </div>
        <p className="p">{description}</p>
        <Link href="https://app.supabase.com" passHref>
          <Button as="a" size="medium" block>
            Get started
          </Button>
        </Link>
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
              url: `https://supabase.com/images/og/og-image.jpg`,
            },
          ],
        }}
      />

      <div>
        <div className="relative z-10 py-16 lg:py-28">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl space-y-2 lg:max-w-none">
              <h1 className="text-brand-900 text-base">Pricing</h1>
              <h2 className="h1">Predictable pricing, no surprises</h2>
              <p className="p text-lg">
                Start building for free, collaborate with a team, then scale to millions of users
              </p>
            </div>
          </div>
        </div>

        <div className="mx-auto flex max-w-7xl flex-col">
          {/* <div className="absolute inset-0 shadow-sm bg-scale-200 h-3/5" /> */}

          <div
            className="relative z-10 mx-auto -mt-8 w-full px-4 sm:px-6

            lg:px-8
          "
          >
            <div className="mx-auto max-w-md grid lg:max-w-6xl lg:grid-cols-3 gap-24 lg:gap-5">
              {tiers.map((tier) => (
                <div
                  key={`row-${tier.name}`}
                  className={[
                    tier.name === 'Pro'
                      ? 'bg-brand-1100 dark:bg-brand-900 border px-0.5 -mt-8 rounded-[6px]'
                      : '',
                  ].join(' ')}
                >
                  {tier.name === 'Pro' && (
                    <p className="text-xs text-center py-2 text-white">Most Popular</p>
                  )}
                  <div
                    key={tier.name}
                    className={[
                      'flex flex-col overflow-hidden',
                      tier.name === 'Pro' ? '' : 'border h-full rounded-[4px]',
                    ].join(' ')}
                  >
                    <div
                      className={`dark:bg-scale-300 bg-white px-8 pt-6 rounded-tr-[4px] rounded-tl-[4px] ${
                        tier.name === 'Pro' ? 'rounded-tr-[4px] rounded-tl-[4px]' : ''
                      }`}
                    >
                      <div className="mb-2 flex items-center gap-2">
                        <div className="flex items-center gap-2">
                          <h3
                            className="gradient-text-brand-500 dark:gradient-text-brand-100 text-2xl font-normal
                           uppercase flex items-center gap-4 font-mono"
                          >
                            {tier.name}
                          </h3>
                          {tier.nameBadge && (
                            <span className="bg-scale-300 text-scale-900 dark:bg-scale-400 dark:text-scale-1100 rounded-md bg-opacity-10 py-0.5 px-2 text-xs [background-image: none]">
                              {tier.nameBadge}
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-scale-1100 my-4 h-[55px] text-sm  border-b dark:border-scale-500 pb-4 lg:pr-20">
                        {tier.description}
                      </p>

                      <div
                        className="
                      text-scale-1200 flex items-baseline
                      text-5xl
                      font-normal
                      lg:text-4xl
                      xl:text-4xl
                      border-b
                      dark:border-scale-500
                      pt-4
                      pb-8
                      min-h-[175px]
                      "
                      >
                        <div className="flex flex-col gap-1">
                          <div className="flex items-end gap-2">
                            <div>
                              <p className="text-scale-900 ml-1 text-xs font-normal">
                                {tier.priceLabel}
                              </p>
                              <p
                                className={`mt-2 gradient-text-scale-500 dark:gradient-text-scale-100 pb-1 ${
                                  tier.name !== 'Enterprise' ? 'text-5xl' : 'text-4xl'
                                }`}
                              >
                                {tier.name !== 'Enterprise' && '$'}
                                {tier.priceMonthly}
                              </p>
                              {tier.costUnit && (
                                <p className="text-scale-900 mt-0.5 text-xs">{tier.costUnit}</p>
                              )}

                              {tier.warning && (
                                <p className="-mt-2">
                                  <span className="bg-brand-500 text-brand-1100 rounded-md bg-opacity-30 py-0.5 px-2 text-xs ">
                                    {tier.warning}
                                  </span>
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div
                      className={[
                        `dark:border-scale-400 dark:bg-scale-300 flex h-full rounded-bl-[4px] rounded-br-[4px] flex-1 flex-col bg-white px-8 py-6`,
                        tier.name === 'Pro' ? 'mb-0.5 rounded-bl-[4px] rounded-br-[4px]' : '',
                      ].join(' ')}
                    >
                      {tier.preface && (
                        <p className="text-scale-1100 text-xs mt-2 mb-4">{tier.preface}</p>
                      )}
                      {/* <p className="text-scale-900 text-sm">Included with plan:</p> */}
                      <ul role="list" className="text-xs text-scale-1000">
                        {tier.features.map((feature) => (
                          <li key={feature} className="flex items-center py-2 first:mt-0">
                            <IconCheck
                              className="text-brand-900 h-4 w-4 "
                              aria-hidden="true"
                              strokeWidth={3}
                            />
                            {/* </div> */}
                            <span className="dark:text-scale-1200 mb-0 ml-3 ">{feature}</span>
                          </li>
                        ))}
                      </ul>

                      <div className="flex flex-col gap-6 mt-auto prose">
                        <div className="space-y-2 mt-12">
                          {tier.additional && <p className="text-sm">{tier.additional}</p>}
                          {tier.scale && <p className="text-xs">{tier.scale}</p>}
                          {tier.shutdown && (
                            <p className="text-scale-1000 text-xs">{tier.shutdown}</p>
                          )}
                        </div>
                        <a href={tier.href}>
                          <Button block size="small">
                            {tier.cta}
                          </Button>
                        </a>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="text-center mt-24">
          <a href="#compare-plans">
            <Button size="tiny" type="default">
              Compare Plans
            </Button>
          </a>
        </div>
      </div>

      <div className="sm:py-18 container relative mx-auto px-4 py-16 shadow-sm md:py-24 lg:px-12 lg:pt-32 lg:pb-12">
        <div>
          <div className="text-center">
            <h2 className="text-scale-1200 text-3xl">Easily customizable add-ons</h2>
            <p className="text-scale-1100 mt-4 mb-8 lg:mb-16 text-lg">
              Level up your Supabase experience with add-ons.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-4 mb-16">
            {addons.map((addon) => (
              <div className="bg-white dark:bg-scale-300 rounded-[4px]" key={addon.name}>
                <div className="overflow-hidden rounded-lg">
                  <img
                    className="w-full"
                    src={`${basePath}/images/pricing/${addon.heroImg}${
                      isDarkMode ? '' : '-light'
                    }.png`}
                  />
                </div>
                <div className="px-8 -mt-1">
                  <p className="text-xs text-scale-900">{addon.price}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <img
                      src={`${basePath}/images/pricing/${addon.icon}${
                        isDarkMode ? '' : '-light'
                      }.svg`}
                      className="file:"
                      alt="Compute"
                    />
                    <span className="text-sm text-scale-1200">{addon.name}</span>
                  </div>
                  <p className="mt-2 text-scale-900 text-xs min-h-[40px] lg:min-h-[50px] lg:max-w-[290px]">
                    {addon.description}
                  </p>
                  <div className="flex items-center justify-between mt-4 mb-4 lg:mb-8">
                    <Link href={addon.leftCtaLink} as={addon.leftCtaLink}>
                      <a>
                        <Button size="tiny" type="default">
                          {addon.leftCtaText}
                        </Button>
                      </a>
                    </Link>
                    {addon.name === 'Optimized Compute' ? (
                      <button
                        className="text-brand-1000 text-xs hover:underline "
                        onClick={() => setShowComputeModal(true)}
                      >
                        {addon.rightCtaText}
                      </button>
                    ) : (
                      ''
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="flex flex-col md:flex-row items-center gap-4 justify-center text-center">
            <span className="prose">Got something you'd like to see here?</span>
            <Link
              href="https://github.com/supabase/supabase/discussions/categories/feature-requests"
              as="https://github.com/supabase/supabase/discussions/categories/feature-requests"
            >
              <a target="_blank">
                <Button size="tiny" type="default">
                  Request a feature
                </Button>
              </a>
            </Link>
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-center mt-12 lg:mt-8 max-w-6xl mx-auto">
          <div>
            <span className="bg-brand-500 text-brand-1100 rounded-md bg-opacity-30 inline-block  dark:bg-scale-400 dark:text-scale-1100 py-0.5 px-2 text-xs mt-2">
              Available for Pro plan
            </span>
            <h2 className="text-scale-1200 text-4xl mt-4">Cost control with spend caps</h2>
            <p className="mt-3 prose lg:max-w-lg">
              The Pro tier has a usage quota included and a spend cap turned on by default. If you
              need to go beyond the inclusive limits, simply switch off your spend cap to pay for
              additional usage and scale seamlessly. Note that your project will run into
              restrictions if you have the spend cap enabled and exhaust your quota.
            </p>
          </div>
          <div>
            <div className="">
              <img
                className="w-full"
                src={`${basePath}/images/pricing/spend-cap${isDarkMode ? '' : '-light'}.png`}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="bg-scale-200">
        <div className="sm:py-18 container relative mx-auto px-4 py-16 md:py-24 lg:px-16 lg:py-24 xl:px-20">
          <div className="text-center">
            <h2 className="text-scale-1200 text-3xl scroll-m-20" id="compare-plans">
              Compare Plans
            </h2>
            <p className="text-scale-1100 mt-4 mb-8 lg:mb-16 text-lg">
              Start with a hobby project, collaborate with a team, and scale to millions of users.
            </p>
          </div>

          <div className="sm:mb-18 mb-16 md:mb-24 lg:mb-24">
            {/* <!-- xs to lg --> */}

            <div className="lg:hidden">
              {/* Free - Mobile  */}
              <div className="bg-slate-200 p-2 sticky top-14 z-10 pt-4">
                <div className="bg-slate-300 rounded-lg border border-slate-500 py-2 px-4 flex justify-between items-center">
                  <label className="text-scale-1000">Change plan</label>
                  <Select
                    id="change-plan"
                    name="Change plan"
                    layout="vertical"
                    value={activeMobileTier}
                    className="min-w-[120px] bg-slate-400 text-red-500"
                    onChange={(e) => setActiveMobileTier(e.target.value)}
                  >
                    <Select.Option value="Free">Free</Select.Option>
                    <Select.Option value="Pro">Pro</Select.Option>
                    <Select.Option value="Enterprise">Enterprise</Select.Option>
                  </Select>
                </div>
              </div>
              {activeMobileTier === 'Free' && (
                <>
                  <MobileHeader
                    tier="Free"
                    price={'0'}
                    priceDescription={'/mo'}
                    description={'Perfect for hobby projects and experiments'}
                  />
                  <PricingTableRowMobile
                    category={pricing.database}
                    tier={'free'}
                    icon={Solutions['database'].icon}
                  />
                  <PricingTableRowMobile
                    category={pricing.auth}
                    tier={'free'}
                    icon={Solutions['authentication'].icon}
                  />
                  <PricingTableRowMobile
                    category={pricing.storage}
                    tier={'free'}
                    icon={Solutions['storage'].icon}
                  />
                  <PricingTableRowMobile
                    category={pricing.realtime}
                    tier={'free'}
                    icon={Solutions['realtime'].icon}
                  />
                  <PricingTableRowMobile
                    category={pricing['edge-functions']}
                    tier={'free'}
                    icon={Solutions['edge-functions'].icon}
                  />
                  <PricingTableRowMobile
                    category={pricing.dashboard}
                    tier={'free'}
                    icon={pricing.dashboard.icon}
                  />
                  <PricingTableRowMobile
                    category={pricing.security}
                    tier={'free'}
                    icon={pricing.security.icon}
                  />
                  <PricingTableRowMobile
                    category={pricing.support}
                    tier={'free'}
                    icon={pricing.support.icon}
                  />
                </>
              )}

              {activeMobileTier === 'Pro' && (
                <>
                  <MobileHeader
                    tier="Pro"
                    from={false}
                    price={'25'}
                    priceDescription={'/mo + additional use'}
                    description={'Everything you need to scale your project into production'}
                  />
                  <PricingTableRowMobile
                    category={pricing.database}
                    tier={'pro'}
                    icon={Solutions['database'].icon}
                  />
                  <PricingTableRowMobile
                    category={pricing.auth}
                    tier={'pro'}
                    icon={Solutions['authentication'].icon}
                  />
                  <PricingTableRowMobile
                    category={pricing.storage}
                    tier={'pro'}
                    icon={Solutions['storage'].icon}
                  />
                  <PricingTableRowMobile
                    category={pricing.realtime}
                    tier={'pro'}
                    icon={Solutions['realtime'].icon}
                  />
                  <PricingTableRowMobile
                    category={pricing['edge-functions']}
                    tier={'pro'}
                    icon={Solutions['edge-functions'].icon}
                  />
                  <PricingTableRowMobile
                    category={pricing.dashboard}
                    tier={'pro'}
                    icon={pricing.dashboard.icon}
                  />
                  <PricingTableRowMobile
                    category={pricing.security}
                    tier={'pro'}
                    icon={pricing.security.icon}
                  />
                  <PricingTableRowMobile
                    category={pricing.support}
                    tier={'pro'}
                    icon={pricing.support.icon}
                  />
                </>
              )}

              {activeMobileTier === 'Enterprise' && (
                <>
                  <MobileHeader
                    tier="Enterprise"
                    price={'Contact us for a quote'}
                    priceDescription={''}
                    description={
                      'Designated support team, account manager and technical specialist'
                    }
                    showDollarSign={false}
                  />
                  <PricingTableRowMobile
                    category={pricing.database}
                    tier={'enterprise'}
                    icon={Solutions['database'].icon}
                  />
                  <PricingTableRowMobile
                    category={pricing.auth}
                    tier={'enterprise'}
                    icon={Solutions['authentication'].icon}
                  />
                  <PricingTableRowMobile
                    category={pricing.storage}
                    tier={'enterprise'}
                    icon={Solutions['storage'].icon}
                  />
                  <PricingTableRowMobile
                    category={pricing.realtime}
                    tier={'enterprise'}
                    icon={Solutions['realtime'].icon}
                  />
                  <PricingTableRowMobile
                    category={pricing['edge-functions']}
                    tier={'enterprise'}
                    icon={Solutions['edge-functions'].icon}
                  />
                  <PricingTableRowMobile
                    category={pricing.dashboard}
                    tier={'enterprise'}
                    icon={pricing.dashboard.icon}
                  />
                  <PricingTableRowMobile
                    category={pricing.security}
                    tier={'enterprise'}
                    icon={pricing.security.icon}
                  />
                  <PricingTableRowMobile
                    category={pricing.support}
                    tier={'enterprise'}
                    icon={pricing.support.icon}
                  />
                </>
              )}
            </div>

            {/* <!-- lg+ --> */}
            <div className="hidden lg:block">
              <table className="h-px w-full table-fixed">
                <caption className="sr-only">Pricing plan comparison</caption>
                <thead className="bg-scale-200 dark:bg-scale-200 sticky top-[62px] z-10">
                  <tr>
                    <th
                      className="text-scale-1200 w-1/3 px-6 pt-2 pb-2 text-left text-sm font-normal"
                      scope="col"
                    >
                      <span className="sr-only">Feature by</span>
                      <div
                        className="h-0.25 absolute bottom-0 left-0 w-full"
                        style={{ height: '1px' }}
                      ></div>
                    </th>

                    {tiers.map((tier) => (
                      <th
                        className="text-scale-1200 w-1/4 px-6 pr-2 pt-2 pb-2 text-left text-sm font-normal"
                        scope="col"
                        key={tier.name}
                      >
                        <h3 className="gradient-text-brand-500 dark:gradient-text-brand-100 text-2xl font-mono font-normal uppercase flex items-center gap-4">
                          {tier.name}
                        </h3>
                        <div
                          className="h-0.25 absolute bottom-0 left-0 w-full"
                          style={{ height: '1px' }}
                        ></div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tr className="descriptions">
                  <th
                    className="text-scale-1200 w-1/3 px-6 pt-2 pb-2 text-left text-sm font-normal"
                    scope="col"
                  ></th>

                  {tiers.map((tier) => (
                    <th
                      className="text-scale-1200 w-1/4 px-6 pt-2 pb-2 text-left text-sm font-normal"
                      scope="col"
                      key={`th-${tier.name}`}
                    >
                      <p className="p text-sm border-b border-scale-700 pb-4">{tier.description}</p>
                      <div
                        className="h-0.25 absolute bottom-0 left-0 w-full"
                        style={{ height: '1px' }}
                      ></div>
                    </th>
                  ))}
                </tr>
                <tbody className="border-scale-700 dark:border-scale-400 divide-scale-700 dark:divide-scale-400 divide-y">
                  <tr className="">
                    <th
                      className="text-scale-900 px-6 py-8 text-left align-top text-sm font-medium dark:text-white"
                      scope="row"
                    ></th>

                    {tiers.map((tier) => (
                      <td className="h-full px-6 py-2 align-top" key={`price-${tier.name}`}>
                        <div className="relative table h-full w-full">
                          <div className="flex flex-col justify-between h-full">
                            <>
                              <span
                                className={`text-scale-1200 ${
                                  tier.name !== 'Enterprise' ? 'text-5xl' : 'text-4xl'
                                }`}
                              >
                                {tier.name !== 'Enterprise' && '$'}
                                {tier.priceMonthly}
                              </span>
                              {tier.name !== 'Enterprise' && (
                                <p className="p text-xs mt-1">per project per month</p>
                              )}
                            </>

                            {tier.warning && (
                              <p className="-mt-2">
                                <span className="bg-brand-500 text-brand-1100 rounded-md bg-opacity-30 py-0.5 px-2 text-xs ">
                                  {tier.warning}
                                </span>
                              </p>
                            )}

                            <div className={tier.name === 'Enterprise' ? 'mt-auto' : 'mt-8'}>
                              <Link href={tier.href} as={tier.href}>
                                <a>
                                  <Button
                                    size="tiny"
                                    type={tier.name === 'Enterprise' ? 'default' : 'primary'}
                                    block
                                  >
                                    {tier.cta}
                                  </Button>
                                </a>
                              </Link>
                            </div>
                          </div>
                        </div>
                      </td>
                    ))}
                  </tr>

                  <PricingTableRowDesktop
                    category={pricing.database}
                    icon={Solutions['database'].icon}
                  />
                  <PricingTableRowDesktop
                    category={pricing.auth}
                    icon={Solutions['authentication'].icon}
                  />
                  <PricingTableRowDesktop
                    category={pricing.storage}
                    icon={Solutions['storage'].icon}
                  />
                  <PricingTableRowDesktop
                    category={pricing.realtime}
                    icon={Solutions['realtime'].icon}
                  />
                  <PricingTableRowDesktop
                    category={pricing['edge-functions']}
                    icon={Solutions['edge-functions'].icon}
                  />
                  <PricingTableRowDesktop
                    category={pricing.dashboard}
                    icon={pricing.dashboard.icon}
                  />
                  <PricingTableRowDesktop
                    category={pricing.security}
                    icon={pricing.security.icon}
                  />
                  <PricingTableRowDesktop category={pricing.support} icon={pricing.support.icon} />
                </tbody>
                <tfoot>
                  <tr className="border-scale-200 dark:border-scale-600 border-t">
                    <th className="sr-only" scope="row">
                      Choose your plan
                    </th>

                    <td className="px-6 pt-5">
                      <Link href="https://app.supabase.com" as="https://app.supabase.com">
                        <a>
                          <Button size="tiny" type="primary" block>
                            Get started
                          </Button>
                        </a>
                      </Link>
                    </td>

                    <td className="px-6 pt-5">
                      <Link href="https://app.supabase.com" as="https://app.supabase.com">
                        <a>
                          <Button size="tiny" type="primary" block>
                            Get started
                          </Button>
                        </a>
                      </Link>
                    </td>

                    <td className="px-6 pt-5">
                      <Link href="https://forms.supabase.com/enterprise">
                        <a>
                          <Button size="tiny" type="primary" block>
                            Contact us
                          </Button>
                        </a>
                      </Link>
                    </td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        </div>
        <div className="border-t">
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
                  className="text-scale-900 dark:text-white"
                >
                  {pricingFaq.map((faq, i) => {
                    return (
                      <div className="border-b pb-3" key={i}>
                        <Accordion.Item
                          header={<span className="text-scale-1200">{faq.question}</span>}
                          id={`faq--${i.toString()}`}
                        >
                          <ReactMarkdown className="text-scale-900 prose">
                            {faq.answer}
                          </ReactMarkdown>
                        </Accordion.Item>
                      </div>
                    )
                  })}
                </Accordion>
              </div>
              <p className="p text-center">
                Can&apos;t find the answer to your question, you can{' '}
                <a
                  target="_blank"
                  href="https://app.supabase.com/support/new"
                  className="transition text-brand-900 hover:text-brand-1000"
                >
                  open a support ticket
                </a>{' '}
                and our team of experts will be able to help.
              </p>
              <p className="p text-center">
                For enterprise enquries,{' '}
                <a
                  target="_blank"
                  href="https://app.supabase.com/support/new"
                  className="transition text-brand-900 hover:text-brand-1000"
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
