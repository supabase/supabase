'use client'

import ReactMarkdown from 'react-markdown'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from 'ui'

const FAQ_ITEMS = [
  {
    question: 'What is Supabase Marketplace?',
    answer:
      'Supabase Marketplace is a curated set of native and partner integrations you can discover and install directly from the Supabase Dashboard. It makes adding functionality to your project faster and safer than manual setup.',
  },
  {
    question: 'How is this different from the Partner Catalog?',
    answer:
      'The [Partner Catalog](/partners/catalog) is a broad directory of companies that integrate with Supabase. Marketplace is the in-product, install-oriented layer within the Catalog — it has a higher bar for "works well inside Supabase" and provides a streamlined, guided install experience rather than linking out to docs.',
  },
  {
    question: 'What does "one-click" mean?',
    answer:
      '"One-click" means the integration can be installed with minimal manual steps. Where possible it uses OAuth so you\'re not copying long-lived credentials between dashboards. Not every integration is literally a single click, but the goal is a fast, guided flow on the happy path.',
  },
]

export function MarketplaceFaq() {
  return (
    <Accordion type="multiple" className="text-foreground-light">
      {FAQ_ITEMS.map((faq, i) => (
        <div className="border-b py-2" key={i}>
          <AccordionItem value={`faq--${i}`} className="border-none">
            <AccordionTrigger>
              <span className="text-foreground">{faq.question}</span>
            </AccordionTrigger>
            <AccordionContent>
              <div className="prose text-foreground-lighter">
                <ReactMarkdown>{faq.answer}</ReactMarkdown>
              </div>
            </AccordionContent>
          </AccordionItem>
        </div>
      ))}
    </Accordion>
  )
}
