import { Accordion, Button, IconCheck, Typography } from '@supabase/ui'
import Solutions from 'data/Solutions.json'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import { PricingTableRowDesktop, PricingTableRowMobile } from '~/components/PricingTableRow'
import pricing from '~/data/Pricing.json'
import pricingFaq from '~/data/PricingFAQ.json'

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
    },
    // {
    //   name: 'Enterprise',
    //   href: '#',
    //   description: 'Tailored to your business needs.',
    //   features: [
    //     '∞ authenticated users',
    //     '∞ GB Database',
    //     '∞ GB Storage',
    //     'Unlimited Realtime connections',
    //     'Backups never deleted',
    //     'Enterprise support',
    //   ],
    //   scale: 'Additional fees apply for usage and storage beyond the limits above.',
    //   shutdown: '',
    // },
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
  }: {
    description: string
    priceDescription: string
    price: string
    tier: string
  }) => {
    return (
      <div className="px-4">
        <h2 className="text-base font-normal text-scale-1200">{tier}</h2>
        <span className="h1">${price}</span>
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

      <div className="shadow-lg">
        <div className="py-12 bg-scale-100 lg:py-24">
          <div className="px-4 mx-auto text-center max-w-7xl sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-2 lg:max-w-none">
              <h2 className="text-3xl text-scale-1200 sm:text-4xl lg:text-5xl">
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
            <div className="absolute inset-0 shadow-sm bg-scale-200 h-3/4" />

            <div className="relative z-10 px-4 mx-auto max-w-7xl sm:px-6 lg:px-8">
              <div className="max-w-md mx-auto space-y-4 lg:max-w-5xl lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
                {tiers.map((tier) => (
                  <div
                    key={tier.name}
                    className="flex flex-col overflow-hidden rounded-lg shadow-lg"
                  >
                    <div className="h-64 px-10 pt-8 bg-white dark:bg-scale-700">
                      <h3
                        className="inline-flex mb-2 text-sm font-normal tracking-wide rounded-full lg:text-xl text-scale-1200"
                        id="tier-standard"
                      >
                        {tier.name}
                      </h3>
                      <div className="flex items-baseline text-6xl font-extrabold text-scale-1200">
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

                    <div className="flex flex-col justify-between flex-1 px-6 pt-6 pb-8 space-y-6 border-t bg-scale-100 dark:border-dark sm:p-10 sm:pt-6">
                      <div>
                        <p className="text-scale-900">Included with plan:</p>
                        <ul role="list" className="divide-y">
                          {tier.features.map((feature) => (
                            <li key={feature} className="flex items-center py-2">
                              <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 bg-opacity-30">
                                <IconCheck
                                  className="w-4 h-4 text-green-800"
                                  aria-hidden="true"
                                  strokeWidth={2}
                                />
                              </div>
                              <p className="mb-0 ml-3 text-lg text-scale-1100">{feature}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs text-scale-900">{tier.scale}</p>
                        <p className="text-xs text-scale-900">{tier.shutdown}</p>
                      </div>
                      <a href={tier.href}>
                        <Button block size="large">
                          Get Started
                        </Button>
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="flex justify-start w-full max-w-5xl px-6 mx-auto mt-8 overflow-hidden lg:px-0">
            <div className="flex flex-col">
              <span className="text-scale-900">All plans include:</span>
              <ul role="list" className="divide-y">
                {allPlans.map((feature) => (
                  <li key={feature} className="flex items-center py-2">
                    <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 bg-opacity-30">
                      <IconCheck
                        className="w-4 h-4 text-green-800"
                        aria-hidden="true"
                        strokeWidth={2}
                      />
                    </div>
                    <p className="mb-0 ml-3 text-lg text-scale-1100">{feature}</p>
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <div className="relative px-4 mx-auto mt-12 max-w-7xl sm:px-6 lg:px-8">
            <div className="max-w-md mx-auto lg:max-w-5xl">
              <div className="px-6 py-8 border rounded-lg shadow-lg border-brand-500 bg-scale-100 sm:p-10 lg:flex lg:items-center">
                <div className="flex-1">
                  <div>
                    <h3 className="inline-flex px-4 py-1 text-sm font-semibold tracking-wide uppercase rounded-full bg-brand-600 bg-opacity-30 text-brand-1100">
                      Enterprise
                    </h3>
                  </div>
                  <div className="mt-4 text-lg text-scale-1100">
                    Get a custom plan, tailor made for your company's needs. Scale to millions of
                    users with enterprise grade features. Includes enterprise support + SLAs &amp;
                    SSO
                  </div>
                </div>

                <div className="mt-6 rounded-md shadow lg:mt-0 lg:ml-10 lg:flex-shrink-0">
                  <Link
                    href="mailto:support@supabase.io"
                    as="mailto:support@supabase.io"
                    passHref={true}
                  >
                    <Button as="a" size="large" type="outline" className="w-full">
                      Contact Us for Pricing
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-scale-800">
        <div className="container relative px-6 py-16 mx-auto lg:px-16 xl:px-20 md:pt-24 lg:pt-24">
          <div className="text-center">
            <h2 className="text-3xl">Compare plans</h2>
            <p className="mb-16 text-lg">
              Start with a hobby project, collaborate with a team, and scale to millions of users.
            </p>
          </div>

          {/* <!-- xs to lg --> */}
          <div className="lg:hidden">
            {/* Free - Mobile  */}
            <div className="px-4">
              <h2 className="text-lg font-medium leading-6 text-scale-900 dark:text-white">Free</h2>
              <p className="mt-4">
                <span className="text-4xl font-normal text-scale-900 dark:text-white">$0</span>
                <Typography.Text type="secondary">/project /month</Typography.Text>
              </p>
              <p className="my-4 text-sm text-scale-500">
                Perfect for hobby projects and experiments.
              </p>
              <Link href="https://app.supabase.io" as="https://app.supabase.io">
                <a>
                  <Button type="outline" size="medium" block>
                    Get started
                  </Button>
                </a>
              </Link>
            </div>
            <div className="container relative px-6 pt-24 mx-auto lg:px-16 xl:px-20 md:pt-24 lg:pt-24">
              <div className="text-center">
                <h1 className="h1">Predictable pricing, no surprises</h1>
                <p className="p">
                  Start with a hobby project, collaborate with a team, and scale to millions of
                  users.
                </p>
              </div>
            </div>
          </div>
          <div className="container relative px-0 py-16 mx-auto lg:px-16 xl:px-20 sm:py-18 md:py-24 lg:py-24">
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
                priceDescription={'/project /month plus usage costs'}
                description={'Designated support team, account manager and technical specialist'}
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
                <Accordion type="bordered">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-10 gap-x-10">
                    {pricingFaq.map((faq, i) => {
                      return (
                        <div>
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
