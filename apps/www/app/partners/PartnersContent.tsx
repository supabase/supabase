'use client'

import { ArrowRight, Check } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger, Button } from 'ui'

import BackgroundPattern from '../../components/Partners/BackgroundPattern'
import DefaultLayout from '@/components/Layouts/Default'
import SectionContainer from '@/components/Layouts/SectionContainer'
import SectionHeading from '@/components/Layouts/SectionHeading'
import Panel from '@/components/Panel'
import BecomeAPartner from '@/components/Partners/BecomeAPartner'
import ProductHeaderCentered from '@/components/Sections/ProductHeaderCentered'
import pageData, { PARTNER_FORM_ANCHOR, type PARTNER_TIER } from '@/data/partners'

type FeaturedPartner = { slug: string; title: string; logo: string }

interface Props {
  featuredPartners: FeaturedPartner[]
}

const FaqList = ({ items }: { items: { question: string; answer: string }[] }) => {
  return (
    <Accordion type="multiple" className="text-foreground-light">
      {items.map((faq, i) => {
        return (
          <div className="border-b py-2" key={i}>
            <AccordionItem value={`faq--${i.toString()}`} className="border-none">
              <AccordionTrigger>
                <span className="text-foreground">{faq.question}</span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="prose text-foreground-lighter">
                  <ReactMarkdown>{faq.answer}</ReactMarkdown>
                </div>
              </AccordionContent>
            </AccordionItem>
          </div>
        )
      })}
    </Accordion>
  )
}

