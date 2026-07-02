'use client'

import pricingFaq from '~/data/PricingFAQ.json'
import React from 'react'
import ReactMarkdown from 'react-markdown'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from 'ui'

const PricingFAQs = () => {
  return (
    <div className="mx-auto max-w-5xl gap-y-10 gap-x-10 lg:grid-cols-2">
      <div className="sm:py-18 mx-auto px-6 py-16 md:py-24 lg:px-16 lg:py-24 xl:px-20">
        <h2 className="h3 text-center">Frequently asked questions</h2>
        <div className="my-16">
          <Accordion type="multiple" className="text-foreground-light">
            {pricingFaq.map((faq, i) => {
              return (
                <div className="border-b py-2" key={i}>
                  <AccordionItem value={`faq--${i.toString()}`} className="border-none">
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
              )
            })}
          </Accordion>
        </div>
        <p className="p text-center">
          Can&apos;t find the answer to your question?{' '}
          <a
            target="_blank"
            href="https://supabase.help"
            className="transition underline text-brand-link hover:text-brand-600"
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
