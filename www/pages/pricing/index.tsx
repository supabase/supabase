import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

import DefaultLayout from '~/components/Layouts/Default'
import { PricingTableRowDesktop, PricingTableRowMobile } from '~/components/PricingTableRow'
import { Badge, Button, Divider, Space, Typography } from '@supabase/ui'

import pricing from '~/data/Pricing.json'
import pricingFaq from '~/data/PricingFAQ.json'
import ReactMarkdown from 'react-markdown'
import CTABanner from '~/components/CTABanner'

import Solutions from 'data/Solutions.json'

export default function IndexPage() {
  const { basePath } = useRouter()

  return (
    <DefaultLayout>
      <div className="bg-white dark:bg-gray-800">
        <div className="container mx-auto px-6 lg:px-16 xl:px-20 relative pt-24 md:pt-24 lg:pt-24">
          <div className="text-center">
            <Typography.Title>Predictable pricing, no surprises</Typography.Title>
            <Typography.Text>
              <p className="text-lg">
                Start with a hobby project, collaborate with a team, and scale to millions of users.
              </p>
            </Typography.Text>
            <div className="grid grid-cols-12 gap-8 mt-16">
              {/* <div className="col-span-12 lg:col-span-6">
                <div className="rounded border border-green-500 dark:border-green-900 bg-green-500 bg-opacity-10 grid grid-cols-6">
                  <div className="p-6 col-span-6">
                    <Space className="mb-4">
                      <Typography.Title level={3} className="flex gap-2">
                        Special Beta Pricing
                      </Typography.Title>
                      <Badge dot>Limited time offer</Badge>
                    </Space>
                    <Typography.Text>
                      <p className="lg:text-lg mb-2">
                        Lock into permanent beta pricing for 2 years if you upgrade today.
                      </p>
                    </Typography.Text>
                  </div>
                </div>
              </div> */}
              {/* <div className="col-span-12 lg:col-span-6">
                <div className="rounded border border-gray-200 dark:border-gray-600 grid grid-cols-12">
                  <img
                    src={`${basePath}/images/t-shirt-promo.jpg`}
                    className="col-span-6 h-30 object-cover"
                  />
                  <div className="p-6 lg:col-span-6">
                    <Typography.Title level={4}>Free tshirt</Typography.Title>
                    <Typography.Text>
                      We are giving away free tshirts to anyone who signs up for the Beta Pro plan
                    </Typography.Text>
                  </div>
                </div>
              </div> */}
            </div>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800">
        <div className="container mx-auto px-0 lg:px-16 xl:px-20 relative py-16 sm:py-18 md:py-24 lg:py-24">
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
                Dedicated support team, account manager and technical specialist.
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
              <thead className="thead--plans">
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
                          Dedicated support team, account manager and technical specialist.
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
          <div className="mt-16">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:grid-rows-2 md:gap-x-8 md:gap-y-12">
              {pricingFaq.map((faq, i) => {
                return (
                  <div>
                    <dt className="text-lg leading-6 font-medium text-white">
                      <Typography.Title level={4}>{faq.question}</Typography.Title>
                    </dt>
                    <dd className="mt-2 text-base ">
                      <Typography>
                        <ReactMarkdown>{faq.answer}</ReactMarkdown>
                      </Typography>
                    </dd>
                  </div>
                )
              })}
            </dl>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-600">
        <div className="container mx-auto px-6 lg:px-16 xl:px-20 relative py-16 sm:py-18 md:py-24 lg:py-24">
          <Typography.Title level={2}>Changelog</Typography.Title>

          <div className="mt-4">
            <Typography.Title level={4}>28 July 2021</Typography.Title>
            <Typography className="w-full">
              <p>
                Clarified pricing on the "Optimzed database instances" to include the starting price
                of $50/month.
              </p>
            </Typography>
          </div>
          <div className="mt-4">
            <Typography.Title level={4}>29 March 2021</Typography.Title>
            <Typography>Released our Beta pricing.</Typography>
          </div>
        </div>
      </div>

      <CTABanner />
    </DefaultLayout>
  )
}
