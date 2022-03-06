import React, { useState } from 'react'
import { useRouter } from 'next/router'
import Link from 'next/link'

import DefaultLayout from '~/components/Layouts/Default'
import { PricingTableRowDesktop, PricingTableRowMobile } from '~/components/PricingTableRow'
import { Accordion, Button } from '@supabase/ui'

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
      <div className="bg-white dark:bg-gray-800">
        <div className="container mx-auto px-6 lg:px-16 xl:px-20 relative pt-24 md:pt-24 lg:pt-24">
          <div className="text-center">
            <h1>Predictable pricing, no surprises</h1>
            <p>
              <p className="text-lg">
                Start with a hobby project, collaborate with a team, and scale to millions of users.
              </p>
            </p>
            <div className="grid grid-cols-12 gap-8 mt-16">
              {/* <div className="col-span-12 lg:col-span-6">
                <div className="rounded border border-green-500 dark:border-green-900 bg-green-500 bg-opacity-10 grid grid-cols-6">
                  <div className="p-6 col-span-6">
                    <Space className="mb-4">
                      <h3 className="flex gap-2">
                        Special Beta Pricing
                      </h3>
                      <Badge dot>Limited time offer</Badge>
                    </Space>
                    <p>
                      <p className="lg:text-lg mb-2">
                        Lock into permanent beta pricing for 2 years if you upgrade today.
                      </p>
                    </p>
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
                    <h4>Free tshirt</h4>
                    <p>
                      We are giving away free tshirts to anyone who signs up for the Beta Pro plan
                    </p>
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
                <p>/project /month</p>
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
                <p>/project /month</p>
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
                <p>/project /month plus usage costs</p>
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
                      className="absolute bottom-0 left-0 h-0.25 w-full bg-gray-200 dark:bg-scale-300"
                      style={{ height: '1px' }}
                    ></div>
                  </th>

                  <th
                    className=" bg-white dark:bg-gray-800  w-1/4 pb-4 px-6 text-left font-medium"
                    scope="col"
                  >
                    <h4>Free</h4>
                    <div
                      className="absolute bottom-0 left-0 h-0.25 w-full bg-gray-200 dark:bg-scale-300"
                      style={{ height: '1px' }}
                    ></div>
                  </th>

                  <th
                    className=" bg-white dark:bg-gray-800  w-1/4 pb-4 px-6 text-lg leading-6 font-medium text-gray-900 text-left"
                    scope="col"
                  >
                    <h4>Pro</h4>
                    <div
                      className="absolute bottom-0 left-0 h-0.25 w-full bg-gray-200 dark:bg-scale-300"
                      style={{ height: '1px' }}
                    ></div>
                  </th>

                  <th
                    className=" bg-white dark:bg-gray-800  w-1/4 pb-4 px-6 text-lg leading-6 font-medium text-gray-900 text-left"
                    scope="col"
                  >
                    <h4>Pay as you go</h4>
                    <div
                      className="absolute bottom-0 left-0 h-0.25 w-full bg-gray-200 dark:bg-scale-300"
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
                        <p> /project /month</p>
                      </p>
                      <p className="mt-4 mb-16 ">
                        <p>Perfect for hobby projects and experiments.</p>
                      </p>
                      <div className="absolute bottom-0">
                        <Link href="https://app.supabase.io" as="https://app.supabase.io">
                          <a>
                            <Button size="medium" type="outline">
                              Get started
                            </Button>
                          </a>
                        </Link>
                      </div>
                    </div>
                  </td>

                  <td className="h-full py-8 px-6 align-top">
                    <div className="relative h-full table">
                      <p>
                        <span className="text-4xl font-normal text-gray-900 dark:text-white">
                          $25
                        </span>
                        <p> /project /month</p>
                      </p>
                      <p className="mt-4 mb-16 ">
                        <p>Everything you need to scale your project into production.</p>
                      </p>
                      <div className="absolute bottom-0">
                        <Link href="https://app.supabase.io" as="https://app.supabase.io">
                          <a>
                            <Button size="medium" type="outline">
                              Get started
                            </Button>
                          </a>
                        </Link>
                      </div>
                    </div>
                  </td>

                  <td className="h-full py-8 px-6 align-top">
                    <div className="relative h-full table">
                      <p>
                        <span className="text-4xl font-normal text-gray-900 dark:text-white">
                          $25
                        </span>
                        <p> /project /month plus usage costs</p>
                      </p>
                      <p className="mt-4 mb-16 ">
                        <p>Designated support team, account manager and technical specialist.</p>
                      </p>
                      <div className="absolute bottom-0">
                        <Link href="https://app.supabase.io" as="https://app.supabase.io">
                          <a>
                            <Button size="medium" type="outline">
                              Get started
                            </Button>
                          </a>
                        </Link>
                      </div>
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
          <h2>Frequently asked questions</h2>
          <h1 className="w-5/12 mb-4">
            Can&apos;t find the answer to your question, ask someone in the community either on our
            Discord or GitHub.
          </h1>
          <Link href="https://discord.supabase.com">
            <a>
              <Button type="default" className="mr-2" size="small">
                Discord
              </Button>
            </a>
          </Link>
          <Link href="https://github.com/supabase/supabase/discussions">
            <a>
              <Button size="small">GitHub</Button>
            </a>
          </Link>
          <div className="mt-16">
            <div className="grid grid-cols-2 gap-y-10 gap-x-10">
              {pricingFaq.map((faq, i) => {
                return (
                  <div>
                    {/* @ts-ignore */}
                    <Accordion type="bordered" openBehaviour="multiple" size="medium">
                      <Accordion.Item header={faq.question} id={`faq--${i.toString()}`}>
                        <ReactMarkdown>{faq.answer}</ReactMarkdown>
                      </Accordion.Item>
                    </Accordion>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </div>

      <CTABanner />
    </DefaultLayout>
  )
}
