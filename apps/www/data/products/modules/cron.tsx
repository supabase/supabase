import Link from 'next/link'
import OpenAIImage from '~/components/Products/VectorAI/OpenAIImage'
import SecureAndScalableImg from '~/components/Products/VectorAI/SecureAndScalableImg'
import PGvectorImg from '~/components/Products/VectorAI/PGvectorImg'
import DeployGlobally from '~/components/Products/VectorAI/DeployGlobally'
import IntegrationsImage from '~/components/Products/VectorAI/IntegrationsImage'
import { PRODUCT_MODULES } from 'shared-data/products'
import classNames from 'classnames'

export default (isMobile?: boolean) => ({
  metaTitle: '',
  metaDescription: '',
  heroSection: {
    title: 'Supabase Cron',
    h1: (
      <span key={'vector-h1'} className="heading-gradient">
        Schedule and automate tasks at scale
      </span>
    ),
    subheader: (
      <>
        An open source Vector database for developing AI applications.
        <br className="hidden md:block" /> Use pgvector to store, index, and access embeddings, and
        our AI toolkit to build AI applications with Hugging Face and OpenAI.
      </>
    ),
    // image: '/images/product/vector/vector-hero.svg',
    icon: PRODUCT_MODULES['cron-jobs'].icon[24],
    cta: {
      label: 'Launch a free database',
      link: '/dashboard',
    },
    secondaryCta: {
      label: 'Explore documentation',
      link: '/docs/guides/cron',
    },
  },
  highlightsSection: {
    className: '!py-4',
    highlights: [
      {
        title: 'Postgres + pgvector',
        paragraph:
          'Use pgvector to store, query, and index your vector embeddings at scale in a Postgres instance.',
        // image: PGvectorImg,
      },
      {
        title: 'OpenAI and More',
        paragraph:
          'Easily connect to any LLM or embeddings API, including Hugging Face, SageMaker and more.',
        // image: OpenAIImage,
      },
      {
        title: 'Secure and Scalable',
        paragraph:
          'Supabase is SOC2 Type 2 compliant, and comes with an advanced permissions system.',
        // image: SecureAndScalableImg,
      },
      {
        title: 'Deploy Globally',
        paragraph:
          'Choose from many globally-distributed data centres or self-host on your own cloud.',
        // image: DeployGlobally,
      },
    ],
  },
  integrations: {
    image: IntegrationsImage,
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
