import Container from '../components/container'
import Layout from '../components/layout'
import Head from 'next/head'
import { CMS_NAME } from '../lib/constants'

import Hero from '../components/hero'
import Features from '../components/features'
import BuiltExamples from '../components/index_sections/BuiltWithSupabase'
import MadeForDevelopers from '../components/index_sections/MadeForDevelopers'
import AdminAccess from '../components/index_sections/AdminAccess'
import CaseStudies from '../components/index_sections/CaseStudies'
import CTABanner from '../components/index_sections/CTABanner'

type Props = {
  
}

const Index = ({  }: Props) => {
  return (
    <>
      <Layout>
        <Head>
          <title>{CMS_NAME}</title>
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
