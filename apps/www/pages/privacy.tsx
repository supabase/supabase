import { MDXProvider } from '@mdx-js/react'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import LegalDocVersions, { type LegalDocVersion } from '~/components/Legal/LegalDocVersions'
import PageBreadcrumb from '~/components/Sections/PageBreadcrumb'
import PageHeader from '~/components/Sections/PageHeader'
import V1 from '~/data/legal/privacy/v1.mdx'
import V2 from '~/data/legal/privacy/v2.mdx'
import V3 from '~/data/legal/privacy/v3.mdx'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { NextSeo } from 'next-seo'

const meta = {
  title: 'Privacy Policy | Supabase',
  description: 'Supabase Privacy Policy',
}

const versions: LegalDocVersion[] = [
  { id: 'v3', label: 'Version 3', effectiveDate: 'May 13, 2026', Component: V3 },
  { id: 'v2', label: 'Version 2', effectiveDate: 'March 16, 2026', Component: V2 },
  { id: 'v1', label: 'Version 1', effectiveDate: 'May 28, 2025', Component: V1 },
]

export default function PrivacyPolicyPage() {
  return (
    <DefaultLayout>
      <NextSeo {...meta} />
      <PageHeader
        breadcrumb={<PageBreadcrumb items={[{ label: 'Legal', href: '/legal' }]} />}
        h1="Privacy Policy"
      />
      <MDXProvider components={mdxComponents()}>
        <SectionContainer className="prose">
          <LegalDocVersions versions={versions} />
        </SectionContainer>
      </MDXProvider>
    </DefaultLayout>
  )
}
