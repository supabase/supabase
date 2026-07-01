import type { ContentListingGroup } from '~/lib/content-listings.schema'

export const aiExamples: ContentListingGroup = {
  id: 'ai-examples',
  heading: 'Examples',
  headingLevel: 'h2',
  type: 'grid',
  items: [
    {
      title: 'Headless Vector Search',
      href: '/guides/ai/examples/headless-vector-search',
      icon: '/docs/img/icons/github-icon',
      description: 'A toolkit to perform vector similarity search on your knowledge base embeddings.',
    },
    {
      title: 'Image Search with OpenAI CLIP',
      href: '/guides/ai/examples/image-search-openai-clip',
      icon: '/docs/img/icons/github-icon',
      description: 'Implement image search with the OpenAI CLIP Model and Supabase Vector.',
    },
    {
      title: 'Hugging Face inference',
      href: '/guides/ai/examples/huggingface-image-captioning',
      icon: '/docs/img/icons/github-icon',
      description: 'Generate image captions using Hugging Face.',
    },
    {
      title: 'OpenAI completions',
      href: '/guides/ai/examples/openai',
      icon: '/docs/img/icons/github-icon',
      description: 'Generate GPT text completions using OpenAI in Edge Functions.',
    },
    {
      title: 'Building ChatGPT Plugins',
      href: '/guides/ai/examples/building-chatgpt-plugins',
      icon: '/docs/img/icons/github-icon',
      description: 'Use Supabase as a Retrieval Store for your ChatGPT plugin.',
    },
    {
      title: 'Vector search with Next.js and OpenAI',
      href: '/guides/ai/examples/nextjs-vector-search',
      icon: '/docs/img/icons/github-icon',
      description:
        'Learn how to build a ChatGPT-style doc search powered by Next.js, OpenAI, and Supabase.',
    },
  ],
}

export const aiIntegrations: ContentListingGroup = {
  id: 'ai-integrations',
  heading: 'Integrations',
  headingLevel: 'h2',
  type: 'grid',
  items: [
    {
      title: 'OpenAI',
      href: '/guides/ai/examples/building-chatgpt-plugins',
      description:
        'OpenAI is an AI research and deployment company. Supabase provides a way to use OpenAI in your applications.',
    },
    {
      title: 'Amazon Bedrock',
      href: '/guides/ai/integrations/amazon-bedrock',
      description:
        'A fully managed service that offers a choice of high-performing foundation models from leading AI companies.',
    },
    {
      title: 'Hugging Face',
      href: '/guides/ai/hugging-face',
      description:
        "Hugging Face is an open-source provider of NLP technologies. Supabase provides a way to use Hugging Face's models in your applications.",
    },
    {
      title: 'LangChain',
      href: '/guides/ai/langchain',
      description:
        'LangChain is a language-agnostic, open-source, and self-hosted API for text translation, summarization, and sentiment analysis.',
    },
    {
      title: 'LlamaIndex',
      href: '/guides/ai/integrations/llamaindex',
      description: 'LlamaIndex is a data framework for your LLM applications.',
    },
  ],
}

export const aiCaseStudies: ContentListingGroup = {
  id: 'ai-case-studies',
  heading: 'Case studies',
  headingLevel: 'h2',
  type: 'grid',
  items: [
    {
      title: 'Berri AI Boosts Productivity by Migrating from AWS RDS to Supabase with pgvector',
      href: 'https://supabase.com/customers/berriai',
      description:
        'Learn how Berri AI overcame challenges with self-hosting their vector database on AWS RDS and successfully migrated to Supabase.',
    },
    {
      title: 'Firecrawl switches from Pinecone to Supabase for Postgres vector embeddings',
      href: 'https://supabase.com/customers/firecrawl',
      description:
        'How Firecrawl boosts efficiency and accuracy of chat powered search for documentation using Supabase with pgvector',
    },
    {
      title: 'Markprompt: GDPR-Compliant AI Chatbots for Docs and Websites',
      href: 'https://supabase.com/customers/markprompt',
      description:
        "AI-powered chatbot platform, Markprompt, empowers developers to deliver efficient and GDPR-compliant prompt experiences on top of their content, by leveraging Supabase's secure and privacy-focused database and authentication solutions",
    },
  ],
}