export default function PartnersContent({ featuredPartners }: Props) {
  const { heroSection } = pageData

  return (
    <DefaultLayout>
      {/* Hero */}
      <div className="relative bg-alternative border-b">
        <BackgroundPattern />
        <SectionContainer>
          <ProductHeaderCentered
            title={heroSection.title}
            h1={heroSection.h1}
            subheader={heroSection.subheader}
            cta={heroSection.cta}
            secondaryCta={heroSection.secondaryCta}
          />
        </SectionContainer>
      </div>

      {/* Three reasons to partner */}
      <SectionContainer>
        <SectionHeading
          eyebrow={pageData.reasonsSection.eyebrow}
          title={pageData.reasonsSection.title}
          description={pageData.reasonsSection.description}
        />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {pageData.reasons.map((reason) => (
            <Panel
              key={reason.title}
              outerClassName="h-full hover:shadow-none!"
              innerClassName="flex flex-col gap-3 p-4 lg:p-6"
            >
              <h3 className="text-foreground text-xl tracking-tight">{reason.title}</h3>
              <p className="text-foreground-lighter text-sm text-pretty">{reason.description}</p>
            </Panel>
          ))}
        </div>
      </SectionContainer>

      {/* Ways to partner */}
      <div className="bg-alternative border-y">
        <SectionContainer>
          <div className="mt-10 grid gap-6 md:grid-cols-3 md:grid-rows-[auto_auto] md:gap-y-0">
            <div>
              <SectionHeading eyebrow="Programs" title={pageData.waysToPartner.title} />
              <Button asChild type="default" size="small" className="mt-6">
                <Link href={PARTNER_FORM_ANCHOR} target="_blank">
                  Apply to partner with Supabase
                </Link>
              </Button>
            </div>
            {pageData.waysToPartner.tiers.map((tier: PARTNER_TIER) => {
              const timeToLaunch = (tier as { timeToLaunch?: string }).timeToLaunch
              return (
                <Panel
                  key={tier.title}
                  outerClassName="hover:shadow-none! md:row-span-2 md:grid md:grid-rows-subgrid"
                  innerClassName="inset-x-0 h-full md:grid md:grid-rows-subgrid md:row-span-2"
                >
                  <div className="items-start space-y-3 p-4 lg:p-6">
                    <h3 className="text-foreground text-xl tracking-tight">{tier.title}</h3>
                    <p className="text-foreground-lighter text-sm text-pretty flex-1">
                      {tier.description}
                    </p>
                    {tier.cta && (
                      <Button
                        asChild
                        size="tiny"
                        type="default"
                        className="mt-4"
                        iconRight={tier.cta?.icon}
                      >
                        <Link href={tier.cta?.link}>{tier.cta?.label}</Link>
                      </Button>
                    )}
                  </div>
                  <dl className="space-y-4 p-4 lg:p-6 bg-surface-200 border-t">
                    <div className="space-y-1">
                      <dt className="text-foreground-lighter font-mono text-xs uppercase tracking-wide">
                        Best for
                      </dt>
                      <dd className="text-foreground-light text-sm text-pretty">{tier.bestFor}</dd>
                    </div>
                    {tier.whatYouGet && (
                      <div className="space-y-1">
                        <dt className="text-foreground-lighter font-mono text-xs uppercase tracking-wide">
                          What you get
                        </dt>
                        <dd className="text-foreground-light text-sm text-pretty">
                          {tier.whatYouGet}
                        </dd>
                      </div>
                    )}
                    {timeToLaunch && (
                      <div className="space-y-1">
                        <dt className="text-foreground-lighter font-mono text-xs uppercase tracking-wide">
                          Time to launch
                        </dt>
                        <dd className="text-foreground-light text-sm">{timeToLaunch}</dd>
                      </div>
                    )}
                  </dl>
                </Panel>
              )
            })}
          </div>
        </SectionContainer>
      </div>

      {/* What partnership gets you */}
      <SectionContainer>
        <div className="grid gap-12 md:grid-cols-2 md:gap-16 items-start">
          <SectionHeading
            eyebrow="Benefits"
            title={pageData.benefits.title}
            description="Open to companies building real integrations on Postgres."
          />
          <ul role="list" className="flex flex-col gap-3">
            {pageData.benefits.items.map((item: any) => (
              <li key={item} className="flex items-start gap-3">
                <span
                  aria-hidden="true"
                  className="bg-surface-200 text-foreground-light mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full"
                >
                  <Check size={12} strokeWidth={2.5} className="shrink-0" />
                </span>
                <span className="text-foreground-lighter text-pretty">{item}</span>
              </li>
            ))}
          </ul>
        </div>
      </SectionContainer>

      {/* How to apply */}
      <div className="bg-alternative border-y">
        <SectionContainer>
          <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
            <SectionHeading eyebrow="Get started" title={pageData.howToApply.title} />
            <Button asChild size="small" type="default">
              <Link href={pageData.howToApply.cta.link}>{pageData.howToApply.cta.label}</Link>
            </Button>
          </div>
          <ol role="list" className="mt-12 grid gap-6 md:grid-cols-3">
            {pageData.howToApply.steps.map((step, i) => (
              <li key={step.title}>
                <Panel
                  outerClassName="h-full hover:shadow-none!"
                  innerClassName="flex flex-col gap-3 p-4 lg:p-6 h-full"
                >
                  <span className="text-foreground-lighter font-mono text-sm tabular-nums">
                    {String(i + 1).padStart(2, '0')}
                  </span>
                  <h3 className="text-foreground text-xl tracking-tight">{step.title}</h3>
                  <p className="text-foreground-lighter text-sm text-pretty">{step.description}</p>
                </Panel>
              </li>
            ))}
          </ol>
        </SectionContainer>
      </div>

      {/* Featured partners */}
      {featuredPartners.length > 0 && (
        <SectionContainer>
          <div className="flex flex-col items-center text-center gap-3">
            <span className="text-brand font-mono text-sm uppercase tracking-wide">Partners</span>
            <h2 className="text-foreground text-3xl md:text-4xl tracking-tight max-w-[35ch] text-balance">
              {pageData.featuredPartners.title}
            </h2>
            <p className="text-foreground-lighter text-lg max-w-[56ch] text-pretty">
              {pageData.featuredPartners.description}
            </p>
          </div>
          <div className="mt-12 flex flex-col gap-6 overflow-hidden mask-[linear-gradient(to_right,transparent_0%,black_6%,black_94%,transparent_100%)]">
            {[
              {
                partners: featuredPartners.slice(0, Math.ceil(featuredPartners.length / 2)),
                reverse: false,
              },
              {
                partners: featuredPartners.slice(Math.ceil(featuredPartners.length / 2)),
                reverse: true,
              },
            ].map((row, rowIdx) => (
              <div
                key={rowIdx}
                className={`flex gap-10 md:gap-14 will-change-transform animate-marquee transform-3d backface-hidden ${
                  row.reverse ? 'direction-[reverse]' : ''
                }`}
              >
                {[...row.partners, ...row.partners].map((partner, i) => (
                  <Link
                    key={`${partner.slug}-${i}`}
                    href={`/partners/catalog/${partner.slug}`}
                    title={partner.title}
                    aria-hidden={i >= row.partners.length ? 'true' : undefined}
                    tabIndex={i >= row.partners.length ? -1 : undefined}
                    className="size-9 md:size-10 shrink-0 flex items-center justify-center backface-hidden"
                  >
                    <div className="relative size-full rounded-full overflow-hidden bg-muted">
                      <Image
                        src={partner.logo}
                        alt={partner.title}
                        fill
                        className="object-contain"
                        sizes="40px"
                      />
                    </div>
                  </Link>
                ))}
              </div>
            ))}
          </div>
          <div className="mt-8 flex justify-center">
            <Button asChild type="default" size="small" iconRight={<ArrowRight />}>
              <Link href="/partners/catalog">Browse the Partner Catalog</Link>
            </Button>
          </div>
        </SectionContainer>
      )}

      {/* Ways you can integrate with Supabase */}
      <div className="bg-alternative border-y">
        <SectionContainer className="grid gap-4 xl:grid-cols-3 xl:gap-12 items-start">
          <SectionHeading eyebrow="Integration points" title={pageData.integrationOptions.title} />
          <dl className="col-span-2 grid gap-2 lg:grid-cols-2 xl:grid-cols-3">
            {pageData.integrationOptions.options.map((option) => (
              <Link
                key={option.title}
                href={option.href}
                className="group block"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Panel
                  outerClassName="h-full"
                  innerClassName="flex items-start gap-4 p-4 h-full"
                  hasActiveOnHover
                >
                  <div className="bg-surface-200 text-foreground flex size-10 shrink-0 items-center justify-center rounded-md border transition-all group-hover:scale-105">
                    {option.icon}
                  </div>
                  <div className="flex flex-col gap-1.5 text-foreground">
                    <dt className="text-balance">{option.title}</dt>
                    <dd className="text-foreground-lighter text-sm text-pretty">
                      {option.description}
                    </dd>
                    <span className="text-foreground-light text-sm inline-flex items-center gap-1 mt-1">
                      Read the docs
                      <ArrowRight
                        size={14}
                        className="shrink-0 transition-transform group-hover:translate-x-0.5"
                      />
                    </span>
                  </div>
                </Panel>
              </Link>
            ))}
          </dl>
        </SectionContainer>
      </div>

      {/* FAQ */}
      <SectionContainer>
        <SectionHeading title={pageData.faq.title} align="center" />
        <div className="mx-auto max-w-2xl mt-12">
          <FaqList items={pageData.faq.items} />
        </div>
      </SectionContainer>

      {/* Inline partner intake form */}
      <BecomeAPartner />
    </DefaultLayout>
  )
}
