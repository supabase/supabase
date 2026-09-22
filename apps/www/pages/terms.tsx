import { MDXProvider } from '@mdx-js/react'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import LegalDocVersions, { type LegalDocVersion } from '~/components/Legal/LegalDocVersions'
import PageBreadcrumb from '~/components/Sections/PageBreadcrumb'
import PageHeader from '~/components/Sections/PageHeader'
import V1 from '~/data/legal/terms/v1.mdx'
import V2 from '~/data/legal/terms/v2.mdx'
import V3 from '~/data/legal/terms/v3.mdx'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { NextSeo } from 'next-seo'

const meta = {
  title: 'Terms of Service',
  description: 'Supabase Terms of Service',
}

const versions: LegalDocVersion[] = [
  { id: 'v3', label: 'Version 3', effectiveDate: 'August 1, 2026', Component: V3 },
  { id: 'v2', label: 'Version 2', effectiveDate: 'May 6, 2026', Component: V2 },
  { id: 'v1', label: 'Version 1', effectiveDate: 'July 11, 2025', Component: V1 },
]

export default function TermsPage() {
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
        h1="Terms of Service"
      />
      <MDXProvider components={mdxComponents()}>
        <SectionContainer className="prose">
          <LegalDocVersions versions={versions} />
        </SectionContainer>
      </MDXProvider>
    </DefaultLayout>
  )
}
