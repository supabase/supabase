import Link from 'next/link'
import IntegrationsSVG from '~/components/products/vector/IntegrationsSVG'

export const pageData = {
  metaTitle: '',
  metaDescription: '',
  heroSection: {
    title: 'Supabase Vector',
    h1: (
      <span key={'vector-h1'}>
        The open source Vector Database <br />
        for AI applications
      </span>
    ),
    subheader: (
      <>
        Integrate Supabase Vector database with your favorite ML-models{' '}
        <br className="hidden md:block" />
        to easily store, access and scale vector embeddings for any AI use case.
      </>
    ),
    image: '/images/product/vector/vector-hero.svg',
    cta: {
      label: 'Start for free',
      link: '/docs/guides/ai',
    },
    video: 'asdf',
  },
  highlightsSection: {
    highlights: [
      {
        title: 'PostgreSQL + pgvector',
        paragraph:
          // 'Every Supabase project is a dedicated Postgres instance. Use pgvector to store, query, and index your vector embeddings at scale.',
          'Use pgvector to store, query, and index your vector embeddings at scale in a Postgres instance.',
        image: '',
      },
      {
        title: 'Connect with OpenAI',
        paragraph:
          'Easily connect to any LLM or embeddings API, including Hugging Face, SageMaker and more.',
        image: '',
      },
      {
        title: 'Secure and Scalable',
        paragraph: (
          <>
            Supabase is{' '}
            <Link href="">
              <a className="text-scale-1200 hover:underline">SOC2 type 2</a>
            </Link>{' '}
            compliant, and comes with an advanced permissions system.
          </>
        ),
        image: '',
      },
      {
        title: 'Deploy Globally',
        paragraph:
          'Choose from 12 Fully Managed datacenters, or Self-Host on your own cloud or servers.',
        image: '',
      },
    ],
  },
  integrations: {
    title: 'Leverage the tools you love',
    image: <IntegrationsSVG />,
  },
  useCasesSection: {
    title: (
      <>
        <span className="heading-gradient">What you can build</span>
        <br />
        <span className="heading-gradient">with Supabase Vector</span>
      </>
    ),
    paragraph: 'Go effortlessly from experimentation to production-ready AI applications.',
    useCases: [
      {
        img: '',
        title: 'Semantic Search',
        description: 'Search your own knowledge base by semantic similarity.',
        cta: {
          label: 'View Template',
          link: '#',
        },
      },
      {
        img: '',
        title: 'Chatbots',
        description: 'Enhance chatbot memory with content-based long-term retention.',
        cta: {
          label: 'View on Github',
          link: '#',
        },
      },
      {
        img: '',
        title: 'Hybrid search',
        description: 'Combine semantic and full-text search with powerful SQL filtering.',
      },
      {
        img: '',
        title: 'Image Similarity',
        description:
          'Transform images into image vector representations to detect similarity patterns.',
      },
      {
        img: '',
        title: 'Data Management',
        description: 'Automatically tag, deduplicate or detect patterns in your vector store.',
      },
      {
        img: '',
        title: 'Recommendations',
        description: 'Discover related content: articles, videos, restaurants, and more.',
      },
    ],
  },
  APIsection: {
    title: (
      <>
        <span className="heading-gradient">Simple yet</span>
        <br />
        <span className="text-brand-900">powerful APIs</span>
      </>
    ),
    paragraph:
      'Easy-to-use client libraries for managing and querying vector stores in PostgreSQL.',
    cta: {
      label: 'Explore documentation',
      link: '/docs/guides/ai/vecs-python-client',
    },
    tabs: [
      {
        label: 'Store',
        code: `
docs = vx.create_collection(name="docs", dimension=3)

# add records to the collection
docs.upsert(
  vectors=[
    (
      "vec0",           # the vector's identifier
      [0.1, 0.2, 0.3],  # the vector. list or np.array
      {"year": 1973}    # associated  metadata
    ),
    (
      "vec1",
      [0.7, 0.8, 0.9],
      {"year": 2012}
    )
  ]
)
        `,
      },
      {
        label: 'Index',
        code: `
# index the collection to be queried by cosine distance
docs.create_index(measure=vecs.IndexMeasure.cosine_distance)

# Available options for query measure are:
#
# vecs.IndexMeasure.cosine_distance
# vecs.IndexMeasure.l2_distance
# vecs.IndexMeasure.max_inner_product

# or use the default (cosine_distance)
docs.create_index()
      `,
      },
      {
        label: 'Query',
        code: `
# Query vectors with optional Metadata Filtering
docs.query(
    query_vector=[0.4,0.5,0.6],
    filters={"year": {"$eq": 2012}}, # metadata filters
)
      `,
      },
    ],
  },
  featuresSection: {
    title: (
      <>
        <span className="heading-gradient">Powerful Features</span>
        <br />
        <span className="text-brand-900">Seamless Development</span>
      </>
    ),
    paragraph:
      'Develop, integrate and deploy secure and scalable AI applications at unprecedented speed.',
    cta: {
      label: '',
      url: '',
    },
    features: [
      {
        icon: 'M2.22628 8.76631C2.07453 6.92839 2.70175 5.03824 4.10791 3.63208C6.64632 1.09367 10.7619 1.09367 13.3003 3.63208C15.8387 6.17049 15.8387 10.2861 13.3003 12.8245C10.7619 15.3629 6.64632 15.3629 4.10791 12.8245C3.50852 12.2251 3.05066 11.5377 2.73434 10.804M0.516543 7.55176L2.23116 9.26638L3.94578 7.55176M5.95088 4.97787L11.3675 4.97787L11.3675 7.1379L5.95088 7.1379L5.95088 4.97787ZM6.2096 7.13777L11.0825 7.13777L11.0825 9.2978L6.2096 9.2978L6.2096 7.13777ZM5.95114 9.29726L11.3678 9.29726L11.3678 11.4573H5.95114V9.29726Z',
        title: 'Fully managed or Self-Hosted',
        text: 'Start without hassle with our cloud platform, or self-host your own solution to keep everything under control. You choose.',
      },
      {
        icon: 'M2.22628 8.76631C2.07453 6.92839 2.70175 5.03824 4.10791 3.63208C6.64632 1.09367 10.7619 1.09367 13.3003 3.63208C15.8387 6.17049 15.8387 10.2861 13.3003 12.8245C10.7619 15.3629 6.64632 15.3629 4.10791 12.8245C3.50852 12.2251 3.05066 11.5377 2.73434 10.804M0.516543 7.55176L2.23116 9.26638L3.94578 7.55176M5.95088 4.97787L11.3675 4.97787L11.3675 7.1379L5.95088 7.1379L5.95088 4.97787ZM6.2096 7.13777L11.0825 7.13777L11.0825 9.2978L6.2096 9.2978L6.2096 7.13777ZM5.95114 9.29726L11.3678 9.29726L11.3678 11.4573H5.95114V9.29726Z',
        title: 'Global & Multi-Region',
        text: 'Automatically provision and configure a global view of applications across multiple regions to reduce read latency.',
      },
      {
        icon: 'M2.22628 8.76631C2.07453 6.92839 2.70175 5.03824 4.10791 3.63208C6.64632 1.09367 10.7619 1.09367 13.3003 3.63208C15.8387 6.17049 15.8387 10.2861 13.3003 12.8245C10.7619 15.3629 6.64632 15.3629 4.10791 12.8245C3.50852 12.2251 3.05066 11.5377 2.73434 10.804M0.516543 7.55176L2.23116 9.26638L3.94578 7.55176M5.95088 4.97787L11.3675 4.97787L11.3675 7.1379L5.95088 7.1379L5.95088 4.97787ZM6.2096 7.13777L11.0825 7.13777L11.0825 9.2978L6.2096 9.2978L6.2096 7.13777ZM5.95114 9.29726L11.3678 9.29726L11.3678 11.4573H5.95114V9.29726Z',
        title: 'Integrated',
        text: 'Vector embeddings are in the same database as the rest of your data, which reduces I/O roundtrips and improves performance.',
      },
      {
        icon: 'M2.22628 8.76631C2.07453 6.92839 2.70175 5.03824 4.10791 3.63208C6.64632 1.09367 10.7619 1.09367 13.3003 3.63208C15.8387 6.17049 15.8387 10.2861 13.3003 12.8245C10.7619 15.3629 6.64632 15.3629 4.10791 12.8245C3.50852 12.2251 3.05066 11.5377 2.73434 10.804M0.516543 7.55176L2.23116 9.26638L3.94578 7.55176M5.95088 4.97787L11.3675 4.97787L11.3675 7.1379L5.95088 7.1379L5.95088 4.97787ZM6.2096 7.13777L11.0825 7.13777L11.0825 9.2978L6.2096 9.2978L6.2096 7.13777ZM5.95114 9.29726L11.3678 9.29726L11.3678 11.4573H5.95114V9.29726Z',
        title: 'No vendor lock-in',
        text: 'We use existing standards to increase portability and to avoid lock-in, making it easy to migrate in and out.',
      },
      {
        icon: 'M2.22628 8.76631C2.07453 6.92839 2.70175 5.03824 4.10791 3.63208C6.64632 1.09367 10.7619 1.09367 13.3003 3.63208C15.8387 6.17049 15.8387 10.2861 13.3003 12.8245C10.7619 15.3629 6.64632 15.3629 4.10791 12.8245C3.50852 12.2251 3.05066 11.5377 2.73434 10.804M0.516543 7.55176L2.23116 9.26638L3.94578 7.55176M5.95088 4.97787L11.3675 4.97787L11.3675 7.1379L5.95088 7.1379L5.95088 4.97787ZM6.2096 7.13777L11.0825 7.13777L11.0825 9.2978L6.2096 9.2978L6.2096 7.13777ZM5.95114 9.29726L11.3678 9.29726L11.3678 11.4573H5.95114V9.29726Z',
        title: 'Automatic Backups',
        text: 'Automatic backups and PITR (Point In Time Recovery) ensure your data is always safe and recoverable.',
      },
      {
        icon: 'M2.22628 8.76631C2.07453 6.92839 2.70175 5.03824 4.10791 3.63208C6.64632 1.09367 10.7619 1.09367 13.3003 3.63208C15.8387 6.17049 15.8387 10.2861 13.3003 12.8245C10.7619 15.3629 6.64632 15.3629 4.10791 12.8245C3.50852 12.2251 3.05066 11.5377 2.73434 10.804M0.516543 7.55176L2.23116 9.26638L3.94578 7.55176M5.95088 4.97787L11.3675 4.97787L11.3675 7.1379L5.95088 7.1379L5.95088 4.97787ZM6.2096 7.13777L11.0825 7.13777L11.0825 9.2978L6.2096 9.2978L6.2096 7.13777ZM5.95114 9.29726L11.3678 9.29726L11.3678 11.4573H5.95114V9.29726Z',
        title: 'Highly Scalable',
        text: 'Designed for unparalleled high performance and availability at global scale.',
      },
    ],
  },
}
