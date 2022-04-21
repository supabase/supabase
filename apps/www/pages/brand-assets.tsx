import Container from 'components/Container'

import Layout from '~/components/Layouts/Default'
import CTABanner from 'components/CTABanner/index'
import { Button, IconDownload } from '@supabase/ui'

import { useRouter } from 'next/router'

import SectionContainer from '~/components/Layouts/SectionContainer'
import { NextSeo } from 'next-seo'
import Image from 'next/image'

const Index = () => {
  // base path for images
  const router = useRouter()

  const meta_title = 'Branding | Supabase'
  const meta_description = 'Get Supabase Brand assets here.'

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/${router.pathname}`,
          images: [
            {
              url: `https://supabase.com/images/og/og-image.jpg`,
            },
          ],
        }}
      />
      <Layout>
        <Container>
          <SectionContainer className="pb-0 md:pb-0 lg:pb-0">
            <div className="max-w-xl">
              <h1 className="text-5xl text-scale-1200">Brand assets</h1>
              <p className="text-2xl text-scale-1200">Download official Supabase logos</p>
              <p className="text-sm text-scale-1200">
                All Supabase trademarks, logos, or other brand elements can never be modified or
                used for any other purpose other than to represent Supabase Inc.
              </p>
            </div>
          </SectionContainer>
          <SectionContainer>
            <div className="grid grid-cols-12 border dark:border-gray-600 rounded-lg shadow-small">
              <div className="col-span-12 lg:col-span-5 relative overflow-auto w-full h-60 rounded-lg">
                <Image src={`/brand-assets/logo-preview.jpg`} layout="fill" objectFit="cover" />
              </div>
              <div className="col-span-12 lg:col-span-7 flex items-center">
                <div className="p-16">
                  <div className="space-y-2">
                    <h1 className="text-4xl text-scale-1200">Supabase logos</h1>
                    <p className="text-sm text-scale-1100">
                      <p>
                        Download Supabase official logos, including as SVG's, in both light and dark
                        theme.
                      </p>
                      <p>Do not use any other color for the wordmark.</p>
                    </p>
                    <form method="get" action={`/brand-assets/supabase-logos.zip`}>
                      <Button htmlType="submit" type="default" iconRight={<IconDownload />}>
                        Download logo kit
                      </Button>
                    </form>
                  </div>
                </div>
              </div>
            </div>
          </SectionContainer>
          <CTABanner />
        </Container>
      </Layout>
    </>
  )
}

export default Index
