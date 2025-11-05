import SectionContainer from './Layouts/SectionContainer'
import TwitterSocialProof from './Sections/TwitterSocialProof'
import TwitterSocialProofMobile from './Sections/TwitterSocialProofMobile'

export interface TwitterSocialSectionProps {
  heading: string
  subheading: string
  ctas: React.ReactNode
  tweets: any[]
}

const TwitterSocialSection = (props: TwitterSocialSectionProps) => (
  <>
    <SectionContainer className="w-full text-center flex flex-col items-center !pb-0">
      <h3 className="h2">{props.heading}</h3>
      <p className="p max-w-[300px] md:max-w-none">{props.subheading}</p>
      {props.ctas && <div className="my-4 flex justify-center gap-2">{props.ctas}</div>}
    </SectionContainer>
    <SectionContainer className="relative w-full !px-0 lg:!px-16 xl:!px-0 !pb-0 mb-16 md:mb-12 lg:mb-12 !pt-6 max-w-[1400px]">
      <TwitterSocialProofMobile className="lg:hidden -mb-32" tweets={props.tweets} />
      <TwitterSocialProof className="hidden lg:flex" />
    </SectionContainer>
  </>
)

export default TwitterSocialSection
