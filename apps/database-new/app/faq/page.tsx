import { FAQS, faq } from '@/data/faqs'
import { slugify } from '@/lib/utils'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'database.design | Faq',
}

const FAQ = async () => {
  return (
    <div className="bg-background">
      <div className="py-16 bg-white ">
        <div className="max-w-screen-md px-4 mx-auto sm:px-6 lg:px-8">
          <h1 className="text-center font-display text-3xl font-bold text-black sm:text-5xl">
            Frequently Asked Questions
          </h1>
          <p className="mt-5 text-lg text-center text-foreground-light">
            Everything you have ever wondered about database.design
          </p>
        </div>
      </div>
      <div className="flex flex-col items-center max-w-screen-md px-4 py-10 mx-auto sm:pt-20 sm:px-6 lg:px-8">
        {FAQS.map((faq: faq, index) => (
          <article
            key={index}
            className="prose prose-headings:scroll-mt-20 prose-headings:font-display prose-headings:font-semibold w-full"
          >
            <a href={`#${slugify(faq.question)}`} className="no-underline hover:underline">
              <h2 id={slugify(faq.question)}>{faq.question}</h2>
            </a>
            <p>{faq.answer}</p>
          </article>
        ))}
      </div>
    </div>
  )
}

export default FAQ
