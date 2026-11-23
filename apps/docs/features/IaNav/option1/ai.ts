import type { NavMenuConstant } from '@/components/Navigation/Navigation.types'
import { vectorIndexItems } from '@/components/Navigation/NavigationMenu/NavigationMenu.constants'

export const ai: NavMenuConstant = {
  icon: 'ai',
  title: 'AI and Vectors',
  url: '/guides/ai',
  items: [
    {
      name: 'Concepts',
      items: [
        { name: 'Overview', url: '/guides/ai/concepts' },
        { name: 'Structured and unstructured', url: '/guides/ai/structured-unstructured' },
      ],
    },
    {
      name: 'Learn',
      items: [
        { name: 'Vector columns', url: '/guides/ai/vector-columns' },
        {
          name: 'Vector indexes',
          items: [{ name: 'Overview', url: '/guides/ai/vector-indexes' }, ...vectorIndexItems],
        },
        { name: 'Automatic embeddings', url: '/guides/ai/automatic-embeddings' },
        { name: 'Engineering for scale', url: '/guides/ai/engineering-for-scale' },
        { name: 'Choosing a compute add-on', url: '/guides/ai/choosing-compute-addon' },
        { name: 'Going to production', url: '/guides/ai/going-to-prod' },
        { name: 'RAG with permissions', url: '/guides/ai/rag-with-permissions' },
      ],
    },
    {
      name: 'Search',
      items: [
        { name: 'Semantic search', url: '/guides/ai/semantic-search' },
        { name: 'Keyword search', url: '/guides/ai/keyword-search' },
        { name: 'Hybrid search', url: '/guides/ai/hybrid-search' },
      ],
    },
    {
      name: 'JavaScript examples',
      items: [
        { name: 'OpenAI completions', url: '/guides/ai/examples/openai' },
        {
          name: 'Hugging Face image captions',
          url: '/guides/ai/examples/huggingface-image-captioning',
        },
        {
          name: 'Generate embeddings',
          url: '/guides/ai/quickstarts/generate-text-embeddings',
        },
        {
          name: 'Generative Q&A for docs',
          url: '/guides/ai/examples/headless-vector-search',
        },
        {
          name: 'Generative Q&A for Next.js',
          url: '/guides/ai/examples/nextjs-vector-search',
        },
      ],
    },
    {
      name: 'Python client',
      items: [
        { name: 'Choosing a client', url: '/guides/ai/python-clients' },
        { name: 'API', url: '/guides/ai/python/api' },
        { name: 'Collections', url: '/guides/ai/python/collections' },
        { name: 'Indexes', url: '/guides/ai/python/indexes' },
        { name: 'Metadata', url: '/guides/ai/python/metadata' },
      ],
    },
    {
      name: 'Python examples',
      items: [
        { name: 'Developing locally with Vecs', url: '/guides/ai/vecs-python-client' },
        { name: 'Manage collections', url: '/guides/ai/quickstarts/hello-world' },
        { name: 'Text deduplication', url: '/guides/ai/quickstarts/text-deduplication' },
        { name: 'Face similarity search', url: '/guides/ai/quickstarts/face-similarity' },
        {
          name: 'OpenAI CLIP image search',
          url: '/guides/ai/examples/image-search-openai-clip',
        },
        {
          name: 'Amazon Titan semantic search',
          url: '/guides/ai/examples/semantic-image-search-amazon-titan',
        },
        {
          name: 'Building ChatGPT plugins',
          url: '/guides/ai/examples/building-chatgpt-plugins',
        },
      ],
    },
    {
      name: 'Third-party tools',
      items: [
        { name: 'LangChain', url: '/guides/ai/langchain' },
        { name: 'Hugging Face', url: '/guides/ai/hugging-face' },
        { name: 'Google Colab', url: '/guides/ai/google-colab' },
        { name: 'LlamaIndex', url: '/guides/ai/integrations/llamaindex' },
        { name: 'Roboflow', url: '/guides/ai/integrations/roboflow' },
        { name: 'Amazon Bedrock', url: '/guides/ai/integrations/amazon-bedrock' },
        { name: 'Fireworks AI', url: '/guides/ai/integrations/fireworks-ai' },
        { name: 'Mixpeek', url: '/guides/ai/examples/mixpeek-video-search' },
      ],
    },
  ],
}
