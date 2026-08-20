import DefaultLayout from '~/components/Layouts/Default'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { AWS_REGIONS } from 'shared-data'
import { Badge, Button } from 'ui'
import { Admonition } from 'ui-patterns/Admonition'

const REGION_GROUPS = ['Americas', 'Europe', 'Asia Pacific'] as const

type RegionGroup = (typeof REGION_GROUPS)[number]

const EUROPE_JURISDICTION: Record<string, string> = {
  'eu-central-1': 'EU',
  'eu-central-2': 'CH',
  'eu-north-1': 'EU',
  'eu-west-1': 'EU',
  'eu-west-2': 'UK',
  'eu-west-3': 'EU',
}

const regions = Object.values(AWS_REGIONS)
const regionCount = regions.length

const groupedRegions = REGION_GROUPS.map((group) => ({
  group,
  regions: regions.filter((region) => groupForCode(region.code) === group),
}))

function groupForCode(code: string): RegionGroup {
  if (code.startsWith('eu-')) return 'Europe'
  if (code.startsWith('ap-')) return 'Asia Pacific'
  return 'Americas'
}

const residencyRows = [
  {
    component: 'Primary Postgres database',
    detail: 'Yes. Stays in the region you picked.',
  },
  {
    component: 'Auth service',
    detail: 'Yes. Stays in the region you picked.',
  },
  {
    component: 'Storage objects at origin',
    detail: 'Yes. Stays in the region you picked.',
  },
  {
    component: 'Read replicas',
    detail: 'You choose the region. It can sit outside the EU.',
  },
  {
    component: 'Edge Functions',
    detail: 'No. Runs at the edge nearest the caller.',
  },
  {
    component: 'Edge Functions with regional invocation',
    detail: 'You can pin execution to a region. Not available in Ohio or Stockholm.',
  },
  {
    component: 'Storage CDN cache',
    detail: 'No. Cached on Cloudflare, globally.',
  },
]

const documents = [
  { href: '/legal/dpa', label: 'Data Processing Agreement' },
  { href: 'https://supabase.com/docs/guides/security/gdpr-compliance', label: 'GDPR guide' },
  { href: '/legal/customer-resources/subprocessor-list', label: 'Sub-processor list' },
  { href: '/security', label: 'Security' },
]

function RegionsPage() {
  const router = useRouter()
  const meta_title = 'Regions | Supabase'
  const meta_description = `Host your project in any of ${regionCount} AWS regions. Postgres, Auth, and Storage objects stay in the region you choose.`

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
        <div className="section-container my-8">
          <h1 className="xl:text-5xl mb-4">{regionCount} regions. Pick the one you need.</h1>
          <p className="text-xl text-foreground-light max-w-2xl mb-6">
            Your Postgres database, Auth service, and Storage objects stay in the region you choose.
          </p>
          <div className="flex items-center gap-3">
            <Button asChild>
              <Link href="https://supabase.com/dashboard/sign-up">Start your project</Link>
            </Button>
            <Link href="/legal/dpa" className="text-sm text-brand-link hover:underline">
              Read the DPA
            </Link>
          </div>
        </div>

        <div className="section-container mb-16 flex flex-col gap-12">
          <div className="flex flex-col gap-6">
            <h2 className="text-sm font-medium text-foreground-muted uppercase tracking-widest">
              Available regions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-16">
              {groupedRegions.map(({ group, regions: groupRegions }) => (
                <div key={group} className="flex flex-col gap-3">
                  <h3 className="text-sm text-foreground">{group}</h3>
                  <ul className="flex flex-col gap-2">
                    {groupRegions.map((region) => (
                      <li key={region.code} className="flex items-center gap-3">
                        <span className="text-sm text-foreground w-44 shrink-0">
                          {region.displayName}
                        </span>
                        <code className="text-xs text-foreground-lighter">{region.code}</code>
                        {EUROPE_JURISDICTION[region.code] && (
                          <Badge>{EUROPE_JURISDICTION[region.code]}</Badge>
                        )}
                      </li>
                    ))}
                  </ul>
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

          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-foreground-muted uppercase tracking-widest">
              What stays in your region
            </h2>
            <p className="text-foreground-light max-w-2xl">
              Choosing a region is a data-location control. It does not make your app GDPR compliant
              on its own.
            </p>
            <div className="border-t border-muted">
              {residencyRows.map((row) => (
                <div
                  key={row.component}
                  className="grid grid-cols-1 md:grid-cols-3 gap-2 md:gap-8 py-4 border-b border-muted"
                >
                  <span className="text-sm text-foreground">{row.component}</span>
                  <span className="text-sm text-foreground-light md:col-span-2">{row.detail}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-4">
            <h2 className="text-sm font-medium text-foreground-muted uppercase tracking-widest">
              Documents
            </h2>
            <div className="flex flex-col sm:flex-row sm:flex-wrap gap-3 sm:gap-8">
              {documents.map((doc) => (
                <Link key={doc.href} href={doc.href} className="text-brand-link hover:underline">
                  {doc.label}
                </Link>
              ))}
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
          </div>
        </div>
      </DefaultLayout>
    </>
  )
}

export default RegionsPage
