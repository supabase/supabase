import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import Panel from '~/components/Panel'
import type { Partner } from '~/types/partners'
import { ArrowRight, LayoutGrid, Lock, Zap } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { Badge, Button } from 'ui'

import ProductHeaderCentered from '../../components/Sections/ProductHeaderCentered'
import { MarketplaceFaq } from './MarketplaceFaq'
import { IntegrationTileGrid } from './MarketplaceHeroBackground'

const HOW_IT_WORKS = [
  {
    step: '01',
    title: 'Browse',
    description:
      'Open the Integrations tab in any Supabase project to see the full Marketplace catalog — filtered to what works with your plan.',
  },
  {
    step: '02',
    title: 'Install',
    description:
      'Connect via a guided OAuth flow with explicit, granular scopes. No copying API keys or following multi-step setup guides.',
  },
  {
    step: '03',
    title: 'Manage',
    description:
      'Enable, disable, or revoke access from a single place in your project settings — whenever you want.',
  },
]

const WHY_MARKETPLACE = [
  {
    icon: <LayoutGrid size={20} />,
    title: 'Postgres-native',
    description:
      'Every integration is built around how Supabase actually works — Postgres, Auth, and Edge Functions — not bolted on as an afterthought.',
  },
  {
    icon: <Lock size={20} />,
    title: 'Secure by default',
    description:
      'OAuth scopes instead of long-lived Personal Access Tokens. Revoke access at any time without rotating credentials.',
  },
  {
    icon: <Zap size={20} />,
    title: 'Minutes, not hours',
    description:
      'Integrations that used to require reading docs and wiring up credentials manually are now a few clicks.',
  },
]

const FEATURED_ORDER = ['stripe', 'grafana', 'aikido', 'doppler', 'resend']
const FEATURED_SLUGS = new Set(FEATURED_ORDER)

interface Props {
  integrations: Partner[]
}

