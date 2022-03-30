import { ServerIcon, SupportIcon } from '@heroicons/react/outline'
import { Accordion, Button, IconCheck } from '@supabase/ui'
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
      shutdown: 'Free projects are paused after 7 days of inactivity.',
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
        'Compute Add-Ons',
      ],
      scale: 'Additional fees apply for usage and storage beyond the limits above.',
      shutdown: '',
      cta: 'Get Started',
    },
    {
      name: 'Enterprise',
      href: '/contact/enterprise',
      description: 'For large-scale applications managing serious workloads.',
      features: [
        'Point in time recovery',
        'Designated Support manager & SLAs',
        'Enterprise OAuth providers',
        'SSO/SAML',
        'SOC2',
        'Custom contracts & invoicing',
        'On-premise support',
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
  }: {
    description: string
    priceDescription: string
    price: string
    tier: string
    showDollarSign?: boolean
  }) => {
    return (
      <div className="px-4 mt-8">
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
          <div className="px-4 mx-auto text-center max-w-7xl sm:px-6 lg:px-8">
            <div className="max-w-3xl mx-auto space-y-2 lg:max-w-none">
              <h1 className="text-base uppercase font-mono text-brand-900 tracking-widest">
                Pricing
              </h1>
              <h2 className="h1">Predictable pricing, no surprises</h2>
              <p className="p text-lg">
                Start building for free, collaborate with a team, then scale to millions of users
              </p>
            </div>
          </div>
        </div>

        <div className="flex flex-col max-w-7xl mx-auto">
          {/* <div className="absolute inset-0 shadow-sm bg-scale-200 h-3/5" /> */}

          <div
            className="relative z-10 px-4 mx-auto w-full sm:px-6 lg:px-8
          
            -mt-8
          "
          >
            <div className="max-w-md mx-auto space-y-4 lg:max-w-7xl lg:grid lg:grid-cols-3 lg:gap-5 lg:space-y-0">
              {tiers.map((tier) => (
                <div
                  key={tier.name}
                  className="
                  border 
                  flex 
                  flex-col
                  overflow-hidden 
                  rounded 
                  "
                >
                  <div className="h-60 px-8 pt-8 bg-white dark:bg-scale-300">
                    <h3
                      className="
                        inline-flex 
                        mb-2 
                        text-sm 
                        font-normal 
                        tracking-wide 
                        rounded-full 
                        lg:text-xl 
                        text-scale-1200"
                      id="tier-standard"
                    >
                      {tier.name}
                    </h3>
                    <div
                      className="
                      flex items-baseline text-5xl 
                      font-normal 
                      lg:text-4xl 
                      xl:text-4xl 
                      text-scale-1200
                      
                      "
                    >
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
                    <p className="mt-4 text-base text-scale-1100">{tier.description}</p>
                  </div>
                  <div
                    className="
                    flex flex-col justify-between flex-1
                    
                    space-y-6 
                    border-t 
                    dark:border-scale-400
                    
                    bg-scale-100 
                    dark:bg-scale-300 

                    px-8
                    py-8
                  "
                  >
                    {/* <p className="text-scale-900 text-sm">Included with plan:</p> */}
                    <ul role="list" className="divide-y dark:divide-scale-400">
                      {tier.features.map((feature) => (
                        <li key={feature} className="flex items-center py-2">
                          {/* <div className="flex items-center justify-center w-6 h-6 rounded-full bg-brand-600 dark:bg-brand-400 bg-opacity-30"> */}
                          <IconCheck
                            className="w-4 h-4 text-brand-900 "
                            aria-hidden="true"
                            strokeWidth={3}
                          />
                          {/* </div> */}
                          <p className="mb-0 ml-3 text-sm text-scale-1100 dark:text-scale-1200">
                            {feature}
                          </p>
                        </li>
                      ))}
                    </ul>

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

      <div className="container relative px-4 py-16 mx-auto shadow-sm lg:px-16 xl:px-20 sm:py-18 md:py-24 lg:py-24">
        <div className="text-center">
          <h2 className="text-3xl text-scale-1200">Add-Ons</h2>
          <p className="mb-16 text-lg text-scale-1100">
            Level up your Supabase experience with add-ons.
          </p>
        </div>

        <div className="space-y-8">
          <PricingAddOnTable
            icon={<ServerIcon className="w-8 h-8" strokeWidth={1.5} />}
            pricing={pricingAddOn.database}
          />
          <PricingAddOnTable
            icon={<SupportIcon className="w-8 h-8" strokeWidth={1.5} />}
            pricing={pricingAddOn.support}
          />
        </div>
      </div>

      <div className="bg-white dark:bg-scale-100">
        <div className="container relative px-4 py-16 mx-auto lg:px-16 xl:px-20 sm:py-18 md:py-24 lg:py-24">
          <div className="text-center">
            <h2 className="text-3xl text-scale-1200">Compare Plans</h2>
            <p className="mb-16 text-lg text-scale-1100">
              Start with a hobby project, collaborate with a team, and scale to millions of users.
            </p>
          </div>

          <div className="mb-16 sm:mb-18 md:mb-24 lg:mb-24">
            {/* <!-- xs to lg --> */}

            <div className="lg:hidden">
              {/* Free - Mobile  */}

              <MobileHeaders
                tier="Free"
                price={'0'}
                priceDescription={'/project/month'}
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
                category={pricing.dashboard}
                tier={'free'}
                icon={pricing.dashboard.icon}
              />
              <PricingTableRowMobile
                category={pricing.support}
                tier={'free'}
                icon={pricing.support.icon}
              />

              {/* Pro - Mobile  */}
              <MobileHeaders
                tier="Pro"
                price={'25'}
                priceDescription={'/project/month + usage costs'}
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
                category={pricing.dashboard}
                tier={'pro'}
                icon={pricing.dashboard.icon}
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
                category={pricing.dashboard}
                tier={'enterprise'}
                icon={pricing.dashboard.icon}
              />
              <PricingTableRowMobile
                category={pricing.support}
                tier={'enterprise'}
                icon={pricing.support.icon}
              />
            </div>

            {/* <!-- lg+ --> */}
            <div className="hidden lg:block">
              <table className="w-full h-px table-fixed">
                <caption className="sr-only">Pricing plan comparison</caption>
                <thead className="sticky z-10 top-[62px] border-b border-scale-700 dark:border-scale-400 bg-scale-200 dark:bg-scale-300">
                  <tr>
                    <th
                      className="relative px-6 py-4 text-sm font-normal text-left text-scale-1200"
                      scope="col"
                    >
                      <span className="sr-only">Feature by</span>
                      <span>Plans</span>
                      <div
                        className="absolute bottom-0 left-0 h-0.25 w-full"
                        style={{ height: '1px' }}
                      ></div>
                    </th>

                    <th
                      className="w-1/4 px-6 py-4 text-sm font-normal text-left text-scale-1200"
                      scope="col"
                    >
                      <span>Free</span>
                      <div
                        className="absolute bottom-0 left-0 h-0.25 w-full"
                        style={{ height: '1px' }}
                      ></div>
                    </th>

                    <th
                      className="w-1/4 px-6 py-4 text-sm font-normal leading-6 text-left text-scale-1200"
                      scope="col"
                    >
                      <span>Pro</span>
                      <div
                        className="absolute bottom-0 left-0 h-0.25 w-full"
                        style={{ height: '1px' }}
                      ></div>
                    </th>

                    <th
                      className="w-1/4 px-6 py-4 text-sm font-normal leading-6 text-left text-scale-1200"
                      scope="col"
                    >
                      <span>Enterprise</span>
                      <div
                        className="absolute bottom-0 left-0 h-0.25 w-full"
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
                        <p className="p">/project/month</p>

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
                        <p className="p">/project/month + usage costs</p>

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

                        <Link href="/contact/enterprise">
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
                    category={pricing.dashboard}
                    icon={pricing.dashboard.icon}
                  />
                  <PricingTableRowDesktop category={pricing.support} icon={pricing.support.icon} />
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
                      <Link href="/contact/enterprise">
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
