import React, { useState } from 'react'
import { Badge, Button, Space, Typography } from '@supabase/ui'
import pricing from '~/data/Pricing.json'
import { PricingTableRowDesktop, PricingTableRowMobile } from '~/components/PricingTableRow'
import DefaultLayout from '~/components/Layouts/Default'

export default function IndexPage() {
  return (
    <DefaultLayout>
      <div className="bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto py-16 sm:py-24 sm:px-6 lg:px-8">
          <div className="">
            <Typography.Title>Predictable pricing, no surprises</Typography.Title>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto py-16 sm:py-24 sm:px-6 lg:px-8">
          {/* <!-- xs to lg --> */}

          <div className="max-w-2xl mx-auto lg:hidden">
            {/* Free - Mobile  */}
            <div className="px-4">
              <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Free</h2>
              <p className="mt-4">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">$0</span>
                <Typography.Text type="secondary">/project /month</Typography.Text>
              </p>
              <p className="my-4 text-sm text-gray-500">
                Quis suspendisse ut fermentum neque vivamus non tellus.
              </p>
              <Button type="outline" size="medium" block>
                Get started
              </Button>
            </div>

            <PricingTableRowMobile category={pricing.database} tier={'free'} />
            <PricingTableRowMobile category={pricing.auth} tier={'free'} />
            <PricingTableRowMobile category={pricing.storage} tier={'free'} />
            <PricingTableRowMobile category={pricing.dashboard} tier={'free'} />
            <PricingTableRowMobile category={pricing.support} tier={'free'} />

            <div className="border-t border-gray-200 px-4 pt-5 dark:border-gray-600 mb-16">
              <a
                href="#"
                className="block w-full bg-gray-800 border border-gray-800 rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-gray-900"
              >
                Buy Basic
              </a>
            </div>

            {/* Pro - Mobile  */}
            <div className="px-4">
              <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">Pro</h2>
              <p className="mt-4">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">$25</span>
                <Typography.Text type="secondary">/project /month</Typography.Text>
              </p>
              <p className="my-4 text-sm text-gray-500">
                Quis suspendisse ut fermentum neque vivamus non tellus.
              </p>
              <Button type="outline" size="medium" block>
                Get started
              </Button>
            </div>

            <PricingTableRowMobile category={pricing.database} tier={'pro'} />
            <PricingTableRowMobile category={pricing.auth} tier={'pro'} />
            <PricingTableRowMobile category={pricing.storage} tier={'pro'} />
            <PricingTableRowMobile category={pricing.dashboard} tier={'pro'} />
            <PricingTableRowMobile category={pricing.support} tier={'pro'} />

            <div className="border-t border-gray-200 px-4 pt-5 dark:border-gray-600 mb-16">
              <a
                href="#"
                className="block w-full bg-gray-800 border border-gray-800 rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-gray-900"
              >
                Buy Basic
              </a>
            </div>

            {/* Enterprise - Mobile  */}
            <div className="px-4">
              <h2 className="text-lg leading-6 font-medium text-gray-900 dark:text-white">
                Pay as you go
              </h2>
              <p className="mt-4">
                <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                  Contact us
                </span>
              </p>
              <p className="my-4 text-sm text-gray-500">
                Quis suspendisse ut fermentum neque vivamus non tellus.
              </p>
              <Button type="outline" size="medium" block>
                Get started
              </Button>
            </div>

            <PricingTableRowMobile category={pricing.database} tier={'enterprise'} />
            <PricingTableRowMobile category={pricing.auth} tier={'enterprise'} />
            <PricingTableRowMobile category={pricing.storage} tier={'enterprise'} />
            <PricingTableRowMobile category={pricing.dashboard} tier={'enterprise'} />
            <PricingTableRowMobile category={pricing.support} tier={'enterprise'} />

            <div className="border-t border-gray-200 px-4 pt-5 dark:border-gray-600 mb-16">
              <a
                href="#"
                className="block w-full bg-gray-800 border border-gray-800 rounded-md py-2 text-sm font-semibold text-white text-center hover:bg-gray-900"
              >
                Buy Basic
              </a>
            </div>
          </div>

          {/* <!-- lg+ --> */}
          <div className="hidden lg:block">
            <table className="w-full h-px table-fixed">
              <caption className="sr-only">Pricing plan comparison</caption>
              <thead>
                <tr>
                  <th
                    className="pb-4 px-6 text-sm font-medium text-gray-900 dark:text-white text-left"
                    scope="col"
                  >
                    <span className="sr-only">Feature by</span>
                    <span>Plans</span>
                  </th>

                  <th className="w-1/4 pb-4 px-6 text-left font-medium" scope="col">
                    <Typography.Title level={4}>Free</Typography.Title>
                  </th>

                  <th
                    className="w-1/4 pb-4 px-6 text-lg leading-6 font-medium text-gray-900 text-left"
                    scope="col"
                  >
                    <Typography.Title level={4}>Pro</Typography.Title>
                  </th>

                  <th
                    className="w-1/4 pb-4 px-6 text-lg leading-6 font-medium text-gray-900 text-left"
                    scope="col"
                  >
                    <Typography.Title level={4}>Pay as you go</Typography.Title>
                  </th>
                </tr>
              </thead>
              <tbody className="border-t border-gray-200 dark:border-gray-600 divide-y divide-gray-200 dark:divide-gray-700">
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
                        <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                          $0
                        </span>
                        <Typography.Text> /project /month</Typography.Text>
                      </p>
                      <p className="mt-4 mb-16 ">
                        <Typography.Text>
                          Perfect for hobby projects and experiments.
                        </Typography.Text>
                      </p>
                      <Button size="medium" type="outline" className="absolute bottom-0">
                        Get started
                      </Button>
                    </div>
                  </td>

                  <td className="h-full py-8 px-6 align-top">
                    <div className="relative h-full table">
                      <p>
                        <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                          $25
                        </span>
                        <Typography.Text> /project /month</Typography.Text>
                      </p>
                      <p className="mt-4 mb-16 ">
                        <Typography.Text>
                          Everything you need to scale your project into production.
                        </Typography.Text>
                      </p>
                      <Button size="medium" type="outline" className="absolute bottom-0">
                        Get started
                      </Button>
                    </div>
                  </td>

                  <td className="h-full py-8 px-6 align-top">
                    <div className="relative h-full table">
                      <p>
                        <span className="text-4xl font-extrabold text-gray-900 dark:text-white">
                          Contact us
                        </span>
                      </p>
                      <p className="mt-4 mb-16 ">
                        <Typography.Text>
                          Dedicated support team, account managaer and technical specialist.
                        </Typography.Text>
                      </p>
                      <Button size="medium" type="outline" className="absolute bottom-0">
                        Get started
                      </Button>
                    </div>
                  </td>
                </tr>

                <PricingTableRowDesktop category={pricing.database} />
                <PricingTableRowDesktop category={pricing.auth} />
                <PricingTableRowDesktop category={pricing.storage} />
                <PricingTableRowDesktop category={pricing.dashboard} />
                <PricingTableRowDesktop category={pricing.support} />
              </tbody>
              <tfoot>
                <tr className="border-t border-gray-200 dark:border-gray-600">
                  <th className="sr-only" scope="row">
                    Choose your plan
                  </th>

                  <td className="pt-5 px-6">
                    <Button size="medium" type="outline" block>
                      FREE Get started
                    </Button>
                  </td>

                  <td className="pt-5 px-6">
                    <Button size="medium" type="outline" block>
                      Pro | Get started
                    </Button>
                  </td>

                  <td className="pt-5 px-6">
                    <Button size="medium" type="outline" block>
                      Enterprise | Contact us
                    </Button>
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      </div>

      <div className="bg-gray-50 dark:bg-gray-800 border-t dark:border-gray-600">
        <div className="max-w-7xl mx-auto py-16 px-4 sm:py-24 sm:px-6 lg:px-8">
          <h2 className="text-3xl text-gray-900 dark:text-white">Frequently asked questions</h2>
          <div className="mt-6 border-t border-gray-600 border-opacity-25 pt-10">
            <dl className="space-y-10 md:space-y-0 md:grid md:grid-cols-2 md:grid-rows-2 md:gap-x-8 md:gap-y-12">
              <div>
                <dt className="text-lg leading-6 font-medium text-white">
                  <Typography.Title level={4}>
                    What happens when I go over my limits?
                  </Typography.Title>
                </dt>
                <dd className="mt-2 text-base ">
                  <Typography.Text>
                    All soft-limits. We will reach out to you if you go over a limit.
                  </Typography.Text>
                </dd>
              </div>

              <div>
                <dt className="text-lg leading-6 font-medium text-white">
                  <Typography.Title level={4}>
                    Will there be downtime if I need to upgrade my database?
                  </Typography.Title>
                </dt>
                <dd className="mt-2 text-base ">
                  <Typography.Text>
                    During Beta, there will be downtime. If you are on the Base tier, we will be
                    able to increase
                  </Typography.Text>
                </dd>
              </div>

              <div>
                <dt className="text-lg leading-6 font-medium text-white">
                  <Typography.Title level={4}>
                    Can I disable the Database/Auth/Storage?
                  </Typography.Title>
                </dt>
                <dd className="mt-2 text-base ">
                  <Typography.Text>
                    Not yet. All of them are required while we are in Beta. Soon you will be able to
                    disable functionality which you don't use.
                  </Typography.Text>
                </dd>
              </div>

              <div>
                <dt className="text-lg leading-6 font-medium text-white">
                  <Typography.Title level={4}>
                    What CPU architecture is in the database?
                  </Typography.Title>
                </dt>
                <dd className="mt-2 text-base ">
                  <Typography.Text>ARM because it's awesome. Add an ARM icon?</Typography.Text>
                </dd>
              </div>

              <div>
                <dt className="text-lg leading-6 font-medium text-white">
                  <Typography.Title level={4}>Database data egress</Typography.Title>
                </dt>
                <dd className="mt-2 text-base ">
                  <Typography.Text>
                    Fair usage during Beta. We're using Beta to get an understandig.
                  </Typography.Text>
                </dd>
              </div>
              <div>
                <dt className="text-lg leading-6 font-medium text-white">
                  <Typography.Title level={4}>PIT Backup?</Typography.Title>
                </dt>
                <dd className="mt-2 text-base ">
                  <Typography.Text>Describe.</Typography.Text>
                </dd>
              </div>

              <div>
                <dt className="text-lg leading-6 font-medium text-white">
                  <Typography.Title level={4}>What about functions?</Typography.Title>
                </dt>
                <dd className="mt-2 text-base ">
                  <Typography.Text>You can use RPC or Serverless coming soon.</Typography.Text>
                </dd>
              </div>

              <div>
                <dt className="text-lg leading-6 font-medium text-white">
                  <Typography.Title level={4}>What are auth transactional emails?</Typography.Title>
                </dt>
                <dd className="mt-2 text-base ">
                  <Typography.Text>TBD.</Typography.Text>
                </dd>
              </div>

              <div>
                <dt className="text-lg leading-6 font-medium text-white">
                  <Typography.Title level={4}>Can I do annual pricing?</Typography.Title>
                </dt>
                <dd className="mt-2 text-base ">
                  <Typography.Text>TBD.</Typography.Text>
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </div>
    </DefaultLayout>
  )
}
