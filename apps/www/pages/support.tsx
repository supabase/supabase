import Container from 'components/Container'
import Layout from '~/components/Layouts/Default'
import Link from 'next/link'
import { Button, IconMessageCircle, IconGitHub, Divider, IconMail } from 'ui'
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
              url: `https://supabase.com/images/og/og-image-v2.jpg`,
            },
          ],
        }}
      />
      <Layout>
        <Container>
          <SectionContainer className="">
            <div className="space-y-2 text-center">
              <h1 className="text-brand font-mono text-base uppercase tracking-widest">Support</h1>
              <h1 className="h1">Get Support</h1>
              <p className="text-scale-1100 lg:text-lg">
                The Supabase Support Team is ready to help.
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
                    <h5 className="text-scale-1200 text-lg font-medium">GitHub Issues</h5>
                    <p className="my-2 block">
                      <p className="text-scale-1100">
                        Have a general issue or bug that you've found? We'd love to hear about it in
                        our GitHub issues. This can be feature requests too!
                      </p>
                      <p className="text-scale-1100 mt-2 text-sm">
                        <span className="text-brand font-bold">Use this for:</span> Bugs and other
                        issues
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
                    pt-14 dark:border-gray-600"
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
                    <h5 className="text-scale-1200 text-lg font-medium">
                      GitHub Discussions/Discord
                    </h5>
                    <p className="my-2 block">
                      <p className="text-scale-1100">
                        For help and questions about best practices, join our GitHub discussions or
                        join us on Discord. Browse and ask questions.
                      </p>
                      <p className="text-scale-1100 mt-2 text-sm">
                        <span className="text-brand text-sm font-bold">Use this for:</span> General
                        questions
                      </p>
                    </p>
                  </div>
                </div>
                <Divider type="horizontal" light orientation="center" />
                <div>
                  <div
                    className="
                    dark:bg-scale-400 flex flex-row
                    gap-2 rounded rounded-t-none border-b border-r
                    border-l border-gray-100
                    bg-white p-5 pt-14
                    dark:border-gray-600 lg:justify-evenly"
                  >
                    <Link
                      href="https://github.com/supabase/supabase/discussions"
                      as="https://github.com/supabase/supabase/discussions"
                    >
                      <a target="_blank">
                        <Button size="medium" type="default" iconRight={<IconMessageCircle />}>
                          Join the discussion
                        </Button>
                      </a>
                    </Link>
                    <Link href="https://discord.supabase.com/" as="https://discord.supabase.com/">
                      <a target="_blank">
                        <Button
                          size="medium"
                          type="default"
                          iconRight={
                            <svg
                              className="h-5 w-5"
                              fill="currentColor"
                              viewBox="0 0 71 55"
                              aria-hidden="true"
                            >
                              <path
                                fillRule="evenodd"
                                d="M60.1045 4.8978C55.5792 2.8214 50.7265 1.2916 45.6527 0.41542C45.5603 0.39851 45.468 0.440769 45.4204 0.525289C44.7963 1.6353 44.105 3.0834 43.6209 4.2216C38.1637 3.4046 32.7345 3.4046 27.3892 4.2216C26.905 3.0581 26.1886 1.6353 25.5617 0.525289C25.5141 0.443589 25.4218 0.40133 25.3294 0.41542C20.2584 1.2888 15.4057 2.8186 10.8776 4.8978C10.8384 4.9147 10.8048 4.9429 10.7825 4.9795C1.57795 18.7309 -0.943561 32.1443 0.293408 45.3914C0.299005 45.4562 0.335386 45.5182 0.385761 45.5576C6.45866 50.0174 12.3413 52.7249 18.1147 54.5195C18.2071 54.5477 18.305 54.5139 18.3638 54.4378C19.7295 52.5728 20.9469 50.6063 21.9907 48.5383C22.0523 48.4172 21.9935 48.2735 21.8676 48.2256C19.9366 47.4931 18.0979 46.6 16.3292 45.5858C16.1893 45.5041 16.1781 45.304 16.3068 45.2082C16.679 44.9293 17.0513 44.6391 17.4067 44.3461C17.471 44.2926 17.5606 44.2813 17.6362 44.3151C29.2558 49.6202 41.8354 49.6202 53.3179 44.3151C53.3935 44.2785 53.4831 44.2898 53.5502 44.3433C53.9057 44.6363 54.2779 44.9293 54.6529 45.2082C54.7816 45.304 54.7732 45.5041 54.6333 45.5858C52.8646 46.6197 51.0259 47.4931 49.0921 48.2228C48.9662 48.2707 48.9102 48.4172 48.9718 48.5383C50.038 50.6034 51.2554 52.5699 52.5959 54.435C52.6519 54.5139 52.7526 54.5477 52.845 54.5195C58.6464 52.7249 64.529 50.0174 70.6019 45.5576C70.6551 45.5182 70.6887 45.459 70.6943 45.3942C72.1747 30.0791 68.2147 16.7757 60.1968 4.9823C60.1772 4.9429 60.1437 4.9147 60.1045 4.8978ZM23.7259 37.3253C20.2276 37.3253 17.3451 34.1136 17.3451 30.1693C17.3451 26.225 20.1717 23.0133 23.7259 23.0133C27.308 23.0133 30.1626 26.2532 30.1066 30.1693C30.1066 34.1136 27.28 37.3253 23.7259 37.3253ZM47.3178 37.3253C43.8196 37.3253 40.9371 34.1136 40.9371 30.1693C40.9371 26.225 43.7636 23.0133 47.3178 23.0133C50.9 23.0133 53.7545 26.2532 53.6986 30.1693C53.6986 34.1136 50.9 37.3253 47.3178 37.3253Z"
                                clipRule="evenodd"
                              />
                            </svg>
                          }
                        >
                          Join Discord
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
                    <h5 className="text-scale-1200 text-lg font-medium">Email Support</h5>
                    <p className="my-2 block">
                      <p className="text-scale-1100">
                        We offer email based support. If you need SLAs, guaranteed response times,
                        or have an issue, please contact us here.
                      </p>
                      <p className="text-scale-1100 mt-2 text-sm">
                        <span className="text-brand text-sm font-bold">Use this for:</span> Issues
                        or questions specific to you
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
                    pt-14 dark:border-gray-600"
                  >
                    <a href="https://supabase.com/dashboard/support/new">
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
