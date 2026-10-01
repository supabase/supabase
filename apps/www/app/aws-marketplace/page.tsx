import { ArrowRight, Building2, Check, ExternalLink, ReceiptText, WalletCards } from 'lucide-react'
import type { Metadata } from 'next'
import Link from 'next/link'
import { Button } from 'ui'

import DefaultLayout from '@/components/Layouts/Default'
import SectionContainer from '@/components/Layouts/SectionContainer'
import SectionHeading from '@/components/Layouts/SectionHeading'
import Panel from '@/components/Panel'
import BackgroundPattern from '@/components/Partners/BackgroundPattern'

const AWS_MARKETPLACE_LISTING_URL = 'https://aws.amazon.com/marketplace/pp/prodview-zjciuce2qsb3q'
const AWS_MARKETPLACE_DOCS_URL = '/docs/guides/platform/aws-marketplace'
const ENTERPRISE_CONTACT_URL = 'https://forms.supabase.com/enterprise'

export const metadata: Metadata = {
  title: 'Supabase on AWS Marketplace',
  description:
    'Purchase Supabase through AWS Marketplace, apply spend toward your AWS commitment, or request a private offer.',
  openGraph: {
    title: 'Supabase on AWS Marketplace',
    description:
      'Purchase Supabase through AWS Marketplace, apply spend toward your AWS commitment, or request a private offer.',
    url: 'https://supabase.com/aws-marketplace',
    images: [{ url: 'https://supabase.com/images/og/supabase-og.png' }],
  },
}

const benefits = [
  {
    icon: WalletCards,
    title: 'Apply committed AWS spend',
    description:
      'Eligible Supabase purchases count toward an existing AWS spend commitment instead of becoming a separate card payment.',
  },
  {
    icon: ReceiptText,
    title: 'Consolidate billing',
    description:
      'AWS manages your billing details and charges, keeping Supabase spend with your existing AWS purchasing process.',
  },
  {
    icon: Building2,
    title: 'Keep using Supabase',
    description:
      'AWS Marketplace changes procurement and billing, not where you manage your Supabase projects.',
  },
]

const steps = [
  {
    title: 'Purchase through AWS',
    description: 'Choose a Pro or Team subscription from the Supabase listing on AWS Marketplace.',
  },
  {
    title: 'Return to Supabase',
    description: 'After subscribing, AWS directs you back to Supabase to complete the setup.',
  },
  {
    title: 'Link your organization',
    description: 'Choose the Supabase organization that AWS will manage and bill.',
  },
]

