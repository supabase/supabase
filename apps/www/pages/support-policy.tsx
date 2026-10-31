import { MDXProvider } from '@mdx-js/react'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import PageBreadcrumb from '~/components/Sections/PageBreadcrumb'
import PageHeader from '~/components/Sections/PageHeader'
import Content from '~/data/legal/support-policy/v1.mdx'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { NextSeo } from 'next-seo'

const meta = {
  title: 'Support Policy',
  description: 'Supabase Support Policy',
}

export default function SupportPolicyPage() {
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
        h1="Support Policy"
      />
      <MDXProvider components={mdxComponents()}>
        <SectionContainer className="prose">
          <Content />
        </SectionContainer>
      </MDXProvider>
    </DefaultLayout>
  )
}
