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
        icon: `
          M3 12V15C3 16.6569 6.13401 18 10 18C13.866 18 17 16.6569 17 15V12C17 13.6569 13.866 15 10 15C6.13401 15 3 13.6569 3 12Z
          M3 7V10C3 11.6569 6.13401 13 10 13C13.866 13 17 11.6569 17 10V7C17 8.65685 13.866 10 10 10C6.13401 10 3 8.65685 3 7Z
          M17 5C17 6.65685 13.866 8 10 8C6.13401 8 3 6.65685 3 5C3 3.34315 6.13401 2 10 2C13.866 2 17 3.34315 17 5Z
        `,
        title: 'Semantic Search',
        description: 'Search your own knowledge base by semantic similarity.',
        cta: {
          label: 'View Template',
          link: '#',
        },
      },
      {
        icon: 'M18 10C18 13.866 14.4183 17 10 17C8.50836 17 7.11208 16.6428 5.91677 16.0208L2 17L3.3383 13.8773C2.4928 12.7673 2 11.434 2 10C2 6.13401 5.58172 3 10 3C14.4183 3 18 6.13401 18 10ZM7 9H5V11H7V9ZM15 9H13V11H15V9ZM9 9H11V11H9V9Z',
        title: 'Chatbots',
        description: 'Enhance chatbot memory with content-based long-term retention.',
        cta: {
          label: 'View on Github',
          link: '#',
        },
      },
      {
        icon: `M6 2C4.89543 2 4 2.89543 4 4V9.52779C5.06151 8.57771 6.46329 8 8 8C11.3137 8 14 10.6863 14 14C14 15.5367 13.4223 16.9385 12.4722 18H14C15.1046 18 16 17.1046 16 16V7.41421C16 6.88378 15.7893 6.37507 15.4142 6L12 2.58579C11.6249 2.21071 11.1162 2 10.5858 2H6Z
        
        M4 14C4 11.7909 5.79086 10 8 10C10.2091 10 12 11.7909 12 14C12 16.2091 10.2091 18 8 18C7.25862 18 6.56362 17.7977 5.96818 17.446L4.70711 18.7071C4.31658 19.0976 3.68342 19.0976 3.29289 18.7071C2.90237 18.3166 2.90237 17.6834 3.29289 17.2929L4.55397 16.0318C4.20229 15.4364 4 14.7414 4 14ZM8 12C6.89543 12 6 12.8954 6 14C6 14.5526 6.22276 15.0512 6.58579 15.4142C6.94881 15.7772 7.44744 16 8 16C9.10457 16 10 15.1046 10 14C10 12.8954 9.10457 12 8 12Z
        `,
        title: 'Hybrid search',
        description: 'Combine semantic and full-text search with powerful SQL filtering.',
        cta: {
          label: 'Template coming soon',
          link: '#',
          isDisabled: true,
        },
      },
      {
        icon: `
          M7 3C6.44772 3 6 3.44772 6 4C6 4.55228 6.44772 5 7 5H13C13.5523 5 14 4.55228 14 4C14 3.44772 13.5523 3 13 3H7Z
          M4 7C4 6.44772 4.44772 6 5 6H15C15.5523 6 16 6.44772 16 7C16 7.55228 15.5523 8 15 8H5C4.44772 8 4 7.55228 4 7Z
          M2 11C2 9.89543 2.89543 9 4 9H16C17.1046 9 18 9.89543 18 11V15C18 16.1046 17.1046 17 16 17H4C2.89543 17 2 16.1046 2 15V11Z
        `,
        title: 'Image Similarity',
        description:
          'Transform images into image vector representations to detect similarity patterns.',
        cta: {
          label: 'Template coming soon',
          link: '/docs/examples/ai/image_search/README.md',
        },
      },
      {
        icon: 'M4 7C4 5.34315 5.34315 4 7 4H12C12.2985 4 12.5656 4.12956 12.7503 4.33882C12.764 4.35438 12.7782 4.36952 12.7929 4.38419L19.7671 11.3584C19.9131 11.5326 20 11.755 20 12C20 12.2985 19.8704 12.5656 19.6612 12.7503C19.6456 12.764 19.6305 12.7782 19.6158 12.7929L12.6416 19.7671C12.4674 19.9131 12.245 20 12 20C11.755 20 11.5326 19.9131 11.3584 19.7671L4.36217 12.7709L4.33882 12.7503C4.12956 12.5656 4 12.2985 4 12V7ZM7 6C6.44772 6 6 6.44772 6 7C6 7.55228 6.44772 8 7 8H7.01C7.56228 8 8.01 7.55228 8.01 7C8.01 6.44772 7.56228 6 7.01 6H7Z',
        title: 'Data Management',
        description: 'Automatically tag, deduplicate or detect patterns in your vector store.',
        cta: {
          label: 'Template coming soon',
          link: '#',
          isDisabled: true,
        },
      },
      {
        icon: 'M11 4C11 3.44772 10.5523 3 10 3V3.66667C10 4.74852 9.64911 5.80119 9 6.66667L7.6 8.53333C7.21053 9.05262 7 9.68422 7 10.3333V15.7639C7 16.1427 7.214 16.489 7.55279 16.6584L7.60263 16.6833C8.01919 16.8916 8.47854 17 8.94427 17H14.3604C14.8371 17 15.2475 16.6635 15.341 16.1961L16.541 10.1961C16.6647 9.57732 16.1914 9 15.5604 9H11V4ZM3.5 10C3.22386 10 3 10.2239 3 10.5V16.5C3 16.7761 3.22386 17 3.5 17C3.77614 17 4 16.7761 4 16.5V10.5C4 10.2239 3.77614 10 3.5 10Z',
        title: 'Recommendations',
        description: 'Discover related content: articles, videos, restaurants, and more.',
        cta: {
          label: 'Template coming soon',
          link: '#',
          isDisabled: true,
        },
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
        icon: 'M13.2734 14.5986V12.3134C13.2734 10.5215 11.8208 9.06891 10.029 9.06891M7.54962 10.2285H3.23242V14.2284H6.78453C6.78453 14.2284 6.78453 14.086 6.78453 12.3134C6.78453 10.5408 8.23712 9.06891 10.029 9.06891M10.029 9.06891C11.1336 9.06891 12.029 8.17331 12.029 7.06874C12.029 5.96418 11.1336 5.06874 10.029 5.06874C8.92442 5.06874 8.02899 5.96418 8.02899 7.06874C8.02899 8.17331 8.92442 9.06891 10.029 9.06891ZM8.23255 6.22827H3.23242V2.22827H13.2324V5.62098V6.22827H11.8029M3.73438 6.22803V10.228',
        title: 'Fully managed or Self-Hosted',
        text: 'Start without hassle with our cloud platform, or self-host your own solution to keep everything under control. You choose.',
      },
      {
        icon: 'M1.78109 8.22837H14.6841M2.92576 4.32219C4.42529 5.06052 6.25605 5.49434 8.23233 5.49434C10.2086 5.49434 12.0394 5.06052 13.5389 4.32219M13.5389 12.1596C12.0394 11.4212 10.2086 10.9874 8.23233 10.9874C6.25605 10.9874 4.42529 11.4212 2.92576 12.1596M10.784 8.22837C10.784 11.8182 9.6416 14.7283 8.23233 14.7283C6.82305 14.7283 5.68061 11.8182 5.68061 8.22837C5.68061 4.63857 6.82305 1.72846 8.23233 1.72846C9.6416 1.72846 10.784 4.63857 10.784 8.22837ZM14.7322 8.22818C14.7322 11.818 11.8221 14.7281 8.23233 14.7281C4.64253 14.7281 1.73242 11.818 1.73242 8.22818C1.73242 4.63838 4.64253 1.72827 8.23233 1.72827C11.8221 1.72827 14.7322 4.63838 14.7322 8.22818Z',
        title: 'Global & Multi-Region',
        text: 'Automatically provision and configure a global view of applications across multiple regions to reduce read latency.',
      },
      {
        icon: 'M3.15606 11.1565C2.65805 10.2949 2.37305 9.29477 2.37305 8.22807M5.25082 3.18252C6.12448 2.66499 7.14415 2.36792 8.2332 2.36792M13.3634 5.39345C13.8285 6.23349 14.0933 7.19985 14.0933 8.22807M11.21 13.2769C10.3376 13.7924 9.31994 14.0882 8.2332 14.0882M14.4053 4.06128C14.4053 5.16585 13.5098 6.06128 12.4053 6.06128C11.3007 6.06128 10.4053 5.16585 10.4053 4.06128C10.4053 2.95671 11.3007 2.06128 12.4053 2.06128C13.5098 2.06128 14.4053 2.95671 14.4053 4.06128ZM6.04297 12.3772C6.04297 13.4818 5.14754 14.3772 4.04297 14.3772C2.9384 14.3772 2.04297 13.4818 2.04297 12.3772C2.04297 11.2726 2.9384 10.3772 4.04297 10.3772C5.14754 10.3772 6.04297 11.2726 6.04297 12.3772ZM14.4053 12.3772C14.4053 13.4818 13.5098 14.3772 12.4053 14.3772C11.3007 14.3772 10.4053 13.4818 10.4053 12.3772C10.4053 11.2726 11.3007 10.3772 12.4053 10.3772C13.5098 10.3772 14.4053 11.2726 14.4053 12.3772ZM6.04297 4.06128C6.04297 5.16585 5.14754 6.06128 4.04297 6.06128C2.9384 6.06128 2.04297 5.16585 2.04297 4.06128C2.04297 2.95671 2.9384 2.06128 4.04297 2.06128C5.14754 2.06128 6.04297 2.95671 6.04297 4.06128Z',
        title: 'Integrated',
        text: 'Vector embeddings are in the same database as the rest of your data, which reduces I/O roundtrips and improves performance.',
      },
      {
        icon: 'M4.91487 13.2285C5.86512 13.8602 7.00579 14.2283 8.23242 14.2283C11.5461 14.2283 14.2324 11.542 14.2324 8.22829C14.2324 8.11073 14.229 7.99396 14.2224 7.87807M3.28193 11.6194C2.61985 10.6547 2.23242 9.48673 2.23242 8.22829C2.23242 4.91458 4.91871 2.22829 8.23242 2.22829C8.39255 2.22829 8.5512 2.23457 8.70817 2.24688M9.46665 8.58586L4.3435 13.7088C3.90333 14.149 3.18653 14.1385 2.75937 13.6857C2.34945 13.2512 2.35938 12.5695 2.78179 12.1471L3.2029 11.726C3.3557 11.5732 3.56294 11.4873 3.77903 11.4873C4.16497 11.4873 4.49797 11.2166 4.5767 10.8387L4.59586 10.7467C4.66128 10.4328 4.91553 10.1929 5.23277 10.1458L5.34332 10.1294C5.69603 10.0771 5.94129 9.75114 5.89383 9.39774C5.86677 9.19626 5.93525 8.99369 6.079 8.84994L7.95043 6.97863M11.8738 3.4597C13.4175 4.63864 14.2297 6.42029 14.2324 8.22341M13.0854 4.42519C13.0854 4.97714 12.638 5.42458 12.0861 5.42458C11.5341 5.42458 11.0867 4.97714 11.0867 4.42519C11.0867 3.87325 11.5341 3.4258 12.0861 3.4258C12.638 3.4258 13.0854 3.87325 13.0854 4.42519ZM15.0686 5.16418C15.0686 7.21981 13.4022 8.88623 11.3466 8.88623C9.29095 8.88623 7.62453 7.21981 7.62453 5.16418C7.62453 3.10856 9.29095 1.44214 11.3466 1.44214C13.4022 1.44214 15.0686 3.10856 15.0686 5.16418Z',
        title: 'No vendor lock-in',
        text: 'We use existing standards to increase portability and to avoid lock-in, making it easy to migrate in and out.',
      },
      {
        icon: 'M2.75362 8.76631C2.60188 6.92839 3.22909 5.03824 4.63526 3.63208C7.17366 1.09367 11.2892 1.09367 13.8276 3.63208C16.3661 6.17049 16.3661 10.2861 13.8276 12.8245C11.2892 15.3629 7.17366 15.3629 4.63526 12.8245C4.03586 12.2251 3.57801 11.5377 3.26168 10.804M1.04389 7.55176L2.0514 8.55927C2.44192 8.9498 3.07509 8.9498 3.46561 8.55927L4.47312 7.55176M7.47849 11.4573L10.8952 11.4573C11.4474 11.4573 11.8952 11.0096 11.8952 10.4573L11.8952 10.2973C11.8952 9.74498 11.4474 9.29726 10.8952 9.29726L7.47849 9.29726C6.9262 9.29726 6.47849 9.74498 6.47849 10.2973L6.47849 10.4573C6.47849 11.0096 6.9262 11.4573 7.47849 11.4573ZM7.73694 9.2978L10.6098 9.2978C11.1621 9.2978 11.6098 8.85008 11.6098 8.2978L11.6098 8.13777C11.6098 7.58548 11.1621 7.13777 10.6098 7.13777L7.73694 7.13777C7.18466 7.13777 6.73694 7.58549 6.73694 8.13777L6.73694 8.2978C6.73694 8.85009 7.18466 9.2978 7.73694 9.2978ZM7.47822 7.1379L10.8949 7.1379C11.4472 7.1379 11.8949 6.69019 11.8949 6.1379L11.8949 5.97787C11.8949 5.42559 11.4472 4.97787 10.8949 4.97787L7.47822 4.97787C6.92594 4.97787 6.47822 5.42559 6.47822 5.97787L6.47822 6.1379C6.47822 6.69019 6.92594 7.1379 7.47822 7.1379Z',
        title: 'Automatic Backups',
        text: 'Automatic backups and PITR (Point In Time Recovery) ensure your data is always safe and recoverable.',
      },
      {
        icon: 'M9.23242 7.21593V4.22827C9.23242 3.1237 8.33699 2.22827 7.23242 2.22827H4.23242C3.12785 2.22827 2.23242 3.1237 2.23242 4.22827V7.22827C2.23242 8.33284 3.12785 9.22827 4.23242 9.22827H7.2104M5.61821 5.62404L11.8997 11.9056M12.3322 9.08958V11.1484C12.3322 11.7007 11.8845 12.1484 11.3322 12.1484H9.23242M9.23242 14.2283H12.2324C13.337 14.2283 14.2324 13.3328 14.2324 12.2283V9.22827C14.2324 8.1237 13.337 7.22827 12.2324 7.22827H9.23242C8.12785 7.22827 7.23242 8.1237 7.23242 9.22827V12.2283C7.23242 13.3328 8.12785 14.2283 9.23242 14.2283Z',
        title: 'Highly Scalable',
        text: 'Designed for unparalleled high performance and availability at global scale.',
      },
    ],
  },
}
