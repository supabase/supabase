import CTABanner from '~/components/CTABanner'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import SectionHeading from '~/components/Layouts/SectionHeading'
import { DOCUMENTS, REGION_COUNT, RESIDENCY_ROWS } from '~/components/Regions/Regions.constants'
import { RegionsExplorer } from '~/components/Regions/RegionsExplorer'
import ProductHeaderCentered from '~/components/Sections/ProductHeaderCentered'
import { ArrowUpRight, FileText } from 'lucide-react'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { Badge } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

const RESIDENCY_BADGE_VARIANTS = {
  'In region': 'success',
  'Your choice': 'default',
  Global: 'warning',
} as const

const RegionsPage = () => {
  const router = useRouter()
  const meta_title = 'Regions | Supabase'
  const meta_description = `Host your project in any of ${REGION_COUNT} AWS regions. Postgres, Auth, and Storage objects stay in the region you choose.`

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com${router.pathname}`,
          images: [
            {
              url: 'https://supabase.com/images/og/supabase-og.png',
            },
          ],
        }}
      />
      <DefaultLayout>
        <SectionContainer className="pb-0! md:pb-0! lg:pb-0!">
          <ProductHeaderCentered
            title="Available Regions"
            h1={
              <>
                {REGION_COUNT} regions.
                <br /> Pick the one you need.
              </>
            }
            subheader="Your Postgres database, Auth service, and Storage objects stay in the region you choose."
            cta={{ label: 'Start your project', link: 'https://supabase.com/dashboard/sign-up' }}
            secondaryCta={{ label: 'Read the DPA', link: '/legal/dpa' }}
          />
        </SectionContainer>

        <SectionContainer className="flex flex-col gap-8 lg:gap-12">
          <RegionsExplorer />
        </SectionContainer>

        <SectionContainer className="pt-0! flex flex-col gap-8 lg:gap-12">
          <div className="flex flex-col gap-8">
            <SectionHeading
              title="What stays in your region"
              description="Choosing a region is a data-location control. It does not make your app GDPR compliant on its own."
            />
            <div className="border-t border-muted">
              {RESIDENCY_ROWS.map((row) => (
                <div
                  key={row.component}
                  className="grid grid-cols-1 items-baseline gap-2 border-b border-muted py-4 md:grid-cols-3 md:gap-8"
                >
                  <span className="text-sm text-foreground">{row.component}</span>
                  <div className="flex items-baseline gap-3 md:col-span-2">
                    <Badge variant={RESIDENCY_BADGE_VARIANTS[row.status]} className="shrink-0">
                      {row.status}
                    </Badge>
                    <span className="text-sm text-foreground-light">{row.detail}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <Admonition type="caution" title="If you need the EU">
            <p>Choose a specific region: Frankfurt, Ireland, or Paris.</p>
            <p>
              London or Zurich both have GDPR-adequacy regimes, but neither is an EU member state.
            </p>
          </Admonition>
        </SectionContainer>

        <SectionContainer className="pt-0! flex flex-col gap-8 lg:gap-12">
          <SectionHeading
            title="Documents"
            description="The paperwork that goes with your region choice."
          />
          <div className="grid grid-cols-1 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-2">
            {DOCUMENTS.map((doc) => {
              const isExternal = doc.href.startsWith('http')

              return (
                <Link
                  key={doc.href}
                  href={doc.href}
                  className="group flex items-start gap-3 bg-background p-6 transition-colors hover:bg-surface-100"
                >
                  <FileText size={16} className="mt-0.5 shrink-0 text-foreground-muted" />
                  <div className="flex flex-col gap-1">
                    <span className="flex items-center gap-1 text-sm text-foreground">
                      {doc.label}
                      {isExternal && (
                        <ArrowUpRight
                          size={14}
                          className="text-foreground-muted transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                        />
                      )}
                    </span>
                    <span className="text-sm text-foreground-lighter">{doc.description}</span>
                  </div>
                </Link>
              )
            })}
          </div>
          <p className="text-sm text-foreground-light">
            Need the database in your own cloud?{' '}
            <Link
              href="/go/pre-release/byoc-early-access"
              className="text-brand-link hover:underline"
            >
              Ask about early access to BYOC
            </Link>
            .
          </p>
        </SectionContainer>

        <CTABanner />
      </DefaultLayout>
    </>
  )
}

export default RegionsPage
