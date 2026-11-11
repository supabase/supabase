import pricingFaq from '~/data/PricingFAQ.json'
import { ChevronDown } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

const PricingFAQs = () => {
  return (
    <div className="mx-auto max-w-5xl gap-y-10 gap-x-10 lg:grid-cols-2">
      <div className="sm:py-18 mx-auto px-6 py-16 md:py-24 lg:px-16 lg:py-24 xl:px-20">
        <h2 className="h3 text-center">Frequently asked questions</h2>
        <div className="my-16 text-foreground-light">
          {pricingFaq.map((faq, i) => {
            return (
              <details className="group border-b py-2" key={i}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-2 py-4 text-left font-medium hover:underline focus-inset [&::-webkit-details-marker]:hidden">
                  <span className="text-foreground">{faq.question}</span>
                  <ChevronDown
                    aria-hidden="true"
                    className="h-4 w-4 shrink-0 transition-transform duration-200 group-open:rotate-180 motion-reduce:transition-none"
                  />
                </summary>
                <div className="prose pb-4 text-foreground-lighter">
                  <ReactMarkdown>{faq.answer}</ReactMarkdown>
                </div>
              </details>
            )
          })}
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
