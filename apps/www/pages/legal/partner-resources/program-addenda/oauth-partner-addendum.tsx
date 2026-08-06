import { MDXProvider } from '@mdx-js/react'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import LegalDocVersions, { type LegalDocVersion } from '~/components/Legal/LegalDocVersions'
import PageBreadcrumb from '~/components/Sections/PageBreadcrumb'
import PageHeader from '~/components/Sections/PageHeader'
import V1 from '~/data/legal/partner-resources/oauth-partner-addendum/20260806-v1.mdx'
import { parseVersionFile } from '~/lib/addenda-utils'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { NextSeo } from 'next-seo'

const meta = {
  title: 'Open Authorization Integration Addendum',
  description: 'Supabase Open Authorization Integration Addendum',
}

const versions: LegalDocVersion[] = [{ ...parseVersionFile('20260806-v1.mdx'), Component: V1 }]

export default function OAuthPartnerAddendumPage() {
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
        h1="Open Authorization Integration Addendum"
        subheader="An addendum to the Master Partner Program Agreement governing OAuth integrations."
      />
      <MDXProvider components={mdxComponents()}>
        <SectionContainer className="prose legal-prose">
          <LegalDocVersions versions={versions} />
        </SectionContainer>
      </MDXProvider>
    </DefaultLayout>
  )
}
