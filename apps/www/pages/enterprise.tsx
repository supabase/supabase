import dynamic from 'next/dynamic'
import content from '~/data/enterprise/content'
import { NextSeo } from 'next-seo'

import Layout from '~/components/Layouts/Default'
import ProductHeader from '~/components/Sections/ProductHeader2'

const EnterpriseUseCases = dynamic(() => import('components/Enterprise/UseCases'))
const EnterpriseSecurity = dynamic(() => import('components/Enterprise/Security'))
const ReactTooltip = dynamic(() => import('react-tooltip'), { ssr: false })

const Enterprise = () => {
  return (
    <>
      <NextSeo
        title={content.metadata.metaTitle}
        description={content.metadata.metaDescription}
        openGraph={{
          title: content.metadata.metaTitle,
          description: content.metadata.metaDescription,
          url: `https://supabase.com/enterprise`,
          images: [
            {
              url: `https://supabase.com/images/enterprise/og.png`,
            },
          ],
        }}
      />
      <Layout className="overflow-visible">
        <ProductHeader {...content.heroSection} footer={<span>logos</span>} />
        <EnterpriseUseCases {...content['use-cases']} />
        <EnterpriseSecurity {...content.security} />
        <ReactTooltip
          effect="solid"
          place="bottom"
          backgroundColor="hsl(var(--background-alternative-default))"
          textColor="hsl(var(--foreground-light))"
          className="!max-w-[320px] !px-3 whitespace-pre-line"
          uuid="homepage-tt"
        />
      </Layout>
    </>
  )
}

export default Enterprise
