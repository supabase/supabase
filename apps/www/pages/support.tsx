import Container from 'components/Container'
import Layout from '~/components/Layouts/Default'
import Link from 'next/link'
import { Button, IconMessageCircle, IconGitHub, Divider, IconMail } from '@supabase/ui'
import SectionContainer from '~/components/Layouts/SectionContainer'

// Import Swiper styles if swiper used on page
import 'swiper/swiper.min.css'
import { useRouter } from 'next/router'
import { NextSeo } from 'next-seo'

type Props = {}

const Index = ({}: Props) => {
  const router = useRouter()

  const meta_title = 'Help & Support | Supabase'
  const meta_description =
    'Find help and support for Supabase. Our support agents provide answers on all types of issues, including account information, billing, and refunds.'

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
          <SectionContainer className="">
            <div className="text-center">
              <h1 className="text-scale-1200 text-4xl">Get Support</h1>
              <p>
                <p className="text-scale-1100 lg:text-lg">
                  Need a bit of help? We're here for you. Check out our current issues, GitHub
                  discussions, or get email support.
                </p>
              </p>
            </div>
            <div className="text-scale-1200 mt-16 grid gap-5 sm:grid-cols-3 md:grid-cols-12">
              <div className="col-span-12 lg:col-span-6 xl:col-span-4">
                <div
                  className="dark:bg-scale-400 flex h-40 
                    flex-col justify-between rounded rounded-b-none border-t
                    border-r
                    border-l border-gray-100 bg-white
                    p-5 dark:border-gray-600
                    "
                >
                  <div className="mb-4">
                    <h5 className="mb-1">GitHub Issues</h5>
                    <p className="block">
                      <p>
                        Have a general issue or bug that you've found? We'd love to hear about it in
                        our GitHub issues. This can be feature requests too!
                      </p>
                      <p>
                        <span className="font-bold">Use this for:</span> Bugs and other issues
                      </p>
                    </p>
                  </div>
                </div>
                <Divider type="horizontal" light orientation="center" />
                <div>
                  <div
                    className="
                    dark:bg-scale-400 flex 
                    flex-col justify-between rounded rounded-t-none border-b
                    border-r border-l
                    border-gray-100 bg-white p-5
                    pt-10 dark:border-gray-600"
                  >
                    <Link
                      href="https://github.com/supabase/supabase/issues"
                      as="https://github.com/supabase/supabase/issues"
                    >
                      <a target="_blank">
                        <Button size="medium" type="default" iconRight={<IconGitHub />}>
                          Go To Issues
                        </Button>
                      </a>
                    </Link>
                  </div>
                </div>
              </div>
              <div className="col-span-12 lg:col-span-6 xl:col-span-4">
                <div
                  className="dark:bg-scale-400 flex h-40 
                    flex-col justify-between rounded rounded-b-none border-t
                    border-r
                    border-l border-gray-100 bg-white
                    p-5 dark:border-gray-600
                    "
                >
                  <div className="mb-4">
                    <h5 className="mb-1">GitHub Discussions</h5>
                    <p className="block">
                      <p>
                        For help and questions about best practices, join our GitHub discussions.
                        Browse and ask questions.
                      </p>
                      <p>
                        <span className="font-bold">Use this for:</span> General questions
                      </p>
                    </p>
                  </div>
                </div>
                <Divider type="horizontal" light orientation="center" />
                <div>
                  <div
                    className="
                    dark:bg-scale-400 flex 
                    flex-col justify-between rounded rounded-t-none border-b
                    border-r border-l
                    border-gray-100 bg-white p-5
                    pt-10 dark:border-gray-600"
                  >
                    <Link
                      href="https://github.com/supabase/supabase/discussions"
                      as="https://github.com/supabase/supabase/discussions"
                    >
                      <a target="_blank">
                        <Button size="medium" type="default" iconRight={<IconMessageCircle />}>
                          Join The Discussion
                        </Button>
                      </a>
                    </Link>
                  </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-6 xl:col-span-4">
                <div
                  className="dark:bg-scale-400 flex h-40 
                    flex-col justify-between rounded rounded-b-none border-t
                    border-r
                    border-l border-gray-100 bg-white
                    p-5 dark:border-gray-600
                    "
                >
                  <div className="mb-4">
                    <h5 className="mb-1">Email Support</h5>
                    <p className="block">
                      <p>
                        We offer email based support. If you need SLAs, guaranteed response times,
                        or have an issue, please contact us here.
                      </p>
                      <p>
                        <span className="font-bold">Use this for:</span> Issues or questions
                        specific to you
                      </p>
                    </p>
                  </div>
                </div>
                <Divider type="horizontal" light orientation="center" />
                <div>
                  <div
                    className="
                    bbg-white dark:bg-scale-400 
                    flex flex-col justify-between rounded rounded-t-none
                    border-b border-r
                    border-l border-gray-100 p-5
                    pt-10 dark:border-gray-600"
                  >
                    <a href="mailto:support@supabase.io">
                      <Button size="medium" type="default" iconRight={<IconMail />}>
                        Email Support
                      </Button>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </SectionContainer>
        </Container>
      </Layout>
    </>
  )
}

export default Index
