import { Accordion, Button, Collapsible, IconCheck, IconChevronUp, Typography } from '@supabase/ui'
import Solutions from 'data/Solutions.json'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React, { Fragment, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import { Check, PricingTableRowDesktop, PricingTableRowMobile } from '~/components/PricingTableRow'
import pricing from '~/data/Pricing.json'
import pricingFaq from '~/data/PricingFAQ.json'
import pricingAddOn from '~/data/PricingAddOn.json'
import classNames from 'classnames'

export default function IndexPage() {
  const router = useRouter()

  const meta_title = 'Pricing & fees | Supabase'
  const meta_description =
    'Explore Supabase fees and pricing information. Find our competitive pricing tiers, with no hidden pricing. We have generous free tiers for those getting started, and Pay As You Go for those scaling up.'

  const tiers = [
    {
      name: 'Free',
      href: '#',
      priceMonthly: 0,
      warning: 'Limit of 2 free projects per user',
      description: 'Perfect for hobby projects and experiments.',
      features: [
        '10K Authenticated Users',
        '500MB Database',
        '1GB Storage',
        '25 Realtime Connections',
        '1 Day Backup',
        'Standard Support',
      ],
      scale: 'Anything more than the above you must upgrade',
      shutdown: 'Free projects are shutdown after 7 days of inactivity.',
      cta: 'Get Started',
    },
    {
      name: 'Pro',
      href: '#',
      priceMonthly: 25,
      warning: '+ usage costs',
      description: 'Everything you need to scale your project into production.',
      features: [
        '100K Authenticated Users',
        '8GB Database',
        '50GB Storage',
        'Unlimited Realtime Connections',
        '7 Days Backup',
        'High Priority Support',
      ],
      scale: 'Additional fees apply for usage and storage beyond the limits above.',
      shutdown: '',
      cta: 'Get Started',
    },
    {
      name: 'Enterprise',
      href: 'mailto:support@supabase.io',
      description: 'Tailored to your business needs.',
      features: [
        'Unlimited Authenticated Users',
        'Unlimited GB Database',
        'Unlimited GB Storage',
        'Unlimited Realtime connections',
        '30 days Point in Time backup',
        'Enterprise Support',
      ],
      scale: '',
      shutdown: '',
      cta: 'Contact Us',
    },
  ]

  const allPlans = [
    'Custom SMTP server',
    'OAuth Providers',
    'Dedicated project instance',
    'Unlimited API requests',
  ]
  const MobileHeaders = ({
    // title,
    description,
    priceDescription,
    price,
    tier,
    showDollarSign = true,
  }: {
    description: string
    priceDescription: string
    price: string
    tier: string
    showDollarSign?: boolean
  }) => {
    return (
      <div className="px-4">
        <h2 className="text-base font-normal text-scale-1200">{tier}</h2>
        <span className="h1">
          {showDollarSign && '$'}
          {price}
        </span>
        <p className="p">{priceDescription}</p>
        <p className="p">{description}</p>
        <Link href="https://app.supabase.io" passHref>
          <Button as="a" type="default" size="medium" block>
            Get started
          </Button>
        </Link>
      </div>
    )
  }

  const [isDatabaseAddOnOpen, setIsDatabaseAddOnOpen] = useState(false)

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

      <div className="shadow-sm">
        <div className="py-16 bg-scale-100 lg:py-28">
          <div className="px-4 mx-auto text-center max-w-7xl sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-2 lg:max-w-none">
              <h2 className="text-3xl text-scale-1200 md:text-5xl lg:text-6xl">
                Predictable pricing, no surprises
              </h2>
              <p className="text-xl text-scale-1100">
                Start building for free, then scale to millions of users
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col pb-12 bg-scale-100 sm:pb-16 lg:pb-24">
          <div className="relative pt-8">
            <div className="absolute inset-0 shadow-sm bg-scale-200 h-3/5" />

            <div className="relative z-10 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
              <div className="max-w-md mx-auto space-y-4 lg:max-w-7xl lg:grid lg:grid-cols-3 lg:gap-5 lg:space-y-0">
                {tiers.map((tier) => (
                  <div
                    key={tier.name}
                    className="flex flex-col overflow-hidden rounded-lg shadow-lg"
                  >
                    <div className="h-64 px-10 pt-8 bg-white dark:bg-scale-300">
                      <h3
                        className="inline-flex mb-2 text-sm font-normal tracking-wide rounded-full lg:text-xl text-scale-1200"
                        id="tier-standard"
                      >
                        {tier.name}
                      </h3>
                      <div className="flex items-baseline text-6xl font-extrabold lg:text-4xl xl:text-6xl text-scale-1200">
                        {tier.priceMonthly !== undefined ? (
                          <>
                            <span>${tier.priceMonthly}</span>
                            <span className="ml-1 text-2xl font-medium text-scale-900">/mo</span>
                          </>
                        ) : (
                          <span>Contact Us</span>
                        )}
                      </div>
                      {tier.warning && (
                        <span className="relative inline-flex px-2 py-1 mt-2 text-xs rounded-md bg-brand-300 bg-opacity-30 text-brand-1000">
                          {tier.warning}
                        </span>
                      )}
                      <p className="mt-4 text-lg text-scale-1100">{tier.description}</p>
                    </div>

                    <div className="flex flex-col justify-between flex-1 px-6 pt-6 pb-8 space-y-6 border-t bg-scale-100 dark:border-scale-600 sm:p-10 sm:pt-6">
                      <div>
                        <p className="text-scale-900">Included with plan:</p>
                        <ul role="list" className="divide-y">
                          {tier.features.map((feature) => (
                            <li key={feature} className="flex items-center py-2">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 dark:bg-brand-400 bg-opacity-30">
                                <IconCheck
                                  className="w-4 h-4 text-green-800 dark:text-green-900"
                                  aria-hidden="true"
                                  strokeWidth={2}
                                />
                              </div>
                              <p className="mb-0 ml-3 text-base text-scale-1100 dark:text-scale-1200">
                                {feature}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs text-scale-900">{tier.scale}</p>
                        <p className="text-xs text-scale-900">{tier.shutdown}</p>
                      </div>
                      <a href={tier.href}>
                        <Button block size="large" className="dark:text-white">
                          {tier.cta}
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="container relative px-0 py-16 mx-auto lg:px-16 xl:px-20 sm:py-18 md:py-24 lg:py-24">
        <div className="text-center">
          <h2 className="text-3xl text-scale-1200">Add-Ons</h2>
          <p className="mb-16 text-lg text-scale-1100">
            Level up your database&apos;s performance with Supabase Database add-ons.
          </p>
        </div>

        <div>
          <Collapsible open={isDatabaseAddOnOpen} onOpenChange={setIsDatabaseAddOnOpen}>
            <Collapsible.Trigger asChild>
              <button
                className={classNames(
                  'flex flex-row items-center w-full border rounded-t group text-scale-1200 border-scale-500',
                  !isDatabaseAddOnOpen && 'rounded-b'
                )}
                type="button"
              >
                <div className="flex flex-col items-start flex-1 lg:items-center lg:flex-row">
                  <span className="flex-shrink-0 p-3">See add-on pricing plans</span>

                  <div className="flex items-center justify-between flex-1 lg:border-l border-scale-500">
                    <div className="grid grid-cols-1 gap-4 p-3 grid-flow-rows lg:grid-cols-2">
                      <div className="flex items-center space-x-2">
                        <Check />
                        <span>Dedicated Postgres Database</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Check />
                        <span>Optimized Database Instances</span>
                      </div>

                      <div className="flex items-center space-x-2">
                        <Check />
                        <span>Realtime Functionality</span>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 p-3">
                  <IconChevronUp className="transition data-open-parent:rotate-0 data-closed-parent:rotate-180" />
                </div>
              </button>
            </Collapsible.Trigger>

            <Collapsible.Content>
              <div>
                <table className="hidden w-full m-0 overflow-hidden rounded-b table-auto text-scale-1200 lg:table">
                  <thead>
                    <tr className="bg-scale-500">
                      <th className="p-3 text-left">Plan</th>
                      <th className="p-3 text-left">Pricing</th>
                      <th className="p-3 text-left">CPU</th>
                      <th className="p-3 text-left">Memory</th>
                      <th className="p-3 text-left">Connections: Direct</th>
                      <th className="p-3 text-left">Connections: Pooler</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pricingAddOn.database.tiers.map((tier, i) => (
                      <tr key={i} className={classNames(i % 2 === 0 && 'bg-scale-300')}>
                        <td className="p-3">{tier.plan}</td>
                        <td className="p-3">{tier.pricing}</td>
                        <td className="p-3">{tier.cpu}</td>
                        <td className="p-3">{tier.memory}</td>
                        <td className="p-3">{tier.directConnections}</td>
                        <td className="p-3">{tier.poolerConnections}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <table className="w-full m-0 overflow-hidden rounded-b table-auto text-scale-1200 lg:hidden">
                  <tbody>
                    {pricingAddOn.database.tiers.map((tier, i) => (
                      <Fragment key={i}>
                        <tr className={classNames(i % 2 === 0 && 'bg-scale-300')}>
                          <th className="py-3 pl-4 text-left">Plan</th>
                          <td className="px-4 py-3">{tier.plan}</td>
                        </tr>
                        <tr className={classNames(i % 2 === 0 && 'bg-scale-300')}>
                          <th className="py-3 pl-4 text-left">Pricing</th>
                          <td className="px-4 py-3">{tier.pricing}</td>
                        </tr>
                        <tr className={classNames(i % 2 === 0 && 'bg-scale-300')}>
                          <th className="py-3 pl-4 text-left">CPU</th>
                          <td className="px-4 py-3">{tier.cpu}</td>
                        </tr>
                        <tr className={classNames(i % 2 === 0 && 'bg-scale-300')}>
                          <th className="py-3 pl-4 text-left">Memory</th>
                          <td className="px-4 py-3">{tier.memory}</td>
                        </tr>
                        <tr className={classNames(i % 2 === 0 && 'bg-scale-300')}>
                          <th className="py-3 pl-4 text-left">Connections: Direct</th>
                          <td className="px-4 py-3">{tier.directConnections}</td>
                        </tr>
                        <tr className={classNames(i % 2 === 0 && 'bg-scale-300')}>
                          <th className="py-3 pl-4 text-left">Connections: Pooler</th>
                          <td className="px-4 py-3">{tier.poolerConnections}</td>
                        </tr>
                      </Fragment>
                    ))}
                  </tbody>
                </table>
              </div>
            </Collapsible.Content>
          </Collapsible>
        </div>
      </div>

      <div className="bg-white dark:bg-scale-100">
        <div className="container relative px-6 py-16 mx-auto lg:px-16 xl:px-20 md:pt-24 lg:pt-24">
          <div className="text-center">
            <h2 className="text-3xl text-scale-1200">Compare plans</h2>
            <p className="mb-16 text-lg text-scale-1100">
              Start with a hobby project, collaborate with a team, and scale to millions of users.
            </p>
          </div>

          <div className="container relative px-0 py-4 mx-auto lg:px-16 xl:px-20 sm:py-12 md:py-16 lg:py-20">
            {/* <!-- xs to lg --> */}

            <div className=" lg:hidden">
              {/* Free - Mobile  */}

              <MobileHeaders
                tier="Free"
                price={'0'}
                priceDescription={'/project /month'}
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
              <PricingTableRowMobile category={pricing.dashboard} tier={'free'} />
              <PricingTableRowMobile category={pricing.support} tier={'free'} />

              {/* Pro - Mobile  */}
              <MobileHeaders
                tier="Pro"
                price={'25'}
                priceDescription={'/project /month + usage costs'}
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
              <PricingTableRowMobile category={pricing.dashboard} tier={'pro'} />
              <PricingTableRowMobile category={pricing.support} tier={'pro'} />

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
              <PricingTableRowMobile category={pricing.dashboard} tier={'enterprise'} />
              <PricingTableRowMobile category={pricing.support} tier={'enterprise'} />
            </div>

            {/* <!-- lg+ --> */}
            <div className="hidden lg:block">
              <table className="w-full h-px table-fixed">
                <caption className="sr-only">Pricing plan comparison</caption>
                <thead
                  className="
                    thead--plans 
                    sticky 
                    z-10 
                    top-[62px] 
                    border-b 
                    border-scale-700 
                    dark:border-scale-400 
                    bg-scale-200
                  "
                >
                  <tr>
                    <th
                      className="relative px-6 pb-4 text-sm font-normal text-left text-scale-900"
                      scope="col"
                    >
                      <span className="sr-only">Feature by</span>
                      <span>Plans</span>
                      <div
                        className="absolute bottom-0 left-0 h-0.25 w-full bg-scale-200 dark:bg-scale-300"
                        style={{ height: '1px' }}
                      ></div>
                    </th>

                    <th
                      className="w-1/4 px-6 pb-4 text-sm font-normal text-left text-scale-1200"
                      scope="col"
                    >
                      <span>Free</span>
                      <div
                        className="absolute bottom-0 left-0 h-0.25 w-full bg-scale-200 dark:bg-scale-300"
                        style={{ height: '1px' }}
                      ></div>
                    </th>

                    <th
                      className="w-1/4 px-6 pb-4 text-sm font-normal leading-6 text-left text-scale-1200"
                      scope="col"
                    >
                      <span>Pro</span>
                      <div
                        className="absolute bottom-0 left-0 h-0.25 w-full bg-scale-200 dark:bg-scale-300"
                        style={{ height: '1px' }}
                      ></div>
                    </th>

                    <th
                      className="w-1/4 px-6 pb-4 text-sm font-normal leading-6 text-left text-scale-1200"
                      scope="col"
                    >
                      <span>Enterprise</span>
                      <div
                        className="absolute bottom-0 left-0 h-0.25 w-full bg-scale-200 dark:bg-scale-300"
                        style={{ height: '1px' }}
                      ></div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y border-scale-700 dark:border-scale-400 divide-scale-700 dark:divide-scale-400">
                  <tr className="divide-x divide-scale-700 dark:divide-scale-400">
                    <th
                      className="px-6 py-8 text-sm font-medium text-left align-top text-scale-900 dark:text-white"
                      scope="row"
                    >
                      Pricing
                    </th>

                    <td className="h-full px-6 py-8 align-top">
                      <div className="relative table h-full">
                        <span className="h1 text-scale-1200">$0</span>
                        <p className="p"> /project /month</p>

                        <p className="text-sm p">Perfect for hobby projects and experiments</p>

                        <Link href="https://app.supabase.io" as="https://app.supabase.io">
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
                        <p className="p"> /project /month + usage costs</p>

                        <p className="text-sm p">
                          Everything you need to scale your project into production
                        </p>

                        <Link href="https://app.supabase.io" as="https://app.supabase.io">
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

                        <p className="text-sm p">
                          Designated support team, account manager and technical specialist
                        </p>

                        <Link href="mailto:support@supabase.io" as="mailto:support@supabase.io">
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
                  <PricingTableRowDesktop category={pricing.dashboard} />
                  <PricingTableRowDesktop category={pricing.support} />
                </tbody>
                <tfoot>
                  <tr className="border-t border-scale-200 dark:border-scale-600">
                    <th className="sr-only" scope="row">
                      Choose your plan
                    </th>

                    <td className="px-6 pt-5">
                      <Link href="https://app.supabase.io" as="https://app.supabase.io">
                        <a>
                          <Button size="medium" type="default" block>
                            Get started
                          </Button>
                        </a>
                      </Link>
                    </td>

                    <td className="px-6 pt-5">
                      <Link href="https://app.supabase.io" as="https://app.supabase.io">
                        <a>
                          <Button size="medium" type="default" block>
                            Get started
                          </Button>
                        </a>
                      </Link>
                    </td>

                    <td className="px-6 pt-5">
                      <Link href="mailto:support@supabase.io" as="mailto:support@supabase.io">
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

          <div className="border-t dark:border-scale-600">
            <div className="container relative px-6 py-16 mx-auto lg:px-16 xl:px-20 sm:py-18 md:py-24 lg:py-24">
              <h2 className="h3">Frequently asked questions</h2>
              <p className="max-w-sm mb-4 text-base p">
                Can&apos;t find the answer to your question, ask someone in the community either on
                our Discord or GitHub.
              </p>
              <Link href="https://discord.supabase.com">
                <a>
                  <Button type="default" className="mr-2" size="small">
                    Discord
                  </Button>
                </a>
              </Link>
              <Link href="https://github.com/supabase/supabase/discussions">
                <a>
                  <Button size="small" className="text-white">
                    GitHub
                  </Button>
                </a>
              </Link>
              <div className="mt-16">
                {/* @ts-ignore */}
                {/* <Accordion type="bordered"> */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-10 gap-x-10">
                  {pricingFaq.map((faq, i) => {
                    return (
                      <div key={i}>
                        {/* @ts-ignore */}
                        <Accordion
                          type="bordered"
                          openBehaviour="multiple"
                          size="medium"
                          className="text-scale-900 dark:text-white"
                        >
                          <Accordion.Item header={faq.question} id={`faq--${i.toString()}`}>
                            <ReactMarkdown>{faq.answer}</ReactMarkdown>
                          </Accordion.Item>
                        </Accordion>
                      </div>
                    )
                  })}
                </div>
                {/* </Accordion> */}
              </div>
            </div>
          </div>
        </div>
      </div>
      <CTABanner />
    </DefaultLayout>
  )
}
