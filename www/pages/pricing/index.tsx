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
      <div className="container relative px-6 pt-24 mx-auto lg:px-16 xl:px-20 md:pt-24 lg:pt-24">
        <div className="text-center">
          <h1 className="h1">Predictable pricing, no surprises</h1>
          <p className="p">
            Start with a hobby project, collaborate with a team, and scale to millions of users.
          </p>
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
            priceDescription={'/project /month'}
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
            tier="Pay as you go"
            price={'25'}
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
                  <span>Pay as you go</span>
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
                          Get started
                        </Button>
                      </a>
                    </Link>
                  </div>
                </td>

                <td className="h-full px-6 py-8 align-top">
                  <div className="relative table h-full">
                    <span className="h1 text-scale-1200">$25</span>
                    <p className="p"> /project /month</p>

                    <p className="text-sm p">
                      Everything you need to scale your project into production
                    </p>

                    <Link href="https://app.supabase.io" as="https://app.supabase.io">
                      <a>
                        <Button size="medium" type="default">
                          Get started
                        </Button>
                      </a>
                    </Link>
                  </div>
                </td>

                <td className="h-full px-6 py-8 align-top">
                  <div className="relative table h-full">
                    <span className="h1 text-scale-1200">$25</span>
                    <p className="p"> /project /month plus usage costs</p>

                    <p className="text-sm p">
                      Designated support team, account manager and technical specialist
                    </p>

                    <Link href="https://app.supabase.io" as="https://app.supabase.io">
                      <a>
                        <Button size="medium" type="default">
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
              <PricingTableRowDesktop category={pricing.storage} icon={Solutions['storage'].icon} />
              <PricingTableRowDesktop category={pricing.dashboard} />
              <PricingTableRowDesktop category={pricing.support} />
            </tbody>
            <tfoot>
              <tr className="border-t border-gray-200 dark:border-gray-600">
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
            Can&apos;t find the answer to your question, ask someone in the community either on our
            Discord or GitHub.
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
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-y-10 gap-x-10">
              {pricingFaq.map((faq, i) => {
                return (
                  <div>
                    {/* @ts-ignore */}
                    <Accordion
                      type="bordered"
                      openBehaviour="multiple"
                      size="medium"
                      className=" text-scale-900 dark:text-white"
                    >
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
