import type { LegalPage } from '../schemas'
import HeroSection from '../sections/HeroSection'
import SectionRenderer, { type CustomSectionRenderers } from '../sections/SectionRenderer'
import TableOfContents from '../sections/TableOfContents'
import TextBodySection from '../sections/TextBodySection'

export default function LegalTemplate({
  page,
  customRenderers,
}: {
  page: LegalPage
  customRenderers?: CustomSectionRenderers
}) {
  const hero = page.effectiveDate
    ? { ...page.hero, subtitle: `Effective date: ${page.effectiveDate}` }
    : page.hero

  return (
    <div className="flex flex-col gap-16 sm:gap-24">
      <HeroSection section={hero} compact />
      <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr] gap-24 max-w-5xl mx-auto px-8 w-full">
        <div className="hidden lg:block">
          <TableOfContents content={page.body} />
        </div>
        <TextBodySection section={{ content: page.body }} />
      </div>
      {page.sections?.map((section, i) => (
        <SectionRenderer key={i} section={section} customRenderers={customRenderers} />
      ))}
    </div>
  )
}
