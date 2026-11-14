import { FaqList } from '~/components/FaqList'
import pricingFaq from '~/data/PricingFAQ.json'

const PricingFAQs = () => {
  return (
    <div className="mx-auto max-w-5xl gap-y-10 gap-x-10 lg:grid-cols-2">
      <div className="sm:py-18 mx-auto px-6 py-16 md:py-24 lg:px-16 lg:py-24 xl:px-20">
        <h2 className="h3 text-center">Frequently asked questions</h2>
        <div className="my-16">
          <FaqList items={pricingFaq} />
        </div>
        <p className="p text-center">
          Can&apos;t find the answer to your question?{' '}
          <a
            target="_blank"
            href="https://supabase.help"
            className="transition underline text-primary hover:text-brand-600"
          >
            Open a support ticket
          </a>{' '}
          to receive help from our team.
        </p>
      </div>
    </div>
  )
}

export default PricingFAQs
