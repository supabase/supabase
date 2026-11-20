import { MDXProvider } from '@mdx-js/react'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import PageBreadcrumb from '~/components/Sections/PageBreadcrumb'
import PageHeader from '~/components/Sections/PageHeader'
import Content from '~/data/legal/sla/v1.mdx'
import mdxComponents from '~/lib/mdx/mdxComponents'
import { NextSeo } from 'next-seo'

// This page is intentionally not linked from the Legal Hub (`/legal`) or any
// visible navigation. It is reachable by direct URL only, following the same
// pattern as `/enterprise-terms`.
const meta = {
  title: 'Service Level Agreement | Supabase',
  description: 'Supabase Service Level Agreement',
  noindex: true,
  nofollow: true,
}

export default function SLAPage() {
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
        h1="Service Level Agreement"
      />
      <MDXProvider components={mdxComponents()}>
        <SectionContainer className="prose">
          <Content />
        </SectionContainer>
      </MDXProvider>
    </DefaultLayout>
  )
}
