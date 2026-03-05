/**
 * Data used in guide MDX files.
 *
 * This data is passed to MDX files via scope to avoid using `export const`
 * within MDX content, which is not supported by next-mdx-remote.
 *
 * @see https://github.com/hashicorp/next-mdx-remote#import--export
 */

export const guidesData = {
  // apps/docs/content/guides/self-hosting.mdx
  selfHostingCommunity: [
    {
      name: 'Kubernetes',
      description: 'Helm charts to deploy a Supabase on Kubernetes.',
      href: 'https://github.com/supabase-community/supabase-kubernetes',
    },
    {
      name: 'Traefik',
      description: 'A self-hosted Supabase setup with Traefik as a reverse proxy.',
      href: 'https://github.com/supabase-community/supabase-traefik',
    },
  ],

  // apps/docs/content/guides/ai.mdx
  aiExamples: [
    {
      name: 'Headless Vector Search',
      description:
        'A toolkit to perform vector similarity search on your knowledge base embeddings.',
      href: '/guides/ai/examples/headless-vector-search',
    },
    {
      name: 'Image Search with OpenAI CLIP',
      description: 'Implement image search with the OpenAI CLIP Model and Supabase Vector.',
      href: '/guides/ai/examples/image-search-openai-clip',
    },
    {
      name: 'Hugging Face inference',
      description: 'Generate image captions using Hugging Face.',
      href: '/guides/ai/examples/huggingface-image-captioning',
    },
    {
      name: 'OpenAI completions',
      description: 'Generate GPT text completions using OpenAI in Edge Functions.',
      href: '/guides/ai/examples/openai',
    },
    {
      name: 'Building ChatGPT Plugins',
      description: 'Use Supabase as a Retrieval Store for your ChatGPT plugin.',
      href: '/guides/ai/examples/building-chatgpt-plugins',
    },
    {
      name: 'Vector search with Next.js and OpenAI',
      description:
        'Learn how to build a ChatGPT-style doc search powered by Next.js, OpenAI, and Supabase.',
      href: '/guides/ai/examples/nextjs-vector-search',
    },
  ],

  aiIntegrations: [
    {
      name: 'OpenAI',
      description:
        'OpenAI is an AI research and deployment company. Supabase provides a simple way to use OpenAI in your applications.',
      href: '/guides/ai/examples/building-chatgpt-plugins',
    },
    {
      name: 'Amazon Bedrock',
      description:
        'A fully managed service that offers a choice of high-performing foundation models from leading AI companies.',
      href: '/guides/ai/integrations/amazon-bedrock',
    },
    {
      name: 'Hugging Face',
      description:
        "Hugging Face is an open-source provider of NLP technologies. Supabase provides a simple way to use Hugging Face's models in your applications.",
      href: '/guides/ai/hugging-face',
    },
    {
      name: 'LangChain',
      description:
        'LangChain is a language-agnostic, open-source, and self-hosted API for text translation, summarization, and sentiment analysis.',
      href: '/guides/ai/langchain',
    },
    {
      name: 'LlamaIndex',
      description: 'LlamaIndex is a data framework for your LLM applications.',
      href: '/guides/ai/integrations/llamaindex',
    },
  ],

  // apps/docs/content/guides/storage.mdx
  storageExamples: [
    {
      name: 'Resumable Uploads with Uppy',
      description:
        'Use Uppy to upload files to Supabase Storage using the TUS protocol (resumable uploads).',
      href: 'https://github.com/supabase/supabase/tree/master/examples/storage/resumable-upload-uppy',
    },
  ],
}
