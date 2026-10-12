import { MDXProvider } from '@mdx-js/react'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import LegalDocVersions, { type LegalDocVersion } from '~/components/Legal/LegalDocVersions'
import PageBreadcrumb from '~/components/Sections/PageBreadcrumb'
import PageHeader from '~/components/Sections/PageHeader'
import V1 from '~/data/legal/customer-resources/supplemental-terms/v1.mdx'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { NextSeo } from 'next-seo'

// This page is intentionally not linked from the Legal Hub (`/legal`) or any
// visible navigation — it is reachable by direct URL only, following the
// same pattern as `/enterprise-terms`. See PR description for details.
const meta = {
  title: 'Supplemental Terms | Supabase',
  description: 'Supabase Supplemental Terms',
  noindex: true,
  nofollow: true,
}

const versions: LegalDocVersion[] = [
  { id: 'v1', label: 'Version 1', effectiveDate: 'TBD', Component: V1 },
]

export default function SupplementalTermsPage() {
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
        h1="Supplemental Terms"
      />
      <MDXProvider components={mdxComponents()}>
        <SectionContainer className="prose">
          <LegalDocVersions versions={versions} />
        </SectionContainer>
      </MDXProvider>
    </DefaultLayout>
  )
}
