import { MDXProvider } from '@mdx-js/react'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import LegalDocVersions, { type LegalDocVersion } from '~/components/Legal/LegalDocVersions'
import V1 from '~/data/legal/enterprise-terms/v1.mdx'
import V2 from '~/data/legal/enterprise-terms/v2.mdx'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { NextSeo } from 'next-seo'

const meta = {
  title: 'Enterprise SaaS Subscription Agreement | Supabase',
  description: 'Supabase Enterprise SaaS Subscription Agreement',
  noindex: true,
  nofollow: true,
}

const versions: LegalDocVersion[] = [
  { id: 'v2', label: 'Version 2', effectiveDate: 'May 6, 2026', Component: V2 },
  { id: 'v1', label: 'Version 1', effectiveDate: 'April 17, 2026', Component: V1 },
]

export default function EnterpriseTermsPage() {
  return (
    <DefaultLayout>
      <NextSeo {...meta} />
      <MDXProvider components={mdxComponents()}>
        <div className="prose max-w-none">
          <SectionContainer>
            <h1>Enterprise SaaS Subscription Agreement</h1>
            <LegalDocVersions versions={versions} />
          </SectionContainer>
        </div>
      </MDXProvider>
    </DefaultLayout>
  )
}
