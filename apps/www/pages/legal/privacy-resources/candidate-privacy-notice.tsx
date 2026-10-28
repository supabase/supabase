import { MDXProvider } from '@mdx-js/react'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import LegalDocVersions, { type LegalDocVersion } from '~/components/Legal/LegalDocVersions'
import PageBreadcrumb from '~/components/Sections/PageBreadcrumb'
import PageHeader from '~/components/Sections/PageHeader'
import V2 from '~/data/legal/privacy-resources/candidate-privacy-notice/v2.mdx'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { NextSeo } from 'next-seo'

const meta = {
  title: 'Candidate Privacy Notice | Supabase',
  description:
    'Explains how Supabase collects, uses, shares, and protects personal information about candidates during the recruitment process, and the rights available to candidates.',
  canonical: 'https://supabase.com/legal/privacy-resources/candidate-privacy-notice',
}

const versions: LegalDocVersion[] = [
  { id: 'v2', label: 'Version 2.0', effectiveDate: 'October 28, 2026', Component: V2 },
]

export default function CandidatePrivacyNoticePage() {
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
        h1="Candidate Privacy Notice"
      />
      <MDXProvider components={mdxComponents()}>
        <SectionContainer className="prose">
          <LegalDocVersions versions={versions} />
        </SectionContainer>
      </MDXProvider>
    </DefaultLayout>
  )
}
