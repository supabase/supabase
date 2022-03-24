import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

import DefaultLayout from '~/components/Layouts/Default'
import { PricingTableRowDesktop, PricingTableRowMobile } from '~/components/PricingTableRow'
import { Accordion, Badge, Button, Divider, IconCheck, Space, Typography } from '@supabase/ui'

import pricing from '~/data/Pricing.json'
import pricingFaq from '~/data/PricingFAQ.json'
import ReactMarkdown from 'react-markdown'
import CTABanner from '~/components/CTABanner'

import Solutions from 'data/Solutions.json'
import { NextSeo } from 'next-seo'

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
        '10K authenticated users',
        '500MB Database',
        '1GB Storage',
        '25 Realtime connections',
        '1 day backup',
        'Standard support',
      ],
      scale: 'Anything more than the above you must upgrade',
      shutdown: 'Free projects are shutdown after 7 days of inactivity.',
    },
    {
      name: 'Pay As You Go',
      href: '#',
      priceMonthly: 25,
      warning: '+ usage costs',
      description: 'Everything you need to scale your project into production.',
      features: [
        '100K authenticated users',
        '8GB Database',
        '50GB Storage',
        'Unlimited Realtime connections',
        '7 days backup',
        'High priority support',
      ],
      scale: 'Additional fees apply for usage and storage beyond the limits above.',
      shutdown: '',
    },
  ]

  const allPlans = [
    'Custom SMTP server',
    '0Auth Providers',
    'Dedicated project instance',
    'Unlimited API requests',
  ]

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

      <div className="bg-gray-800">
        <div className="pt-12 sm:pt-16 lg:pt-24">
          <div className="max-w-7xl mx-auto text-center px-4 sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-2 lg:max-w-none">
              <h2 className="text-lg leading-6 font-semibold text-gray-300 uppercase tracking-wider">
                Pricing
              </h2>
              <p className="text-3xl text-white sm:text-4xl lg:text-5xl">
                Predictable pricing, no surprises
              </p>
              <p className="text-xl text-gray-300">
                Lorem ipsum dolor, sit amet consectetur adipisicing elit. Harum sequi unde
                repudiandae natus.
              </p>
            </div>
          </div>
        </div>
        <div className="mt-8 pb-12 bg-gray-50 dark:bg-gray-700 sm:mt-12 sm:pb-16 lg:mt-16 lg:pb-24">
          <div className="relative">
            <div className="absolute inset-0 h-3/4 bg-gray-800" />
            <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="max-w-md mx-auto space-y-4 lg:max-w-5xl lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0">
                {tiers.map((tier) => (
                  <div
                    key={tier.name}
                    className="flex flex-col rounded-lg shadow-lg overflow-hidden border dark:border-dark"
                  >
                    <div className="px-10 bg-white dark:bg-gray-700 pt-8 h-64">
                      <h3
                        className="inline-flex rounded-full text-sm font-normal tracking-wide lg:text-xl mb-2 dark:text-gray-200"
                        id="tier-standard"
                      >
                        {tier.name}
                      </h3>
                      <div className="flex items-baseline text-6xl font-extrabold dark:text-white">
                        ${tier.priceMonthly}
                        <span className="ml-1 text-2xl font-medium text-gray-500">/mo</span>
                      </div>
                      {tier.warning && (
                        <span className="mt-4 text-xs  bg-brand-100 bg-opacity-30 text-brand-900 dark:text-brand-600 relative rounded-md px-2 py-1">
                          {tier.warning}
                        </span>
                      )}
                      <p className="mt-4 text-lg text-gray-500">{tier.description}</p>
                    </div>
                    <div className="flex-1 flex flex-col justify-between px-6 pt-6 pb-8 bg-gray-50 dark:bg-gray-700 border-t dark:border-dark space-y-6 sm:p-10 sm:pt-6">
                      <div>
                        <p className="text-gray-400 dark:text-gray-300">Included for free:</p>
                        <ul role="list" className="divide-y dark:divide-gray-600">
                          {tier.features.map((feature) => (
                            <li key={feature} className="flex items-start py-2 items-center">
                              <div className="h-6 w-6 bg-brand-600 bg-opacity-30 rounded-full flex items-center justify-center">
                                <IconCheck
                                  className="h-4 w-4 text-green-500"
                                  aria-hidden="true"
                                  strokeWidth={2}
                                />
                              </div>
                              <p className="ml-3 text-lg text-gray-700 dark:text-gray-100 mb-0">
                                {feature}
                              </p>
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500">{tier.scale}</p>
                        <p className="text-xs text-gray-500">{tier.shutdown}</p>
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

          <div>
            All plans include:
            <ul role="list">
              {allPlans.map((feature) => (
                <li key={feature} className="flex items-start mb-1">
                  <div className="flex-shrink-0">
                    <IconCheck className="h-6 w-6 text-green-500" aria-hidden="true" />
                  </div>
                  <p className="ml-3 text-lg text-gray-700 dark:text-gray-100 mb-0">{feature}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="mt-4 relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 lg:mt-5">
            <div className="max-w-md mx-auto lg:max-w-5xl">
              <div className="rounded-lg bg-gray-100 border dark:border-dark dark:bg-gray-700 px-6 py-8 sm:p-10 lg:flex lg:items-center">
                <div className="flex-1">
                  <div>
                    <h3 className="inline-flex px-4 py-1 rounded-full text-sm font-semibold tracking-wide uppercase bg-white text-gray-800">
                      Enterprise
                    </h3>
                  </div>
                  <div className="mt-4 text-lg text-gray-600">
                    Get full access to all of standard license features for solo projects that make
                    less than $20k gross revenue for{' '}
                    <span className="font-semibold text-gray-900">$29</span>.
                  </div>
                </div>
                <div className="mt-6 rounded-md shadow lg:mt-0 lg:ml-10 lg:flex-shrink-0">
                  <a
                    href="#"
                    className="flex items-center justify-center px-5 py-3 border border-transparent text-base font-medium rounded-md text-gray-900 bg-white hover:bg-gray-50"
                  >
                    Contact us for Pricing
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800">
        <div className="container mx-auto px-6 lg:px-16 xl:px-20 relative md:pt-24 lg:pt-24 py-16">
          <div className="text-center">
            <h2 className="text-3xl">Compare plans</h2>
            <p className="text-lg mb-16">
              Start with a hobby project, collaborate with a team, and scale to millions of users.
            </p>
          </div>

          {/* <!-- xs to lg --> */}
          <div className=" lg:hidden">
            {/* Free - Mobile  */}
            <div className="px-4">
              <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Free</h2>
              <p className="mt-4">
                <span className="text-4xl font-normal text-gray-900 dark:text-white">$0</span>
                <Typography.Text type="secondary">/project /month</Typography.Text>
              </p>
              <p className="my-4 text-sm text-gray-500">
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
            <div className="px-4 mt-16">
              <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Pro</h2>
              <p className="mt-4">
                <span className="text-4xl font-normal text-gray-900 dark:text-white">$25</span>
                <Typography.Text type="secondary">/project /month</Typography.Text>
              </p>
              <p className="my-4 text-sm text-gray-500">
                Everything you need to scale your project into production.
              </p>
              <Link href="https://app.supabase.io" as="https://app.supabase.io">
                <a>
                  <Button type="outline" size="medium" block>
                    Get started
                  </Button>
                </a>
              </Link>
            </div>

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
            <div className="px-4 mt-16">
              <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Pay as you go
              </h2>
              <p className="mt-4">
                <span className="text-4xl font-normal text-gray-900 dark:text-white">$25</span>
                <Typography.Text type="secondary">/project /month plus usage costs</Typography.Text>
              </p>
              <p className="my-4 text-sm text-gray-500">
                Designated support team, account manager and technical specialist.
              </p>
              <Link href="https://app.supabase.io" as="https://app.supabase.io">
                <a>
                  <Button type="outline" size="medium" block>
                    Get started
                  </Button>
                </a>
              </Link>
            </div>

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
              <thead className="thead--plans sticky z-10 top-[62px]">
                <tr>
                  <th
                    className="relative bg-white dark:bg-gray-800  pb-4 px-6 text-sm font-medium text-gray-900 dark:text-white text-left"
                    scope="col"
                  >
                    <span className="sr-only">Feature by</span>
                    <span>Plans</span>
                    <div
                      className="absolute bottom-0 left-0 h-0.25 w-full bg-gray-200 dark:bg-gray-600"
                      style={{ height: '1px' }}
                    ></div>
                  </th>

                  <th
                    className=" bg-white dark:bg-gray-800  w-1/4 pb-4 px-6 text-left font-medium"
                    scope="col"
                  >
                    <Typography.Title level={4}>Free</Typography.Title>
                    <div
                      className="absolute bottom-0 left-0 h-0.25 w-full bg-gray-200 dark:bg-gray-600"
                      style={{ height: '1px' }}
                    ></div>
                  </th>

                  <th
                    className=" bg-white dark:bg-gray-800  w-1/4 pb-4 px-6 text-lg leading-6 font-medium text-gray-900 text-left"
                    scope="col"
                  >
                    <Typography.Title level={4}>Pro</Typography.Title>
                    <div
                      className="absolute bottom-0 left-0 h-0.25 w-full bg-gray-200 dark:bg-gray-600"
                      style={{ height: '1px' }}
                    ></div>
                  </th>

                  <th
                    className=" bg-white dark:bg-gray-800  w-1/4 pb-4 px-6 text-lg leading-6 font-medium text-gray-900 text-left"
                    scope="col"
                  >
                    <Typography.Title level={4}>Pay as you go</Typography.Title>
                    <div
                      className="absolute bottom-0 left-0 h-0.25 w-full bg-gray-200 dark:bg-gray-600"
                      style={{ height: '1px' }}
                    ></div>
                  </th>
                </tr>
              </thead>
              <tbody className="border-gray-200 dark:border-gray-600 divide-y divide-gray-200 dark:divide-gray-700">
                <tr className="divide-x dark:divide-gray-700">
                  <th
                    className="py-8 px-6 text-sm font-medium text-gray-900 dark:text-white text-left align-top"
                    scope="row"
                  >
                    Pricing
                  </th>

                  <td className="h-full py-8 px-6 align-top">
                    <div className="relative h-full table">
                      <p>
                        <span className="text-4xl font-normal text-gray-900 dark:text-white">
                          $0
                        </span>
                        <Typography.Text> /project /month</Typography.Text>
                      </p>
                      <p className="mt-4 mb-16 ">
                        <Typography.Text>
                          Perfect for hobby projects and experiments.
                        </Typography.Text>
                      </p>
                      <Link href="https://app.supabase.io" as="https://app.supabase.io">
                        <a>
                          <Button size="medium" type="outline" className="absolute bottom-0">
                            Get started
                          </Button>
                        </a>
                      </Link>
                    </div>
                  </td>

                  <td className="h-full py-8 px-6 align-top">
                    <div className="relative h-full table">
                      <p>
                        <span className="text-4xl font-normal text-gray-900 dark:text-white">
                          $25
                        </span>
                        <Typography.Text> /project /month</Typography.Text>
                      </p>
                      <p className="mt-4 mb-16 ">
                        <Typography.Text>
                          Everything you need to scale your project into production.
                        </Typography.Text>
                      </p>
                      <Link href="https://app.supabase.io" as="https://app.supabase.io">
                        <a>
                          <Button size="medium" type="outline" className="absolute bottom-0">
                            Get started
                          </Button>
                        </a>
                      </Link>
                    </div>
                  </td>

                  <td className="h-full py-8 px-6 align-top">
                    <div className="relative h-full table">
                      <p>
                        <span className="text-4xl font-normal text-gray-900 dark:text-white">
                          $25
                        </span>
                        <Typography.Text> /project /month plus usage costs</Typography.Text>
                      </p>
                      <p className="mt-4 mb-16 ">
                        <Typography.Text>
                          Designated support team, account manager and technical specialist.
                        </Typography.Text>
                      </p>
                      <Link href="https://app.supabase.io" as="https://app.supabase.io">
                        <a>
                          <Button size="medium" type="outline" className="absolute bottom-0">
                            Get started
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
                <tr className="border-t border-gray-200 dark:border-gray-600">
                  <th className="sr-only" scope="row">
                    Choose your plan
                  </th>

                  <td className="pt-5 px-6">
                    <Link href="https://app.supabase.io" as="https://app.supabase.io">
                      <a>
                        <Button size="medium" type="outline" block>
                          Get started
                        </Button>
                      </a>
                    </Link>
                  </td>

                  <td className="pt-5 px-6">
                    <Link href="https://app.supabase.io" as="https://app.supabase.io">
                      <a>
                        <Button size="medium" type="outline" block>
                          Get started
                        </Button>
                      </a>
                    </Link>
                  </td>

                  <td className="pt-5 px-6">
                    <Link href="mailto:support@supabase.io" as="mailto:support@supabase.io">
                      <a>
                        <Button size="medium" type="outline" block>
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

      <div className="bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-600">
        <div className="container mx-auto px-6 lg:px-16 xl:px-20 relative py-16 sm:py-18 md:py-24 lg:py-24">
          <Typography.Title level={2}>Frequently asked questions</Typography.Title>
          <Typography className="w-5/12 mb-4">
            Can&apos;t find the answer to your question, ask someone in the community either on our
            Discord or Github.
          </Typography>
          <Link href="https://discord.supabase.com">
            <a>
              <Button type="default" className="mr-2" size="small">
                Discord
              </Button>
            </a>
          </Link>
          <Link href="https://github.com/supabase/supabase/discussions">
            <a>
              <Button size="small">Github</Button>
            </a>
          </Link>
          <div className="mt-16">
            {/* <div className="grid grid-cols-2 gap-y-10 gap-x-10"> */}
            <Accordion>
              {pricingFaq.map((faq) => {
                return (
                  <div>
                    <Accordion.Item label={<span className="text-xl">{faq.question}</span>}>
                      <Typography>
                        <p className="text-gray-500 dark:text-gray-400 m-0">{faq.answer}</p>
                      </Typography>
                    </Accordion.Item>
                  </div>
                )
              })}
            </Accordion>
            {/* </div> */}
          </div>
        </div>
      </div>

      <CTABanner />
    </DefaultLayout>
  )
}
