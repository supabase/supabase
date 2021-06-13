import Container from 'components/Container'
import Layout from '~/components/Layouts/Default'
import Hero from 'components/Hero'
import Link from 'next/link'
import {
  Button,
  Badge,
  IconArrowUpRight,
  IconMessageCircle,
  IconShuffle,
  IconX,
  Space,
  Tabs,
  Typography,
  IconGitHub,
  Divider,
  IconMail,
  IconChat,
} from '@supabase/ui'
import Examples from 'data/Examples.json'
import ExampleCard from 'components/ExampleCard'
import Features from 'components/Features/index'
import BuiltExamples from 'components/BuiltWithSupabase/index'
import MadeForDevelopers from 'components/MadeForDevelopers/index'
import AdminAccess from 'components/AdminAccess/index'
import CaseStudies from 'components/CaseStudies/index'
import CTABanner from 'components/CTABanner/index'
import SectionContainer from '~/components/Layouts/SectionContainer'
import TwitterSocialProof from '~/components/Sections/TwitterSocialProof'

// Import Swiper styles if swiper used on page
import 'swiper/swiper.min.css'

type Props = {}

const Index = ({}: Props) => {

  return (
    <>
      <Layout>
        <Container>
          
          <SectionContainer className="">
            <div className="text-center">
              <Typography.Title level={2}>Get Support</Typography.Title>
              <Typography.Text>
                <p className="lg:text-lg">
                  Need a bit of help? We're here for you. Check out our current issues, GitHub discussions, or get email support.
                </p>
              </Typography.Text>
            </div>
            <div className="grid grid-cols-12 gap-5 mt-16">
              <div className='col-span-12 lg:col-span-6 xl:col-span-4'>
                <div
                  className="h-40 bg-white dark:bg-gray-700 
                    border-t border-r border-l border-gray-100 dark:border-gray-600
                    p-5
                    flex flex-col justify-between
                    rounded rounded-b-none
                    "
                >
                  <div className="mb-4">
                    <Typography.Title level={5} className="mb-1">
                      GitHub Issues
                    </Typography.Title>
                    <Typography.Text className="block">
                      <p>Description Description Description Description DescriptionDescription escription Description Description DescriptionDescription Description </p>
                    </Typography.Text>
                  </div>
                </div>
                <Divider light />
                <div>
                  <div
                    className="
                    bg-white dark:bg-gray-800 
                    border-b border-r border-l border-gray-100 dark:border-gray-600
                    p-5
                    flex flex-col justify-between
                    rounded rounded-t-none"
                  >
                    <Space className="">
                        <Link href='https://github.com/supabase/supabase/issues' as='https://github.com/supabase/supabase/issues'>
                          <a target="_blank">
                            <Button size="medium" type="default" iconRight={<IconGitHub />}>
                              Go To Issues
                            </Button>
                          </a>
                        </Link>
                    </Space>
                  </div>
                </div>
              </div>
              <div className='col-span-12 lg:col-span-6 xl:col-span-4'>
                <div
                  className="h-40 bg-white dark:bg-gray-700 
                    border-t border-r border-l border-gray-100 dark:border-gray-600
                    p-5
                    flex flex-col justify-between
                    rounded rounded-b-none
                    "
                >
                  <div className="mb-4">
                    <Typography.Title level={5} className="mb-1">
                      GitHub Discussions
                    </Typography.Title>
                    <Typography.Text className="block">
                      <p>For help and questions about best practices, join our GitHub discussions. Browse and ask questions, talk to other Supabase Developers, and more.</p>
                    </Typography.Text>
                  </div>
                </div>
                <Divider light />
                <div>
                  <div
                    className="
                    bg-white dark:bg-gray-800 
                    border-b border-r border-l border-gray-100 dark:border-gray-600
                    p-5
                    flex flex-col justify-between
                    rounded rounded-t-none"
                  >
                    <Space className="">
                        <Link href='https://github.com/supabase/supabase/discussions' as='https://github.com/supabase/supabase/discussions'>
                          <a target="_blank">
                            <Button size="medium" type="default" iconRight={<IconMessageCircle />}>
                              Join The Discussion
                            </Button>
                          </a>
                        </Link>
                    </Space>
                  </div>
                </div>
              </div>

              <div className='col-span-12 lg:col-span-6 xl:col-span-4'>
                <div
                  className="h-40 bg-white dark:bg-gray-700 
                    border-t border-r border-l border-gray-100 dark:border-gray-600
                    p-5
                    flex flex-col justify-between
                    rounded rounded-b-none
                    "
                >
                  <div className="mb-4">
                    <Typography.Title level={5} className="mb-1">
                      Email Support
                    </Typography.Title>
                    <Typography.Text className="block">
                      <p>We offer email based support. You can email us at beta@supabase.io. If you need SLAs, guaranteed response times, or other enterprise level services, please contact us at this email address.</p>
                    </Typography.Text>
                  </div>
                </div>
                <Divider light />
                <div>
                  <div
                    className="
                    bg-white dark:bg-gray-800 
                    border-b border-r border-l border-gray-100 dark:border-gray-600
                    p-5
                    flex flex-col justify-between
                    rounded rounded-t-none"
                  >
                    <Space className="">
                      <a href="mailto:beta@supabase.io">
                        <Button size="medium" type="default" iconRight={<IconMail />}>
                          Email Support
                        </Button>
                      </a>
                    </Space>
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
