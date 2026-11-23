import { FaqList } from '~/components/FaqList'
import homeFaq from '~/data/HomeFAQ.json'

// Server component: rendered on the server and passed to HomeContent as a slot
// so the FAQ markup and FAQPage JSON-LD ship in the initial HTML.
export function FAQSection() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="sm:py-18 mx-auto px-6 py-16 md:py-24 lg:px-16 lg:py-24 xl:px-20">
        <h2 className="h3 text-center">Frequently asked questions</h2>
        <div className="my-16">
          <FaqList items={homeFaq} />
        </div>
      </div>
    </div>
  )
}