export default function MarketplaceLandingContent({ integrations }: Props) {
  return (
    <DefaultLayout>
      {/* Hero */}
      <div className="bg-alternative border-b relative">
        <IntegrationTileGrid />
        <SectionContainer className="flex flex-col items-center text-center gap-6 py-16 md:py-24">
          <ProductHeaderCentered
            title="Integrations Marketplace"
            h1="Native and third-party integrations, directly inside your project"
            subheader="Discover, install, and manage trusted tools directly from the Supabase
            Dashboard — no credential copying, no multi-step guides."
            cta={{
              label: 'Apply to list your integration',
              link: '/partners?partner_type=technology#become-a-partner',
            }}
            secondaryCta={{
              label: 'Browse Partner Catalog',
              link: '/partners/catalog?marketplace=true',
            }}
          />
        </SectionContainer>
      </div>

      {/* Integration cards */}
      {integrations.length > 0 && (
        <SectionContainer>
          <div className="flex flex-col gap-3 mb-8">
            <h2 className="text-foreground text-2xl md:text-3xl tracking-tight">
              Featured Partner Integrations
            </h2>
            <p className="text-foreground-lighter text-base max-w-2xl text-balance">
              Curated third-party integrations you can install from the Marketplace in any Supabase
              project.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 xl:grid-cols-5 gap-3 md:gap-4">
            {integrations
              .filter((i) => FEATURED_SLUGS.has(i.slug))
              .sort((a, b) => FEATURED_ORDER.indexOf(a.slug) - FEATURED_ORDER.indexOf(b.slug))
              .map((integration) => (
                <Link
                  key={integration.slug}
                  href={`/partners/catalog/${integration.slug}`}
                  className="group flex flex-col focus-visible:ring-2 focus-visible:ring-foreground-lighter outline-none rounded-xl"
                >
                  <Panel
                    hasActiveOnHover
                    outerClassName="h-full"
                    innerClassName="flex md:flex-col gap-3 sm:gap-2 h-full items-start p-2"
                  >
                    <div className="relative rounded-lg min-h-[80px] max-h-[80px] md:max-h-[140px] h-full md:h-auto aspect-square md:w-full md:aspect-video! bg-alternative flex items-center justify-center shadow-inner border border-muted overflow-hidden shrink-0 md:shrink">
                      <Image
                        src={integration.logo}
                        alt={integration.title}
                        fill
                        className="object-contain p-6 lg:p-10"
                        sizes="(max-width: 768px) 80px, 200px"
                      />
                    </div>
                    <div className="md:p-2 md:pt-1 flex flex-col h-full md:h-auto grow gap-0.5 md:gap-1.5 justify-center md:justify-start min-w-0">
                      <h3 className="text-sm md:text-base text-foreground leading-5!">
                        {integration.title}
                      </h3>
                      <p className="text-foreground-light text-sm line-clamp-2 flex-1">
                        {integration.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        {integration.categories.slice(0, 2).map((c) => (
                          <Badge key={c.slug}>{c.name}</Badge>
                        ))}
                      </div>
                    </div>
                  </Panel>
                </Link>
              ))}
          </div>
          <div className="mt-6 flex justify-start">
            <Button asChild type="default" size="small" iconRight={<ArrowRight />}>
              <Link href="/partners/catalog?marketplace=true">
                View all Marketplace integrations
              </Link>
            </Button>
          </div>
        </SectionContainer>
      )}

      {/* How it works */}
      <div className="bg-alternative border-y">
        <SectionContainer>
          <div className="flex flex-col gap-3 mb-10">
            <span className="text-brand font-mono text-sm uppercase tracking-widest">
              How it works
            </span>
            <h2 className="text-foreground text-2xl md:text-3xl tracking-tight max-w-[35ch]">
              From discovery to connected in minutes
            </h2>
          </div>
          <ol className="grid gap-6 md:grid-cols-3">
            {HOW_IT_WORKS.map((item) => (
              <li key={item.step}>
                <Panel
                  outerClassName="h-full hover:shadow-none!"
                  innerClassName="flex flex-col gap-3 p-4 lg:p-6 h-full"
                >
                  <span className="text-foreground-lighter font-mono text-sm tabular-nums">
                    {item.step}
                  </span>
                  <h3 className="text-foreground text-xl tracking-tight">{item.title}</h3>
                  <p className="text-foreground-lighter text-sm text-pretty">{item.description}</p>
                </Panel>
              </li>
            ))}
          </ol>
        </SectionContainer>
      </div>

      {/* Why Marketplace */}
      <SectionContainer>
        <div className="flex flex-col gap-3 mb-10">
          <span className="text-brand font-mono text-sm uppercase tracking-widest">
            Why Marketplace
          </span>
          <h2 className="text-foreground text-2xl md:text-3xl tracking-tight max-w-[35ch]">
            Built around Postgres and the way you build
          </h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {WHY_MARKETPLACE.map((item) => (
            <Panel
              key={item.title}
              outerClassName="h-full hover:shadow-none!"
              innerClassName="flex flex-col gap-3 p-4 lg:p-6"
            >
              <div className="bg-surface-200 text-foreground flex size-10 shrink-0 items-center justify-center rounded-md border">
                {item.icon}
              </div>
              <h3 className="text-foreground text-xl tracking-tight">{item.title}</h3>
              <p className="text-foreground-lighter text-sm text-pretty">{item.description}</p>
            </Panel>
          ))}
        </div>
      </SectionContainer>

      {/* FAQ */}
      <SectionContainer>
        <div className="flex flex-col items-center text-center gap-3 mb-12">
          <h2 className="text-foreground text-2xl sm:text-3xl tracking-tight max-w-[35ch] text-balance">
            Frequently asked questions
          </h2>
        </div>
        <div className="mx-auto max-w-3xl">
          <MarketplaceFaq />
        </div>
      </SectionContainer>

      {/* Partner CTA */}
      <div className="bg-alternative border-y">
        <SectionContainer className="flex flex-col items-center text-center gap-4 py-16 md:py-24">
          <span className="text-brand font-mono text-sm uppercase tracking-widest">
            For partners
          </span>
          <h2 className="text-3xl md:text-4xl text-balance">Join the Marketplace</h2>
          <p className="text-foreground-lighter text-base text-pretty max-w-xl">
            Technology partners can apply to list a one-click integration. If your integration is a
            good fit, our team will reach out to discuss next steps.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-3 mt-4">
            <Button asChild size="medium" type="primary" iconRight={<ArrowRight />}>
              <Link href="/partners?partner_type=technology#become-a-partner">
                Apply to list your integration
              </Link>
            </Button>
          </div>
        </SectionContainer>
      </div>
    </DefaultLayout>
  )
}
