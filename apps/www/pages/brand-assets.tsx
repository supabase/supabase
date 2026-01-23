import Container from 'components/Container'

import CTABanner from 'components/CTABanner/index'
import { Button } from 'ui'
import Layout from '~/components/Layouts/Default'

import { useRouter } from 'next/router'

import * as supabaseLogoPreview from 'common/assets/images/logo-preview.jpg'
import { Download } from 'lucide-react'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import SectionContainer from '~/components/Layouts/SectionContainer'
import Link from 'next/link'

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
              url: `https://supabase.com/images/og/supabase-og.png`,
            },
          ],
        }}
      />
      <Layout>
        <Container>
          <SectionContainer className="pb-0 md:pb-0 lg:pb-0">
            <h1 className="h1">Brand assets</h1>
            <p className="text-foreground text-xl">Download official Supabase logos</p>
            <div className="mt-2 sm:max-w-xl max-w-none">
              <p className="text-foreground-lighter text-sm">
                All Supabase trademarks, logos, or other brand elements can never be modified or
                used for any other purpose other than to represent Supabase Inc.
              </p>
            </div>
          </SectionContainer>
          <SectionContainer className="grid grid-cols-1 md:grid-cols-2 gap-5 lg:pt-12">
            <div className="shadow-small flex flex-col rounded-lg border border-default bg-surface-75 overflow-hidden">
              <div className="relative aspect-video w-full overflow-auto border-b">
                <Image
                  src={supabaseLogoPreview}
                  alt="Supabase logo Preview"
                  layout="fill"
                  objectFit="cover"
                />
              </div>
              <div className="flex items-center p-5">
                <div className="gap-y-4 flex flex-col h-full justify-between">
                  <div className="space-y-2">
                    <h3 className="h3">Supabase logos</h3>
                    <p className="text-foreground-lighter text-sm">
                      Download Supabase official logos, including as SVG's, in both light and dark
                      theme.
                    </p>
                    <p className="text-foreground-lighter text-sm">
                      Do not use any other color for the wordmark.
                    </p>
                  </div>
                  <form method="get" action={`/brand-assets.zip`} className="mt-3">
                    <Button htmlType="submit" type="default" iconRight={<Download />}>
                      Download logo kit
                    </Button>
                  </form>
                </div>
              </div>
            </div>
            <div className="shadow-small flex flex-col rounded-lg border border-default bg-surface-75 overflow-hidden">
              <div className="relative aspect-video w-full overflow-auto flex items-center justify-center border-b">
                <Image
                  src="https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/supabase-brand-assets/connect-supabase/connect-supabase-dark.svg"
                  alt="Connect Supabase Button"
                  width={154}
                  height={31}
                />
              </div>
              <div className="flex items-center p-5">
                <div className="gap-y-4 flex flex-col h-full justify-between">
                  <div className="space-y-2">
                    <h3 className="h3">Supabase Integrations</h3>
                    <p className="text-foreground-lighter text-sm">
                      When building a{' '}
                      <Link
                        className="text-brand underline"
                        href="/docs/guides/platform/oauth-apps/build-a-supabase-integration"
                      >
                        Supabase Integration
                      </Link>
                      , use this "Connect Supabase" button to initiate the OAuth redirect.
                    </p>
                    <p className="text-foreground-lighter text-sm">
                      Do not use any other color for the wordmark.
                    </p>
                  </div>
                  <form
                    method="get"
                    action={`https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/supabase-brand-assets/connect-supabase/connect-supabase.zip`}
                    className="mt-3"
                  >
                    <Button htmlType="submit" type="default" iconRight={<Download />}>
                      Download button kit
                    </Button>
                  </form>
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
