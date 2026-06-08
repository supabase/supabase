import { MDXProvider } from '@mdx-js/react'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import LegalDocVersions, { type LegalDocVersion } from '~/components/Legal/LegalDocVersions'
import PageBreadcrumb from '~/components/Sections/PageBreadcrumb'
import PageHeader from '~/components/Sections/PageHeader'
import V1 from '~/data/legal/partner-resources/integration-partner-addendum/v1.mdx'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { NextSeo } from 'next-seo'

const meta = {
  title: 'Integration Partner Addendum',
  description: 'Supabase Integration Partner Addendum',
}

const versions: LegalDocVersion[] = [
  { id: 'v1', label: 'Version 1', effectiveDate: 'May 27, 2026', Component: V1 },
]

export default function IntegrationPartnerAddendumPage() {
  return (
    <DefaultLayout>
      <NextSeo {...meta} />
      <PageHeader
        breadcrumb={
          <PageBreadcrumb
            items={[
              { label: 'Legal', href: '/legal' },
              { label: 'Partner Legal Resources', href: '/legal#partner-legal-resources' },
              { label: 'Program Addenda', href: '/legal/partner-resources/program-addenda' },
            ]}
          />
        }
        h1="Integration Partner Addendum"
        subheader="An addendum to the Master Partner Program Agreement governing integration partners."
      />
      <MDXProvider components={mdxComponents()}>
        <div className="prose max-w-none">
          <SectionContainer>
            <LegalDocVersions versions={versions} />
          </SectionContainer>
        </div>
      </MDXProvider>
    </DefaultLayout>
  )
}
