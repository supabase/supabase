'use client'

import ReactMarkdown from 'react-markdown'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from 'ui'

const faqs = [
  {
    question: 'How does Compute relate to Edge Functions?',
    answer:
      'Edge Functions remain supported and your deployed functions keep running unchanged — there is no forced migration and no sunset at launch. Compute is a general-purpose runtime with more memory and CPU and no wall-clock limits. Because Compute supports the Deno runtime, existing Edge Functions can move over as-is whenever you choose, with secrets and routing preserved.',
  },
  {
    question: 'Which languages and runtimes are supported?',
    answer:
      'In Private Alpha, Node, Deno, and any Dockerfile are supported — no wrapper scripts or extra orchestration code required. Bun and Python are on the way; until they land, a Dockerfile covers anything else you need to run.',
  },
  {
    question: 'Can a service run indefinitely?',
    answer:
      'There are no wall-clock limits, so jobs and pipelines run as long as the work takes. For HTTP services, Compute suspends automatically when idle on network I/O and resumes in under a second, so a service configured as always-on behaves like one without billing you for idle time.',
  },
  {
    question: 'Where does Compute run?',
    answer:
      "Sandboxes and services deploy to your primary database's region — that's where writes happen, and it keeps behavior predictable. They can still read from replicas via the load-balanced connection endpoint, so replica capacity isn't wasted. Pinning a workload to a specific replica region is on the roadmap.",
  },
  {
    question: 'Can I attach a persistent disk?',
    answer:
      'Sandboxes and services are designed to scale to zero and restart on demand, so the local filesystem is fast scratch space, not durable storage. For state that needs to persist, use your Postgres database for structured data and Supabase Storage for files — both reachable with near-zero intra-region latency and no data-transfer tax. Mountable persistent disks are on the roadmap.',
  },
  {
    question: 'How will pricing work?',
    answer:
      'Compute bills per compute-hour based on the instance size you choose, with no per-request metering. Idle sandboxes and services suspend automatically, so you pay nothing while they sleep. Traffic between a workload and its own database is free. There is no separate subscription — usage appears on your existing Supabase invoice with the same spend caps and credits. Final rates will be published before general availability.',
  },
  {
    question: 'How do I get access?',
    answer:
      'Compute is in Private Alpha. Join the waitlist and we will send invites in waves as capacity grows. Feedback from alpha participants directly shapes the product ahead of public launch.',
  },
]

export function FAQSection() {
  return (
    <div className="mx-auto max-w-5xl">
      <div className="sm:py-18 mx-auto px-6 py-16 md:py-24 lg:px-16 lg:py-24 xl:px-20">
        <h2 className="h3 text-center">Frequently asked questions</h2>
        <div className="my-16">
          <Accordion type="multiple" className="text-foreground-light">
            {faqs.map((faq, i) => (
              <div className="border-b py-2" key={i}>
                <AccordionItem value={`faq--${i.toString()}`} className="border-none">
                  <AccordionTrigger>
                    <span className="text-foreground text-left">{faq.question}</span>
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
        </div>
      </div>
    </div>
  )
}
