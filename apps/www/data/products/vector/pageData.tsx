import Link from 'next/link'
import OpenAIImage from '~/components/Products/VectorAI/OpenAIImage'
import SecureAndScalableImg from '~/components/Products/VectorAI/SecureAndScalableImg'
import PGvectorImg from '~/components/Products/VectorAI/PGvectorImg'
import DeployGlobally from '~/components/Products/VectorAI/DeployGlobally'
import IntegrationsImage from '~/components/Products/VectorAI/IntegrationsImage'

export default (isMobile?: boolean) => ({
  metaTitle: '',
  metaDescription: '',
  heroSection: {
    announcement: {
      url: 'https://youtu.be/qw4PrtyvJI0?t=10584',
      badge: 'AI Engineer Summit',
      announcement: "Watch our CEO's talk",
      target: '_blank',
      hasArrow: !isMobile,
    },
    title: 'Supabase Vector',
    h1: (
      <span key={'vector-h1'} className="heading-gradient">
        The Postgres Vector database <br className="hidden md:block" />
        and AI Toolkit
      </span>
    ),
    subheader: (
      <>
        An open source Vector database for developing AI applications.
        <br className="hidden md:block" /> Use pgvector to store, index, and access embeddings, and
        our AI toolkit to build AI applications with Hugging Face and OpenAI.
      </>
    ),
    image: '/images/product/vector/vector-hero.svg',
    cta: {
      label: 'Launch a free database',
      link: '/dashboard',
    },
    secondaryCta: {
      label: 'Explore documentation',
      link: '/docs/guides/ai',
    },
  },
  highlightsSection: {
    highlights: [
      {
        title: 'Postgres + pgvector',
        paragraph:
          'Use pgvector to store, query, and index your vector embeddings at scale in a Postgres instance.',
        image: PGvectorImg,
      },
      {
        title: 'OpenAI and More',
        paragraph:
          'Easily connect to any LLM or embeddings API, including Hugging Face, SageMaker and more.',
        image: OpenAIImage,
      },
      {
        title: 'Secure and Scalable',
        paragraph:
          'Supabase is SOC2 Type 2 compliant, and comes with an advanced permissions system.',
        image: SecureAndScalableImg,
      },
      {
        title: 'Deploy Globally',
        paragraph:
          'Choose from many globally-distributed data centres or self-host on your own cloud.',
        image: DeployGlobally,
      },
    ],
  },
  integrations: {
    title: 'Leverage the tools you love',
    image: IntegrationsImage,
  },
  useCasesSection: {
    title: (
      <>
        <span className="heading-gradient">What you can build</span>
        <br />
        <span className="heading-gradient">with Supabase Vector?</span>
      </>
    ),
    paragraph: 'Scale effortlessly from experimentation to production-ready AI applications.',
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
          label: 'View example',
          link: '/docs/guides/ai/examples/headless-vector-search',
        },
      },
      {
        icon: 'M18 10C18 13.866 14.4183 17 10 17C8.50836 17 7.11208 16.6428 5.91677 16.0208L2 17L3.3383 13.8773C2.4928 12.7673 2 11.434 2 10C2 6.13401 5.58172 3 10 3C14.4183 3 18 6.13401 18 10ZM7 9H5V11H7V9ZM15 9H13V11H15V9ZM9 9H11V11H9V9Z',
        title: 'ChatGPT Plugins',
        description: 'Enhance chatbot memory with content-based long-term retention.',
        cta: {
          label: 'View example',
          link: '/docs/guides/ai/examples/building-chatgpt-plugins',
        },
      },
      {
        icon: `M6 2C4.89543 2 4 2.89543 4 4V9.52779C5.06151 8.57771 6.46329 8 8 8C11.3137 8 14 10.6863 14 14C14 15.5367 13.4223 16.9385 12.4722 18H14C15.1046 18 16 17.1046 16 16V7.41421C16 6.88378 15.7893 6.37507 15.4142 6L12 2.58579C11.6249 2.21071 11.1162 2 10.5858 2H6Z

        M4 14C4 11.7909 5.79086 10 8 10C10.2091 10 12 11.7909 12 14C12 16.2091 10.2091 18 8 18C7.25862 18 6.56362 17.7977 5.96818 17.446L4.70711 18.7071C4.31658 19.0976 3.68342 19.0976 3.29289 18.7071C2.90237 18.3166 2.90237 17.6834 3.29289 17.2929L4.55397 16.0318C4.20229 15.4364 4 14.7414 4 14ZM8 12C6.89543 12 6 12.8954 6 14C6 14.5526 6.22276 15.0512 6.58579 15.4142C6.94881 15.7772 7.44744 16 8 16C9.10457 16 10 15.1046 10 14C10 12.8954 9.10457 12 8 12Z
        `,
        title: 'OpenAI completions',
        description: 'Generate GPT text completions using OpenAI in Edge Functions.',
        cta: {
          label: 'View example',
          link: '/docs/guides/ai/examples/openai',
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
          label: 'Open in Colab',
          link: 'https://colab.research.google.com/github/supabase/supabase/blob/master/examples/ai/face_similarity.ipynb',
        },
      },
      {
        icon: 'M4 7C4 5.34315 5.34315 4 7 4H12C12.2985 4 12.5656 4.12956 12.7503 4.33882C12.764 4.35438 12.7782 4.36952 12.7929 4.38419L19.7671 11.3584C19.9131 11.5326 20 11.755 20 12C20 12.2985 19.8704 12.5656 19.6612 12.7503C19.6456 12.764 19.6305 12.7782 19.6158 12.7929L12.6416 19.7671C12.4674 19.9131 12.245 20 12 20C11.755 20 11.5326 19.9131 11.3584 19.7671L4.36217 12.7709L4.33882 12.7503C4.12956 12.5656 4 12.2985 4 12V7ZM7 6C6.44772 6 6 6.44772 6 7C6 7.55228 6.44772 8 7 8H7.01C7.56228 8 8.01 7.55228 8.01 7C8.01 6.44772 7.56228 6 7.01 6H7Z',
        title: 'Data Management',
        description: 'Automatically tag, deduplicate or detect patterns in your vector store.',
        cta: {
          label: 'Open in Colab',
          link: 'https://colab.research.google.com/github/supabase/supabase/blob/master/examples/ai/semantic_text_deduplication.ipynb',
        },
      },
      {
        icon: 'M11 4C11 3.44772 10.5523 3 10 3V3.66667C10 4.74852 9.64911 5.80119 9 6.66667L7.6 8.53333C7.21053 9.05262 7 9.68422 7 10.3333V15.7639C7 16.1427 7.214 16.489 7.55279 16.6584L7.60263 16.6833C8.01919 16.8916 8.47854 17 8.94427 17H14.3604C14.8371 17 15.2475 16.6635 15.341 16.1961L16.541 10.1961C16.6647 9.57732 16.1914 9 15.5604 9H11V4ZM3.5 10C3.22386 10 3 10.2239 3 10.5V16.5C3 16.7761 3.22386 17 3.5 17C3.77614 17 4 16.7761 4 16.5V10.5C4 10.2239 3.77614 10 3.5 10Z',
        title: 'Next.js Vector Search',
        description: 'Learn how to build ChatGPT-style doc search powered by Next.js and OpenAI.',
        cta: {
          label: 'View example',
          link: '/docs/guides/ai/examples/nextjs-vector-search',
        },
      },
    ],
  },
  APIsection: {
    title: (
      <>
        <span className="heading-gradient">Simple yet</span>
        <br />
        <span className="text-brand">powerful APIs</span>
      </>
    ),
    paragraph: 'Easy-to-use client libraries for managing and querying vector stores in Postgres.',
    cta: {
      label: 'Explore documentation',
      link: '/docs/guides/ai/vecs-python-client',
    },
    tabs: [
      {
        label: 'Store',
        paragraph: 'Efficiently upsert millions of vectors with important metadata.',
        colabUrl:
          'https://colab.research.google.com/github/supabase/supabase/blob/master/examples/ai/vector_hello_world.ipynb',
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
        paragraph:
          'Build indexes using Cosine distance, L2-Norm distance, or Max Inner Product for fast and efficient querying.',
        colabUrl:
          'https://colab.research.google.com/github/supabase/supabase/blob/master/examples/ai/vector_hello_world.ipynb',
        code: `
# get an existing collection
docs = vx.get_collection(name="docs")

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
        paragraph: 'Efficient querying and filtering of results based on vector metadata.',
        colabUrl:
          'https://colab.research.google.com/github/supabase/supabase/blob/master/examples/ai/vector_hello_world.ipynb',
        code: `
# get an existing collection
docs = vx.get_collection(name="docs")

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
        <span className="text-brand">Scale to millions</span>
      </>
    ),
    paragraph:
      'Develop, integrate, and deploy secure and enterprise-grade AI applications at unprecedented speed.',
    cta: {
      label: 'Explore documentation',
      link: '/docs/guides/ai',
    },
    features: [
      {
        icon: 'M19.7939 21.2285V18.3559C19.7939 15.6682 17.6151 13.4892 14.9273 13.4892M11.2082 15.2286H6.23242C5.40399 15.2286 4.73242 15.9002 4.73242 16.7286V19.7285C4.73242 20.5569 5.40399 21.2285 6.23242 21.2285H10.0606C10.0606 21.2285 10.0606 21.0148 10.0606 18.3559C10.0606 15.697 12.2395 13.4892 14.9273 13.4892M14.9273 13.4892C16.5841 13.4892 17.9273 12.1458 17.9273 10.489C17.9273 8.83213 16.5841 7.48898 14.9273 7.48898C13.2704 7.48898 11.9273 8.83213 11.9273 10.489C11.9273 12.1458 13.2704 13.4892 14.9273 13.4892ZM12.2042 9.22827H6.23242C5.404 9.22827 4.73242 8.5567 4.73242 7.72827V4.72827C4.73242 3.89984 5.40399 3.22827 6.23242 3.22827H18.2324C19.0608 3.22827 19.7324 3.89984 19.7324 4.72827V7.72827C19.7324 8.5567 19.0609 9.22827 18.2324 9.22827H17.6503M6.08311 9.22791V15.2279',
        title: 'Fully managed or Self-Hosted',
        text: 'Start with our hassle-free cloud platform, or self-host to keep everything within your infrastructure. You choose.',
      },
      {
        icon: 'M12.2323 21.9783C14.3462 21.9783 16.0599 17.6131 16.0599 12.2284C16.0599 6.84372 14.3462 2.47856 12.2323 2.47856M12.2323 21.9783C10.1184 21.9783 8.4047 17.6131 8.4047 12.2284C8.4047 6.84372 10.1184 2.47856 12.2323 2.47856M12.2323 21.9783C15.432 21.9783 18.2717 20.4366 20.0495 18.0559M12.2323 21.9783C9.03252 21.9783 6.19277 20.4368 4.41505 18.0559M12.2323 2.47856C15.432 2.47856 18.2717 4.01981 20.0495 6.40045C20.0564 6.40977 20.0634 6.41911 20.0703 6.42846M12.2323 2.47856C9.02002 2.47856 6.1706 4.03191 4.39427 6.42846M2.55542 12.2284H21.9099M20.0495 18.0559C21.2634 16.4302 21.9821 14.4131 21.9821 12.2281C21.9821 10.0557 21.2716 8.04924 20.0703 6.42846M20.0495 18.0559C17.8271 16.9906 15.1343 16.367 12.2323 16.367C9.33023 16.367 6.63737 16.9906 4.41505 18.0559M20.0703 6.42846C17.844 7.49984 15.1434 8.12738 12.2323 8.12738C9.32118 8.12738 6.62057 7.49984 4.39427 6.42846M4.39427 6.42846C3.19294 8.04924 2.48242 10.0557 2.48242 12.2281C2.48242 14.4131 3.20114 16.4302 4.41505 18.0559',
        title: 'Global & Multi-Region',
        text: 'Automatically provision and configure a fleet of applications across multiple regions to reduce read latency.',
      },
      {
        icon: 'M3.44434 12.228C3.44434 13.5631 3.74202 14.8288 4.27463 15.9622M12.2346 3.43774C10.8739 3.43774 9.58552 3.74688 8.43571 4.29875M21.0248 12.228C21.0248 10.8794 20.7211 9.60178 20.1784 8.45974M12.2346 21.0182C13.5925 21.0182 14.8785 20.7103 16.0266 20.1605M16.0266 20.1605C16.5683 20.9408 17.4708 21.4517 18.4927 21.4517C20.1495 21.4517 21.4927 20.1085 21.4927 18.4517C21.4927 16.7948 20.1495 15.4517 18.4927 15.4517C16.8358 15.4517 15.4927 16.7948 15.4927 18.4517C15.4927 19.0867 15.69 19.6756 16.0266 20.1605ZM4.27463 15.9622C3.47509 16.501 2.94922 17.4149 2.94922 18.4517C2.94922 20.1085 4.29236 21.4517 5.94922 21.4517C7.60607 21.4517 8.94922 20.1085 8.94922 18.4517C8.94922 16.7948 7.60607 15.4517 5.94922 15.4517C5.32908 15.4517 4.7529 15.6398 4.27463 15.9622ZM8.43571 4.29875C7.89644 3.5017 6.98401 2.97778 5.94922 2.97778C4.29236 2.97778 2.94922 4.32093 2.94922 5.97778C2.94922 7.63464 4.29236 8.97778 5.94922 8.97778C7.60607 8.97778 8.94922 7.63464 8.94922 5.97778C8.94922 5.35572 8.75989 4.77789 8.43571 4.29875ZM20.1784 8.45974C20.9717 7.9199 21.4927 7.00968 21.4927 5.97778C21.4927 4.32093 20.1495 2.97778 18.4927 2.97778C16.8358 2.97778 15.4927 4.32093 15.4927 5.97778C15.4927 7.63464 16.8358 8.97778 18.4927 8.97778C19.1176 8.97778 19.698 8.78669 20.1784 8.45974Z',
        title: 'Integrated',
        text: 'Store vector embeddings in the same database as your transactional data, simplifying your applications and improving performance.',
      },
      {
        icon: 'M7.25609 19.7285C8.68148 20.6762 10.3925 21.2283 12.2324 21.2283C17.203 21.2283 21.2324 17.1989 21.2324 12.2283C21.2324 12.052 21.2273 11.8768 21.2173 11.703M4.80668 17.3149C3.81356 15.8679 3.23242 14.116 3.23242 12.2283C3.23242 7.25774 7.26186 3.2283 12.2324 3.2283C12.4726 3.2283 12.7106 3.23771 12.946 3.25618M14.0838 12.7647L6.39903 20.4491C5.73878 21.1093 4.66359 21.0936 4.02285 20.4144C3.40796 19.7626 3.42286 18.74 4.05648 18.1064L4.68813 17.4748C4.91734 17.2456 5.2282 17.1169 5.55234 17.1169C6.13125 17.1169 6.63075 16.7107 6.74883 16.144L6.77758 16.006C6.8757 15.535 7.25708 15.1752 7.73294 15.1046L7.89876 15.08C8.42784 15.0015 8.79572 14.5126 8.72453 13.9825C8.68395 13.6803 8.78666 13.3764 9.00228 13.1608L11.8094 10.3538M21.2325 12.221C21.232 11.8884 21.2131 11.5563 21.1761 11.2264M21.1761 11.2264C21.9939 10.2552 22.4867 9.00121 22.4867 7.63214C22.4867 4.5487 19.9871 2.04907 16.9037 2.04907C13.8202 2.04907 11.3206 4.5487 11.3206 7.63214C11.3206 10.7156 13.8202 13.2152 16.9037 13.2152C17.32 13.2152 17.7257 13.1696 18.1161 13.0832M21.1761 11.2264C20.9596 9.29629 20.1226 7.43832 18.7084 5.97684M19.512 6.52365C19.512 7.35157 18.8408 8.02274 18.0129 8.02274C17.185 8.02274 16.5138 7.35157 16.5138 6.52365C16.5138 5.69573 17.185 5.02457 18.0129 5.02457C18.8408 5.02457 19.512 5.69573 19.512 6.52365Z',
        title: 'No Vendor Lock-In',
        text: 'Supabase uses open source tools to increase portability and avoid lock-in, making it easy to migrate in and out.',
      },
      {
        icon: 'M3.51324 13.0353C3.28563 10.2785 4.22645 7.44323 6.3357 5.33398C10.1433 1.52637 16.3167 1.52637 20.1243 5.33398C23.9319 9.14159 23.9319 15.315 20.1243 19.1226C16.3167 22.9302 10.1433 22.9302 6.3357 19.1226C5.43661 18.2235 4.74982 17.1925 4.27533 16.0919M0.948642 11.2135L2.45991 12.7248C3.0457 13.3106 3.99544 13.3106 4.58123 12.7248L6.0925 11.2135M10.6005 17.0718H15.7255C16.554 17.0718 17.2255 16.4002 17.2255 15.5718L17.2255 15.3318C17.2255 14.5033 16.554 13.8318 15.7255 13.8318L10.6005 13.8318C9.77212 13.8318 9.10055 14.5033 9.10055 15.3318L9.10055 15.5718C9.10055 16.4002 9.77212 17.0718 10.6005 17.0718ZM10.9882 13.8326L15.2976 13.8326C16.126 13.8326 16.7976 13.161 16.7976 12.3326L16.7976 12.0925C16.7976 11.2641 16.126 10.5925 15.2976 10.5925H10.9882C10.1598 10.5925 9.48823 11.2641 9.48823 12.0925L9.48823 12.3326C9.48823 13.161 10.1598 13.8326 10.9882 13.8326ZM10.6001 10.5927H15.7251C16.5536 10.5927 17.2251 9.92115 17.2251 9.09272L17.2251 8.85267C17.2251 8.02424 16.5536 7.35267 15.7251 7.35267L10.6001 7.35267C9.77172 7.35267 9.10015 8.02424 9.10015 8.85267L9.10015 9.09272C9.10015 9.92115 9.77172 10.5927 10.6001 10.5927Z',
        title: 'Automatic Backups',
        text: "Protect your data using automatic backups with Point In Time Recovery to ensure it's always safe and recoverable.",
      },
      {
        icon: 'M13.7324 10.7098V6.22827C13.7324 4.57142 12.3893 3.22827 10.7324 3.22827H6.23242C4.57557 3.22827 3.23242 4.57142 3.23242 6.22827V10.7283C3.23242 12.3851 4.57557 13.7283 6.23242 13.7283H10.6994M8.3111 8.32193L17.7334 17.7442M18.3821 13.5202V16.6084C18.3821 17.4369 17.7106 18.1084 16.8821 18.1084H13.7324M13.7324 21.2283H18.2324C19.8893 21.2283 21.2324 19.8851 21.2324 18.2283V13.7283C21.2324 12.0714 19.8893 10.7283 18.2324 10.7283H13.7324C12.0756 10.7283 10.7324 12.0714 10.7324 13.7283V18.2283C10.7324 19.8851 12.0756 21.2283 13.7324 21.2283Z',
        title: 'Highly Scalable',
        text: 'Designed for unparalleled high performance and availability at global scale.',
      },
    ],
  },
  quotesSection: {
    title: (
      <>
        Customers building on <br className="hidden md:block" />
        Supabase Vector
      </>
    ),
    customers: [
      {
        type: 'customer-story',
        avatar: '',
        customer: 'mozilla',
        author: 'Hermina Condei',
        role: 'Director at MDN, Mozilla',
        target: '_blank',
        quote:
          'We store embeddings in a PostgreSQL database, hosted by Supabase, to perform a similarity search to identify the most relevant sections within the MDN.',
        image: '/images/customers/logos/mozilla.png',
        abstract:
          'MDN introduces an AI assistant powered by Supabase Vector to answer all web development questions in real time.',
        url: 'https://developer.mozilla.org/en-US/blog/introducing-ai-help/',
      },
      {
        type: 'customer-story',
        avatar: '',
        customer: 'quivr',
        author: 'Stan Girard',
        role: 'Founder of Quivr',
        quote:
          'Supabase Vector powered by pgvector allowed us to create a simple and efficient product. We are storing over 1.6 million embeddings and the performance and results are great. Open source develop can easily contribute thanks to the SQL syntax known by millions of developers.',
        image: '/images/customers/logos/quivr.png',
        abstract: 'Quivr launch 5,000 Vector databases on Supabase.',
        url: '/customers/quivr',
      },
      {
        type: 'customer-story',
        avatar: '',
        customer: 'mendableai',
        author: 'Caleb Peffer',
        role: 'CEO at Mendable',
        quote:
          'We tried other vector databases - we tried Faiss, we tried Weaviate, we tried Pinecone. If you’re just doing vector search they’re great, but if you need to store a bunch of metadata that becomes a huge pain.',
        image: '/images/customers/logos/mendableai.png',
        abstract: 'Mendable switches from Pinecone to Supabase for PostgreSQL vector embeddings.',
        url: '/customers/mendableai',
      },
    ],
  },
})