export default function AwsMarketplacePage() {
  return (
    <DefaultLayout>
      <div className="overflow-x-clip">
        <section
          className="relative isolate overflow-hidden border-b bg-alternative"
          aria-labelledby="aws-marketplace-title"
        >
          <BackgroundPattern variant="edges" className="h-full" />
          <SectionContainer className="z-10 flex flex-col items-center text-center">
            <span className="text-primary font-mono text-sm uppercase tracking-wide">
              AWS Marketplace
            </span>
            <h1
              id="aws-marketplace-title"
              className="mt-4 max-w-4xl text-balance text-4xl tracking-tight text-foreground sm:text-5xl lg:text-6xl"
            >
              Purchase Supabase through AWS Marketplace
            </h1>
            <p className="mt-5 max-w-2xl text-balance text-lg text-foreground-lighter">
              Use your AWS spend commitment for Supabase and manage charges through your existing
              AWS account.
            </p>
            <div className="mt-8 flex w-full flex-col justify-center gap-2 sm:w-auto sm:flex-row">
              <Button asChild variant="primary" size="medium" iconRight={<ExternalLink />}>
                <a href={AWS_MARKETPLACE_LISTING_URL} target="_blank" rel="noreferrer">
                  View purchase options
                </a>
              </Button>
              <Button asChild size="medium" iconRight={<ArrowRight />}>
                <a href={ENTERPRISE_CONTACT_URL}>Request a private offer</a>
              </Button>
            </div>
            <Link
              href={AWS_MARKETPLACE_DOCS_URL}
              className="mt-5 text-sm text-foreground-lighter underline underline-offset-4 hover:text-foreground transition-colors"
            >
              Read the setup guide
            </Link>
          </SectionContainer>
        </section>

        <section aria-label="AWS Marketplace benefits">
          <SectionContainer>
            <SectionHeading
              eyebrow="Why AWS Marketplace"
              title="Use the purchasing process you already have"
              description="AWS Marketplace provides another way to purchase Supabase without changing the Supabase product you use."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-3">
              {benefits.map(({ icon: Icon, title, description }) => (
                <Panel
                  key={title}
                  outerClassName="h-full hover:shadow-none!"
                  innerClassName="flex h-full flex-col gap-4 p-6"
                >
                  <div className="flex size-10 items-center justify-center rounded-md border bg-surface-200 text-foreground-light">
                    <Icon size={18} />
                  </div>
                  <h3>{title}</h3>
                  <p className="text-sm text-pretty text-foreground-lighter">{description}</p>
                </Panel>
              ))}
            </div>
          </SectionContainer>
        </section>

        <section className="border-y bg-alternative" aria-label="Purchase options">
          <SectionContainer>
            <SectionHeading
              eyebrow="Purchase options"
              title="Choose the path that fits your organization"
              description="Pro and Team are available from the public listing. Enterprise is available through a private offer."
            />
            <div className="mt-12 grid gap-6 md:grid-cols-2">
              <Panel
                outerClassName="h-full hover:shadow-none!"
                innerClassName="flex h-full flex-col p-6 lg:p-8"
              >
                <span className="font-mono text-xs uppercase tracking-wide text-foreground-lighter">
                  Self-serve
                </span>
                <h3 className="mt-3 text-2xl text-foreground">Pro and Team</h3>
                <p className="mt-3 flex-1 text-pretty text-foreground-lighter">
                  Subscribe through the public AWS Marketplace listing, then link the subscription
                  to a new or existing Supabase organization.
                </p>
                <Button
                  asChild
                  variant="primary"
                  size="small"
                  className="mt-8 self-start"
                  iconRight={<ExternalLink />}
                >
                  <a href={AWS_MARKETPLACE_LISTING_URL} target="_blank" rel="noreferrer">
                    View purchase options
                  </a>
                </Button>
              </Panel>

              <Panel
                outerClassName="h-full hover:shadow-none!"
                innerClassName="flex h-full flex-col p-6 lg:p-8"
              >
                <span className="font-mono text-xs uppercase tracking-wide text-foreground-lighter">
                  Private offer
                </span>
                <h3 className="mt-3 text-2xl text-foreground">Enterprise</h3>
                <p className="mt-3 flex-1 text-pretty text-foreground-lighter">
                  Talk to the Supabase team about committed terms and purchasing Enterprise through
                  a private AWS Marketplace offer.
                </p>
                <Button asChild size="small" className="mt-8 self-start" iconRight={<ArrowRight />}>
                  <a href={ENTERPRISE_CONTACT_URL}>Request a private offer</a>
                </Button>
              </Panel>
            </div>
          </SectionContainer>
        </section>

        <section aria-label="How AWS Marketplace setup works">
          <SectionContainer>
            <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
              <SectionHeading
                eyebrow="How it works"
                title="Purchase through AWS, then link Supabase"
                description="AWS Marketplace manages the subscription. Supabase continues to manage your projects and organization."
              />
              <ol className="grid gap-6">
                {steps.map((step, index) => (
                  <li key={step.title} className="flex gap-4 border-b pb-6 last:border-0">
                    <span className="font-mono text-sm text-foreground-lighter">
                      {String(index + 1).padStart(2, '0')}
                    </span>
                    <div>
                      <h3 className="text-lg text-foreground">{step.title}</h3>
                      <p className="mt-1 text-sm text-pretty text-foreground-lighter">
                        {step.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ol>
            </div>
          </SectionContainer>
        </section>

        <section className="border-y bg-alternative" aria-label="Before you purchase">
          <SectionContainer>
            <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,0.8fr)_minmax(0,1.2fr)] lg:gap-20">
              <SectionHeading
                eyebrow="Before you purchase"
                title="Understand how AWS-managed billing differs"
                description="Review the billing and plan-management differences before linking an organization."
              />
              <div>
                <ul role="list" className="space-y-4">
                  {[
                    'AWS manages billing details, payment methods, and plan changes.',
                    'Spend Cap is unavailable for AWS-managed organizations.',
                    'Each AWS Marketplace subscription links to one Supabase organization.',
                    'Linking an existing organization can create a final charge for usage incurred before the AWS subscription started.',
                  ].map((item) => (
                    <li key={item} className="flex items-start gap-3 text-foreground-light">
                      <Check size={16} className="mt-1 shrink-0 text-primary" />
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
                <Button asChild size="small" className="mt-8" iconRight={<ArrowRight />}>
                  <Link href={AWS_MARKETPLACE_DOCS_URL}>Read the setup guide</Link>
                </Button>
              </div>
            </div>
          </SectionContainer>
        </section>
      </div>
    </DefaultLayout>
  )
}
