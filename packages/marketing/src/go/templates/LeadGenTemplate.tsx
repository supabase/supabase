import type { LeadGenPage } from '../schemas'
import HeroSection from '../sections/HeroSection'
import SectionRenderer, { type CustomSectionRenderers } from '../sections/SectionRenderer'

export default function LeadGenTemplate({
  page,
  customRenderers,
}: {
  page: LeadGenPage
  customRenderers?: CustomSectionRenderers
}) {
  return (
    <div className="flex flex-col gap-16 sm:gap-24">
      <HeroSection section={page.hero} />
      {page.sections?.map((section, i) => (
        <SectionRenderer key={i} section={section} customRenderers={customRenderers} />
      ))}
    </div>
  )
}
