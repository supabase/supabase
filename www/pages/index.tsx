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

type Props = {
  
}

const site_title = `The Open Source Firebase Alternative | ${APP_NAME}`

const Index = ({  }: Props) => {
  return (
    <>
      <Layout>
        <Head>
          <title>{DESCRIPTION} | {site_title}</title>
          <meta name="description" content={DESCRIPTION} />
          <meta property="og:type" content="website" />
          <meta name="og:title" property="og:title" content={site_title} />
          <meta name="og:description" property="og:description" content={DESCRIPTION} />
          <meta property="og:site_name" content="" />
          <meta property="og:url" content="/public/og/og-image.jpg" />
          <meta name="twitter:card" content="summary" />
          <meta name="twitter:title" content="" />
          <meta name="twitter:description" content={DESCRIPTION} />
          <meta name="twitter:site" content={site_title} />
          <meta name="twitter:creator" content="supabase_io" />
          <link rel="icon" type="image/png" href="/public/favicon/favicon.ico" />
          <link rel="apple-touch-icon" href="/public/favicon/favicon.ico" />
          <meta property="og:image" content="/public/og/og-image.jpg" />
          <meta name="twitter:image" content="/public/og/og-image.jpg" />
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
