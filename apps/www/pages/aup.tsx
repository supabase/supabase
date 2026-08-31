import { MDXProvider } from '@mdx-js/react'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import LegalDocVersions, { type LegalDocVersion } from '~/components/Legal/LegalDocVersions'
import PageBreadcrumb from '~/components/Sections/PageBreadcrumb'
import PageHeader from '~/components/Sections/PageHeader'
import V1 from '~/data/legal/aup/v1.mdx'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { NextSeo } from 'next-seo'

const meta = {
  title: 'Acceptable Use Policy | Supabase',
  description: 'Supabase Acceptable Use Policy',
}

const versions: LegalDocVersion[] = [
  { id: 'v1', label: 'Version 1', effectiveDate: 'June 1, 2026', Component: V1 },
]

export default function AcceptableUsePolicyPage() {
  return (
    <DefaultLayout>
      <NextSeo {...meta} />
      <PageHeader
        breadcrumb={<PageBreadcrumb items={[{ label: 'Legal', href: '/legal' }]} />}
        h1="Acceptable Use Policy"
      />
      <MDXProvider components={mdxComponents()}>
        <SectionContainer className="prose">
          <LegalDocVersions versions={versions} />
        </SectionContainer>
      </MDXProvider>
    </DefaultLayout>
  )
}
