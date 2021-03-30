import Container from 'components/Container'
import Layout from '~/components/Layouts/Default'
import Hero from 'components/Hero'

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
          <Hero />
          <Features />
          <div className="relative">
            <div className="section--masked">
              <div className="section--bg-masked">
                <div className="section--bg border-t border-b border-gray-100 dark:border-gray-600"></div>
              </div>
              <div className="section-container pt-12 pb-0">
                <div className="overflow-x-hidden">
                  <SectionContainer className="mb-0 pb-8">
                    <TwitterSocialProof />
                  </SectionContainer>
                </div>
              </div>
            </div>
          </div>
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
