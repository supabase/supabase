import SectionContainer from './Layouts/SectionContainer'
import TwitterSocialProof from './Sections/TwitterSocialProof'

const TwitterSocialSection = () => {
  return (
    <section className="relative">
      <div className="section-container pb-0">
        <div className="overflow-x-hidden">
          <SectionContainer className="mb-0 pb-8">
            <TwitterSocialProof />
          </SectionContainer>
        </div>
      </div>
    </section>
  )
}

export default TwitterSocialSection
