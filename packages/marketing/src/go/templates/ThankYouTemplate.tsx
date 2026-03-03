import type { ThankYouPage } from '../schemas'
import Confetti from '../sections/Confetti'
import HeroSection from '../sections/HeroSection'
import SectionRenderer, { type CustomSectionRenderers } from '../sections/SectionRenderer'

export default function ThankYouTemplate({
  page,
  customRenderers,
}: {
  page: ThankYouPage
  customRenderers?: CustomSectionRenderers
}) {
  return (
    <div className="flex flex-col gap-16 sm:gap-24">
      <div className="relative">
        <HeroSection section={page.hero} compact />
        <Confetti />
      </div>
      {page.sections?.map((section, i) => (
        <SectionRenderer key={i} section={section} customRenderers={customRenderers} />
      ))}
    </div>
  )
}
