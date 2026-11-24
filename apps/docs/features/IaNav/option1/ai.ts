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
        { name: 'Choosing Compute Add-on', url: '/guides/ai/choosing-compute-addon' },
        { name: 'Going to Production', url: '/guides/ai/going-to-prod' },
        { name: 'RAG with Permissions', url: '/guides/ai/rag-with-permissions' },
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
      name: 'JavaScript Examples',
      items: [
        { name: 'OpenAI completions', url: '/guides/ai/examples/openai' },
        {
          name: 'Image captions with Hugging Face',
          url: '/guides/ai/examples/huggingface-image-captioning',
        },
        {
          name: 'Generate Embeddings',
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
      name: 'Python Client',
      items: [
        { name: 'Choosing a Client', url: '/guides/ai/python-clients' },
        { name: 'API', url: '/guides/ai/python/api' },
        { name: 'Collections', url: '/guides/ai/python/collections' },
        { name: 'Indexes', url: '/guides/ai/python/indexes' },
        { name: 'Metadata', url: '/guides/ai/python/metadata' },
      ],
    },
    {
      name: 'Python Examples',
      items: [
        { name: 'Developing locally with Vecs', url: '/guides/ai/vecs-python-client' },
        { name: 'Creating and managing collections', url: '/guides/ai/quickstarts/hello-world' },
        { name: 'Text Deduplication', url: '/guides/ai/quickstarts/text-deduplication' },
        { name: 'Face similarity search', url: '/guides/ai/quickstarts/face-similarity' },
        {
          name: 'Image search with OpenAI CLIP',
          url: '/guides/ai/examples/image-search-openai-clip',
        },
        {
          name: 'Semantic search with Amazon Titan',
          url: '/guides/ai/examples/semantic-image-search-amazon-titan',
        },
        {
          name: 'Building ChatGPT Plugins',
          url: '/guides/ai/examples/building-chatgpt-plugins',
        },
      ],
    },
    {
      name: 'Third-Party Tools',
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
