import Head from 'next/head'
import { APP_NAME, DESCRIPTION } from 'lib/constants'

import Container from 'components/Container'
import Layout from 'components/Layout'
import Hero from 'components/Hero'
import Features from 'components/Features/index'
import BuiltExamples from 'components/BuiltWithSupabase/index'
import MadeForDevelopers from 'components/MadeForDevelopers/index'
import AdminAccess from 'components/AdminAccess/index'
import CaseStudies from 'components/CaseStudies/index'
import CTABanner from 'components/CTABanner/index'

type Props = {}

const site_title = `The Open Source Firebase Alternative | ${APP_NAME}`

const Index = ({}: Props) => {
  return (
    <>
      <Layout>
        <Head>
          <title>
            {DESCRIPTION} | {site_title}
          </title>
          <meta name="og:title" property="og:title" content={site_title} />
          <meta name="twitter:site" content={site_title} />
        </Head>
        <Container>
          <Hero />
          <Features />
          <BuiltExamples />
          <MadeForDevelopers />
          <AdminAccess />
          <CaseStudies />
          <CTABanner />
        </Container>
      </Layout>
    </>
  )
}

export default Index
