import { ServerIcon, SupportIcon } from '@heroicons/react/outline'
import { Accordion, Button, IconCheck } from 'ui'
import Solutions from 'data/Solutions.json'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import PricingAddOnTable from '~/components/PricingAddOnTable'
import { PricingTableRowDesktop, PricingTableRowMobile } from '~/components/PricingTableRow'
import pricing from '~/data/Pricing.json'
import pricingAddOn from '~/data/PricingAddOn.json'
import pricingFaq from '~/data/PricingFAQ.json'

export default function IndexPage() {
  const router = useRouter()

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
      costUnit: '/month per project',
      href: 'https://app.supabase.com/new/new-project',
      priceMonthly: 0,
      warning: 'Limit of 2 free projects',
      description: 'Perfect for passion projects & simple websites.',
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
      additional: 'Free projects are paused after 1 week of inactivity.',

      cta: 'Get Started',
    },
    {
      name: 'Pro',
      costUnit: '/month per project',
      href: 'https://app.supabase.com/new/new-project',
      from: true,
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
      preface: 'Everything below included in the base plan',
      additional: 'Need more? Turn off your spend cap to Pay As You Grow ',
      cta: 'Get Started',
    },
    {
      name: 'Enterprise',
      href: 'https://forms.supabase.com/enterprise',
      description: 'For large-scale applications managing serious workloads.',
      features: [
        `Point in time recovery`,
        `Designated Support manager & SLAs`,
        `Enterprise OAuth providers`,
        `SSO/ SAML`,
        `SOC2`,
        `Custom contracts & invoicing`,
        `On-premise support`,
        `24×7×365 premium enterprise support`,
      ],
      scale: '',
      shutdown: '',
      cta: 'Contact Us',
    },
  ]

  const MobileHeaders = ({
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
      <div className="mt-8 px-4">
        <h2 className="text-scale-1200 text-base font-normal">{tier}</h2>
        <div className="flex items-baseline gap-2">
          {from && <span className="text-scale-1200 text-base">From</span>}
          <span className="h1">
            {showDollarSign && '$'}
            {price}
          </span>
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

      <div className="">
        <div className="relative z-10 py-16 shadow-sm lg:py-28">
          <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
            <div className="mx-auto max-w-3xl space-y-2 lg:max-w-none">
              <h1 className="text-brand-900 font-mono text-base uppercase tracking-widest">
                Pricing
              </h1>
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
            <div className="mx-auto max-w-md space-y-4 lg:grid lg:max-w-7xl lg:grid-cols-3 lg:gap-5 lg:space-y-0">
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className="
                  flex
                  flex-col
                  overflow-hidden
                  rounded
                  border
                  "
                >
                  <div className="dark:bg-scale-300 h-[220px] bg-white px-8 pt-6">
                    <div className="mb-2 flex items-center gap-2">
                      <h3 className="text-scale-1200 text-xl font-medium">{tier.name}</h3>
                      {tier.warning && (
                        <div className="bg-scale-400 text-scale-1100 rounded-md bg-opacity-30 py-0.5 px-2 text-xs">
                          {tier.warning}
                        </div>
                      )}
                    </div>
                    <p className="text-scale-1100 my-4 h-[40px] text-sm">{tier.description}</p>
                    <div
                      className="
                      text-scale-1200 flex items-baseline
                      text-5xl
                      font-normal
                      lg:text-4xl
                      xl:text-4xl

                      "
                    >
                      {tier.priceMonthly !== undefined ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-end gap-2">
                            <div>
                              <span>
                                {typeof tier.priceMonthly !== 'string' && '$'}
                                {tier.priceMonthly}
                              </span>
                              <span className="text-scale-900 ml-1 text-xl font-normal">
                                {tier.costUnit}
                              </span>
                            </div>
                          </div>
                          {tier.from && (
                            <span className="text-scale-900 block text-sm">
                              + any additional usage
                            </span>
                          )}
                        </div>
                      ) : (
                        <span>Contact Us</span>
                      )}
                    </div>
                  </div>
                  <div
                    className="
                    dark:border-scale-400 dark:bg-scale-300 flex h-full

                    flex-1
                    flex-col
                    justify-between

                    space-y-6
                    border-t

                    bg-white
                    px-8

                    py-6
                  "
                  >
                    {tier.preface && <p className="text-scale-1100 text-sm">{tier.preface}</p>}
                    {/* <p className="text-scale-900 text-sm">Included with plan:</p> */}
                    <ul role="list" className="dark:divide-scale-400 divide-y">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-center py-2">
                          {/* <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 dark:bg-brand-400 bg-opacity-30"> */}
                          <IconCheck
                            className="text-brand-900 h-4 w-4 "
                            aria-hidden="true"
                            strokeWidth={3}
                          />
                          {/* </div> */}
                          <p className="text-scale-1100 dark:text-scale-1200 mb-0 ml-3 text-sm">
                            {feature}
                          </p>
                        </li>
                      ))}
                    </ul>

                    <div className="flex flex-col gap-6">
                      <div className="space-y-2">
                        {tier.additional && (
                          <p className="text-scale-1200 text-base">{tier.additional}</p>
                        )}
                        {tier.scale && <p className="text-scale-900 text-xs">{tier.scale}</p>}
                        {tier.shutdown && <p className="text-scale-900 text-xs">{tier.shutdown}</p>}
                      </div>
                      <a href={tier.href}>
                        <Button block size="large" className="dark:text-white">
                          {tier.cta}
                        </Button>
                      </a>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="sm:py-18 container relative mx-auto px-4 py-16 shadow-sm md:py-24 lg:px-16 lg:py-24 xl:px-20">
        <div className="text-center">
          <h2 className="text-scale-1200 text-3xl">Add-Ons</h2>
          <p className="text-scale-1100 mb-16 text-lg">
            Level up your Supabase experience with add-ons.
          </p>
        </div>

        <div className="space-y-8">
          <PricingAddOnTable
            icon={<ServerIcon className="h-8 w-8" strokeWidth={1.5} />}
            pricing={pricingAddOn.database}
          />
          <PricingAddOnTable
            icon={<SupportIcon className="h-8 w-8" strokeWidth={1.5} />}
            pricing={pricingAddOn.support}
          />
        </div>
      </div>

      <div className="bg-scale-200">
        <div className="sm:py-18 container relative mx-auto px-4 py-16 md:py-24 lg:px-16 lg:py-24 xl:px-20">
          <div className="text-center">
            <h2 className="text-scale-1200 text-3xl">Compare Plans</h2>
            <p className="text-scale-1100 mb-16 text-lg">
              Start with a hobby project, collaborate with a team, and scale to millions of users.
            </p>
          </div>

          <div className="sm:mb-18 mb-16 md:mb-24 lg:mb-24">
            {/* <!-- xs to lg --> */}

            <div className="lg:hidden">
              {/* Free - Mobile  */}

              <MobileHeaders
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

              {/* Pro - Mobile  */}
              <MobileHeaders
                tier="Pro"
                from={true}
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

              {/* Enterprise - Mobile  */}
              <MobileHeaders
                tier="Enterprise"
                price={'Contact Us'}
                priceDescription={'for a quote'}
                description={'Designated support team, account manager and technical specialist'}
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
            </div>

            {/* <!-- lg+ --> */}
            <div className="hidden lg:block">
              <table className="h-px w-full table-fixed">
                <caption className="sr-only">Pricing plan comparison</caption>
                <thead className="border-scale-700 dark:border-scale-400 bg-scale-200 dark:bg-scale-300 sticky top-[62px] z-10 border-b">
                  <tr>
                    <th
                      className="text-scale-1200 relative px-6 py-4 text-left text-sm font-normal"
                      scope="col"
                    >
                      <span className="sr-only">Feature by</span>
                      <span>Plans</span>
                      <div
                        className="h-0.25 absolute bottom-0 left-0 w-full"
                        style={{ height: '1px' }}
                      ></div>
                    </th>

                    <th
                      className="text-scale-1200 w-1/4 px-6 py-4 text-left text-sm font-normal"
                      scope="col"
                    >
                      <span>Free</span>
                      <div
                        className="h-0.25 absolute bottom-0 left-0 w-full"
                        style={{ height: '1px' }}
                      ></div>
                    </th>

                    <th
                      className="text-scale-1200 w-1/4 px-6 py-4 text-left text-sm font-normal leading-6"
                      scope="col"
                    >
                      <span>Pro</span>
                      <div
                        className="h-0.25 absolute bottom-0 left-0 w-full"
                        style={{ height: '1px' }}
                      ></div>
                    </th>

                    <th
                      className="text-scale-1200 w-1/4 px-6 py-4 text-left text-sm font-normal leading-6"
                      scope="col"
                    >
                      <span>Enterprise</span>
                      <div
                        className="h-0.25 absolute bottom-0 left-0 w-full"
                        style={{ height: '1px' }}
                      ></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="border-scale-700 dark:border-scale-400 divide-scale-700 dark:divide-scale-400 divide-y">
                  <tr className="divide-scale-700 dark:divide-scale-400 divide-x">
                    <th
                      className="text-scale-900 px-6 py-8 text-left align-top text-sm font-medium dark:text-white"
                      scope="row"
                    >
                      Pricing
                    </th>

                    <td className="h-full px-6 py-8 align-top">
                      <div className="relative table h-full">
                        <span className="h1 text-scale-1200">$0</span>
                        <p className="p">/project/month</p>

                        <p className="p text-sm">Perfect for hobby projects and experiments</p>

                        <Link href="https://app.supabase.com" as="https://app.supabase.com">
                          <a>
                            <Button size="medium" type="default">
                              Get Started
                            </Button>
                          </a>
                        </Link>
                      </div>
                    </td>

                    <td className="h-full px-6 py-8 align-top">
                      <div className="relative table h-full">
                        <span className="h1 text-scale-1200">$25</span>
                        <p className="p">/project/month + usage costs</p>

                        <p className="p text-sm">
                          Everything you need to scale your project into production
                        </p>

                        <Link href="https://app.supabase.com" as="https://app.supabase.com">
                          <a>
                            <Button size="medium" type="default">
                              Get Started
                            </Button>
                          </a>
                        </Link>
                      </div>
                    </td>

                    <td className="h-full px-6 py-8 align-top">
                      <div className="relative table h-full">
                        <span className="h1 text-scale-1200">Contact Us</span>
                        <p className="p">for a quote</p>

                        <p className="p text-sm">
                          Designated support team, account manager and technical specialist
                        </p>

                        <Link href="https://forms.supabase.com/enterprise">
                          <a>
                            <Button size="medium" type="default">
                              Contact Us
                            </Button>
                          </a>
                        </Link>
                      </div>
                    </td>
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
                          <Button size="medium" type="default" block>
                            Get started
                          </Button>
                        </a>
                      </Link>
                    </td>

                    <td className="px-6 pt-5">
                      <Link href="https://app.supabase.com" as="https://app.supabase.com">
                        <a>
                          <Button size="medium" type="default" block>
                            Get started
                          </Button>
                        </a>
                      </Link>
                    </td>

                    <td className="px-6 pt-5">
                      <Link href="https://forms.supabase.com/enterprise">
                        <a>
                          <Button size="medium" type="default" block>
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
              <p className="p text-center">
                Can&apos;t find the answer to your question, ask someone in the community either on
                our Discord or GitHub.
              </p>
              <div className="p text-center">
                <Link href="https://discord.supabase.com">
                  <a>
                    <Button type="default" className="mr-2" size="small">
                      Discord
                    </Button>
                  </a>
                </Link>
                <Link href="https://github.com/supabase/supabase/discussions">
                  <a>
                    <Button type="default" size="small">
                      GitHub
                    </Button>
                  </a>
                </Link>
              </div>
              <div className="mt-16">
                {/* @ts-ignore */}
                <Accordion
                  type="default"
                  openBehaviour="multiple"
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
            </div>
          </div>
        </div>
      </div>
      <CTABanner />
    </DefaultLayout>
  )
}
