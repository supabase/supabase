import { MDXProvider } from '@mdx-js/react'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import LegalDocVersions, { type LegalDocVersion } from '~/components/Legal/LegalDocVersions'
import PageBreadcrumb from '~/components/Sections/PageBreadcrumb'
import PageHeader from '~/components/Sections/PageHeader'
import V1 from '~/data/legal/enterprise-terms/v1.mdx'
import V2 from '~/data/legal/enterprise-terms/v2.mdx'
import V3 from '~/data/legal/enterprise-terms/v3.mdx'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { NextSeo } from 'next-seo'

const meta = {
  title: 'Enterprise SaaS Subscription Agreement | Supabase',
  description: 'Supabase Enterprise SaaS Subscription Agreement',
  noindex: true,
  nofollow: true,
}

const versions: LegalDocVersion[] = [
  { id: 'v3', label: 'Version 3', effectiveDate: 'August 1, 2026', Component: V3 },
  { id: 'v2', label: 'Version 2', effectiveDate: 'May 6, 2026', Component: V2 },
  { id: 'v1', label: 'Version 1', effectiveDate: 'April 17, 2026', Component: V1 },
]

export default function EnterpriseTermsPage() {
  return (
    <DefaultLayout>
      <NextSeo {...meta} />
      <PageHeader
        breadcrumb={<PageBreadcrumb items={[{ label: 'Legal', href: '/legal' }]} />}
        h1="Enterprise SaaS Subscription Agreement"
      />
      <MDXProvider components={mdxComponents()}>
        <SectionContainer className="prose">
          <LegalDocVersions versions={versions} />
        </SectionContainer>
      </MDXProvider>
    </DefaultLayout>
  )
}
