import type { Metadata } from 'next'

type faq = {
  question: string
  answer: string
}

export const metadata: Metadata = {
  title: 'database.design | Faq',
}

const FAQS = [
  {
    question: 'What is database.design?',
    answer:
      'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Doloremque molestias dicta nobis explicabo maiores officia blanditiis cupiditate, quibusdam debitis! Dignissimos ducimus aut temporibus ea, repellat consectetur quisquam molestiae recusandae rem.',
  },
  {
    question: 'How does it work?',
    answer:
      'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Doloremque molestias dicta nobis explicabo maiores officia blanditiis cupiditate, quibusdam debitis! Dignissimos ducimus aut temporibus ea, repellat consectetur quisquam molestiae recusandae rem.',
  },
  {
    question: 'Can I see the code?',
    answer:
      'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Doloremque molestias dicta nobis explicabo maiores officia blanditiis cupiditate, quibusdam debitis! Dignissimos ducimus aut temporibus ea, repellat consectetur quisquam molestiae recusandae rem.',
  },
  {
    question: 'Can I use this for non-Postgres databases?',
    answer:
      'Lorem ipsum dolor sit, amet consectetur adipisicing elit. Doloremque molestias dicta nobis explicabo maiores officia blanditiis cupiditate, quibusdam debitis! Dignissimos ducimus aut temporibus ea, repellat consectetur quisquam molestiae recusandae rem.',
  },
]

function slugify(str: string) {
  return str
    .toLowerCase() // Convert to lowercase
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/[^\w-]+/g, '') // Remove non-word characters except hyphens
    .replace(/--+/g, '-') // Replace multiple consecutive hyphens with a single hyphen
    .replace(/^-+|-+$/g, '') // Remove leading and trailing hyphens
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
            className="prose prose-headings:scroll-mt-20 prose-headings:font-display prose-headings:font-semibold"
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
