export type faq = {
  question: string
  answer: string
}

export const FAQS = [
  {
    question: 'What is database.design?',
    answer:
      'database.design is a new way to get ideas out of your head and into code as fast as possible. Supabase provides you tools to making building incredibly fast. This tool focuses on the very first step: turning your idea into a database schema.',
  },
  {
    question: 'How does it work?',
    answer: `We use OpenAI under the hood to provide responses to your prompts. Just like ChatGPT, you can fine-tune your responses until you're happy with the schema. We're using React Flow to visualize the schemas.`,
  },
  {
    question: 'Can I see the code?',
    answer: 'You sure can. All of the source code is open source and available on Github. ',
  },
  {
    question: 'Can I contribute to this project?',
    answer: 'You sure can. All of the source code is open source and available on Github. ',
  },
  {
    question: `What's the license? Can we fork this project and build our own?`,
    answer: 'Yes. We release software under the Apache License 2.0.',
  },
  {
    question: 'Can I use this for non-Postgres databases?',
    answer: `Not at the moment. We've tailored the responses to try and do a great job returning Postgres-flavored SQL`,
  },
]
