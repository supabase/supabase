import { ChevronDown } from 'lucide-react'
import ReactMarkdown from 'react-markdown'

import { faqPageSchema, serializeJsonLd } from '@/lib/json-ld'

export function FaqList({ items }: { items: { question: string; answer: string }[] }) {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: serializeJsonLd(faqPageSchema(items)) }}
      />
      <div className="text-foreground-light">
        {items.map((faq, i) => (
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
        ))}
      </div>
    </>
  )
}
