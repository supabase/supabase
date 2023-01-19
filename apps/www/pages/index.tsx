import Container from 'components/Container'
import Layout from '~/components/Layouts/Default'
import Hero from 'components/Hero'

import Features from 'components/Features/index'
import BuiltExamples from 'components/BuiltWithSupabase/index'
import MadeForDevelopers from 'components/MadeForDevelopers/index'
import AdminAccess from 'components/AdminAccess/index'
import CaseStudies from 'components/CaseStudies/index'
import CTABanner from 'components/CTABanner/index'
import TwitterSocialSection from '~/components/TwitterSocialSection'

// Import Swiper styles if swiper used on page
import 'swiper/swiper.min.css'

type Props = {}

const Index = ({}: Props) => {
  return (
    <>
      <Layout>
        <Container>
          <div className="m-3">
            <div
              className="
              bg-UI-panel-bg 
              w-32
              rounded
              border
              border-UI-panel-border 
              p-3
              text-UI-text-body
              "
            >
              panel
            </div>
          </div>
          <Hero />
          <Features />
          <TwitterSocialSection />
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
