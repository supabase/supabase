'use client'

import ReactMarkdown from 'react-markdown'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from 'ui'

const faqs = [
  {
    question: 'What is Supabase Workers?',
    answer:
      'Workers is a fully managed compute service that runs inside your Supabase project. It covers two shapes of work on one runtime: short-lived, isolated sandboxes for executing untrusted code (for example, code written by AI agents), and always-on HTTP services written in Node, Python, Deno, Rust, or packaged as a Dockerfile. Every Worker runs in the same region and network as your primary database.',
  },
  {
    question: 'How do Workers relate to Edge Functions?',
    answer:
      'Edge Functions remain supported and your deployed functions keep running unchanged — there is no forced migration and no sunset at launch. Workers is a general-purpose compute runtime with more memory and CPU and no wall-clock limits. Because Workers supports the Deno runtime, existing Edge Functions can move over as-is whenever you choose, with secrets and routing preserved.',
  },
  {
    question: 'Which languages and runtimes are supported?',
    answer:
      'Node, Python, Deno, and Rust are supported natively, including multithreaded native libraries. You can also deploy static binaries or bring any Dockerfile — no wrapper scripts or extra orchestration code required.',
  },
  {
    question: 'Can a Worker run indefinitely?',
    answer:
      'There are no wall-clock limits, so jobs and pipelines run as long as the work takes. For HTTP services, Workers suspend automatically when idle on network I/O and resume in under a second, so a service configured as always-on behaves like one without billing you for idle time.',
  },
  {
    question: 'Where do Workers run?',
    answer:
      "Workers deploy to your primary database's region — that's where writes happen, and it keeps behavior predictable. Workers can still read from replicas via the load-balanced connection endpoint, so replica capacity isn't wasted. Pinning a Worker to a specific replica region is on the roadmap.",
  },
  {
    question: 'Can Workers have persistent disks?',
    answer:
      'Workers are designed to scale to zero and restart on demand, so the local filesystem is fast scratch space, not durable storage. For state that needs to persist, use your Postgres database for structured data and Supabase Storage for files — both reachable with near-zero intra-region latency and no data-transfer tax. Mountable persistent disks are on the roadmap.',
  },
  {
    question: 'How will pricing work?',
    answer:
      'Workers bills per compute-hour based on the instance size you choose, with no per-request metering. Idle Workers suspend automatically, so you pay nothing for compute while they sleep. Traffic between a Worker and its own database is free. There is no separate subscription — usage appears on your existing Supabase invoice with the same spend caps and credits. Final rates will be published before general availability.',
  },
  {
    question: 'How do I get access?',
    answer:
      'Workers is in Private Alpha. Join the waitlist and we will send invites in waves as capacity grows. Feedback from alpha participants directly shapes the product ahead of public launch.',
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
