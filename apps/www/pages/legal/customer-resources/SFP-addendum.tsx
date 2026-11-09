import { MDXProvider } from '@mdx-js/react'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import LegalDocVersions, { type LegalDocVersion } from '~/components/Legal/LegalDocVersions'
import PageBreadcrumb from '~/components/Sections/PageBreadcrumb'
import PageHeader from '~/components/Sections/PageHeader'
import V1 from '~/data/legal/customer-resources/sfp-addendum/v1.mdx'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { NextSeo } from 'next-seo'

// This page is intentionally not linked from the Legal Hub (`/legal`) or any
// visible navigation — it is reachable by direct URL only, following the
// same pattern as `/enterprise-terms` and `/legal/customer-resources/supplemental-terms`.
// The route is case-sensitive: the file name must stay `SFP-addendum.tsx`.
const meta = {
  title: 'Supabase for Platforms Addendum | Supabase',
  description: 'Supabase for Platforms Addendum',
  noindex: true,
  nofollow: true,
}

const versions: LegalDocVersion[] = [
  { id: 'v1', label: 'Version 1', effectiveDate: 'October 22, 2026', Component: V1 },
]

export default function SFPAddendumPage() {
  return (
    <DefaultLayout>
      <NextSeo {...meta} />
      <PageHeader
        breadcrumb={
          <PageBreadcrumb
            items={[
              { label: 'Legal', href: '/legal' },
              { label: 'Customer Legal Resources', href: '/legal#customer-legal-resources' },
            ]}
          />
        }
        h1="Supabase for Platforms Addendum"
      />
      <MDXProvider components={mdxComponents()}>
        <SectionContainer className="prose">
          <LegalDocVersions versions={versions} />
        </SectionContainer>
      </MDXProvider>
    </DefaultLayout>
  )
}
