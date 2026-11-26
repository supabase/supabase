import { MDXProvider } from '@mdx-js/react'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import LegalDocVersions, { type LegalDocVersion } from '~/components/Legal/LegalDocVersions'
import PageBreadcrumb from '~/components/Sections/PageBreadcrumb'
import PageHeader from '~/components/Sections/PageHeader'
import V1 from '~/data/legal/privacy-resources/data-residency-and-transfers-faq/v1.mdx'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { NextSeo } from 'next-seo'

const meta = {
  title: 'Data Residency and Transfers FAQ | Supabase',
  description:
    'Answers to common questions about where Supabase processes your data, subprocessors, international data transfers, retention, and data subject rights.',
  canonical: 'https://supabase.com/legal/privacy-resources/data-residency-and-transfers-faq',
}

const versions: LegalDocVersion[] = [
  { id: 'v1', label: 'Version 1', effectiveDate: 'October 6, 2026', Component: V1 },
]

export default function DataResidencyAndTransfersFaqPage() {
  return (
    <DefaultLayout>
      <NextSeo {...meta} />
      <PageHeader
        breadcrumb={
          <PageBreadcrumb
            items={[
              { label: 'Legal', href: '/legal' },
              { label: 'Privacy Resources', href: '/legal#privacy-resources' },
            ]}
          />
        }
        h1="Data Residency and Transfers FAQ"
      />
      <MDXProvider components={mdxComponents()}>
        <SectionContainer className="prose">
          <LegalDocVersions versions={versions} />
        </SectionContainer>
      </MDXProvider>
    </DefaultLayout>
  )
}
