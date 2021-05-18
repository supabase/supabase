import Container from 'components/Container'
import { createClient } from '@supabase/supabase-js'
import Layout from '~/components/Layouts/Default'
import CTABanner from 'components/CTABanner/index'
import { Button, Typography, IconDownload } from '@supabase/ui'

import Link from 'next/link'
import { useRouter } from 'next/router'

import SectionContainer from '~/components/Layouts/SectionContainer'

const { Title, Text } = Typography

const Index = () => {
  // base path for images
  const { basePath } = useRouter()

  return (
    <>
      <Layout>
        <Container>
          <SectionContainer className="pb-0 md:pb-0 lg:pb-0">
            <div className="grid lg:grid-cols-2">
              <div>
                <Title>Brand assets</Title>
                <Title level={3}>Download official Supabase logos</Title>
                <Text>
                  All Supabase trademarks, logos, or other brand elements can never be modified or
                  used for any other purpose other than to represent Supabase Inc.
                </Text>
              </div>
            </div>
          </SectionContainer>
          <SectionContainer>
            <div className="grid grid-cols-12 border dark:border-gray-600">
              <div className="col-span-12 lg:col-span-5">
                <img
                  src={`${basePath}/brand-assets/logo-preview.jpg`}
                  width="100%"
                  className="object-cover h-full"
                />
              </div>
              <div className="col-span-12 lg:col-span-7 flex items-center">
                <div className="p-16">
                  <div>
                    <Typography.Title level={2}>Supabase logos</Typography.Title>
                    <Typography.Text>
                      <p>
                        Download Supabase official logos, including as SVG's, in both light and dark
                        theme.
                      </p>
                      <p>Do not use any other color for the wordmark.</p>
                    </Typography.Text>
                    <form method="get" action={`${basePath}/brand-assets/supabase-logos.zip`}>
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
