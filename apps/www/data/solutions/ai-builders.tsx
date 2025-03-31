import {
  Activity,
  ArrowLeftRight,
  ClipboardCheck,
  Clock,
  DollarSign,
  FolderLock,
  Globe2,
  LayoutList,
  Lightbulb,
  LineChart,
  Lock,
  Scale,
  ShieldAlert,
  ShieldCheck,
  Timer,
  TimerIcon,
  Users,
  UserX,
  Watch,
} from 'lucide-react'
import RequestADemoForm from '../../components/Forms/RequestADemoForm'
import { CubeIcon } from '@heroicons/react/outline'

export default {
  metadata: {
    metaTitle: 'Supabase for AI Builders',
    metaDescription:
      'Leading enterprises use Supabase to build faster, better, and more scalable products.',
  },
  heroSection: {
    id: 'hero',
    title: 'AI Builders',
    h1: <>Supabase for AI Builders</>,
    subheader: [
      <>
        Supabase is the Postgres development platform that powers a new generation of developer
        tools. Give your users an integrated, scalable backend that lets them focus on building
        without worrying about infrastructure.
      </>,
    ],
    // image: <RequestADemoForm />,
    logos: [
      {
        name: 'GitHub',
        image: '/images/enterprise/github.svg',
      },
      {
        name: 'PwC',
        image: '/images/enterprise/pwc.svg',
      },
    ],
  },
  'use-cases': {
    id: 'use-cases',
    // label: <>Build with Supabase</>,
    // heading: <>Stay on the forefront</>,
    stories: [
      {
        // icon: '/images/customers/logos/light/mozilla.png',
        url: 'https://developer.mozilla.org/en-US/blog/introducing-ai-help/',
        target: '_blank',
        // heading: 'Mozilla use Supabase for GenAI and RAG',
        subheading: (
          <>
            We chose Supabase to supercharge the ability of Lovable.{' '}
            <span className="text-foreground">
              {' '}
              It has almost everything you want from your backend and database.
            </span>{' '}
            And this is where our growth took off even more.
          </>
        ),
      },
      {
        // icon: '/images/customers/logos/light/mozilla.png',
        url: 'https://developer.mozilla.org/en-US/blog/introducing-ai-help/',
        target: '_blank',
        // heading: 'Mozilla use Supabase for GenAI and RAG',
        subheading: (
          <>
            We chose Supabase to supercharge the ability of Lovable.{' '}
            <span className="text-foreground">
              {' '}
              It has almost everything you want from your backend and database.
            </span>{' '}
            And this is where our growth took off even more.
          </>
        ),
      },
      {
        // icon: '/images/customers/logos/light/mozilla.png',
        url: 'https://developer.mozilla.org/en-US/blog/introducing-ai-help/',
        target: '_blank',
        // heading: 'Mozilla use Supabase for GenAI and RAG',
        subheading: (
          <>
            We chose Supabase to supercharge the ability of Lovable.{' '}
            <span className="text-foreground">
              {' '}
              It has almost everything you want from your backend and database.
            </span>{' '}
            And this is where our growth took off even more.
          </>
        ),
      },
    ],
    // highlights: [],
  },
  performance: {
    id: 'performance',
    heading: (
      <>
        Top performance,
        <br /> at any scale
      </>
    ),
    subheading:
      "Supabase ensures optimal database performance at any scale, so you can focus on innovating and growing without worrying about infrastructure limitations—whether you're handling high-traffic applications, complex queries, or massive data volumes.",
    highlights: [
      {
        heading: 'Databases managed',
        subheading: '1,000,000+',
      },
      {
        heading: 'Databases launched daily',
        subheading: '3,500+',
      },
    ],
  },
  security: {
    id: 'security',
    label: 'Security',
    heading: <>Trusted for medical records, missions to the moon, and everything in between</>,
    subheading:
      'Keep your data secure with SOC 2, HIPAA, and GDPR compliance. Your customers’ data is encrypted at rest and in transit, with built-in tools for monitoring and managing security threats.',
    cta: {
      label: 'Learn more about Security',
      url: '/security',
    },
    features: [
      {
        icon: ShieldCheck,
        heading: 'SOC 2 Type II certified',
      },
      {
        icon: Activity,
        heading: 'HIPAA compliant',
      },
      {
        icon: ShieldAlert,
        heading: 'DDoS Protection',
      },
      {
        icon: Lock,
        heading: 'Multi-factor Authentication',
      },
      {
        icon: ClipboardCheck,
        heading: 'Vulnerability Management',
      },
      {
        icon: Users,
        heading: 'Role-based access control',
      },
      {
        icon: LayoutList,
        heading: 'Database Audit Logs',
      },
      {
        icon: Lightbulb,
        heading: 'Security Advisors',
      },
      {
        icon: FolderLock,
        heading: 'Encrypted Storage',
      },
      {
        icon: UserX,
        heading: 'Network restrictions',
      },
    ],
  },
  support: {
    id: 'support',
    label: '',
    heading: (
      <>
        Why <span className="text-foreground">AI Builders</span> choose Supabase
      </>
    ),
    features: [
      {
        icon: TimerIcon,
        heading: 'Get to market faster',
        subheading:
          'Supabase is easy to use and set up. Use your existing Postgres knowledge and skills. Build with your favorite frameworks and tools.',
      },
      {
        icon: CubeIcon,
        heading: 'The tools you need at a great price',
        subheading:
          'Supabase offers a fully integrated suite of tools including authentication, storage, edge functions, real-time subscriptions, and vector search. Use one or all.',
      },
      {
        icon: () => (
          <svg
            width="23"
            height="23"
            viewBox="0 0 34 32"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M3.43881 3.75378C4.10721 1.93324 5.84055 0.723145 7.77992 0.723145H15.6033V0.734736H17.0394C23.8756 0.734736 29.4173 6.27652 29.4173 13.1127V20.1749C29.4173 20.7272 28.9696 21.1749 28.4173 21.1749C27.8651 21.1749 27.4173 20.7272 27.4173 20.1749V13.1127C27.4173 7.38109 22.771 2.73474 17.0394 2.73474H15.4396C15.3877 2.73474 15.3366 2.73078 15.2868 2.72314H7.77992C6.6793 2.72314 5.6956 3.40989 5.31627 4.44308L2.7812 11.3479C2.37375 12.4577 2.69516 13.7038 3.58855 14.4781L5.32807 15.9856C6.12772 16.6786 6.58711 17.6847 6.58709 18.7428L6.58706 21.5134C6.58702 23.8192 8.45627 25.6885 10.7621 25.6885C11.4007 25.6885 11.9184 25.1708 11.9184 24.5322L11.9185 12.1874C11.9185 9.59233 12.955 7.10481 14.7977 5.27761C15.1899 4.88873 15.823 4.8914 16.2119 5.28357C16.6008 5.67574 16.5981 6.3089 16.2059 6.69777C14.742 8.14943 13.9185 10.1257 13.9185 12.1874L13.9184 24.5323C13.9184 26.2754 12.5053 27.6885 10.7621 27.6885C7.35169 27.6885 4.58701 24.9238 4.58706 21.5134L4.58709 18.7428C4.5871 18.2647 4.37953 17.8101 4.01822 17.497L2.27871 15.9894C0.757203 14.6708 0.209829 12.5486 0.90374 10.6586L3.43881 3.75378ZM16.539 18.5225C17.0348 18.2791 17.634 18.4838 17.8773 18.9796C19.1969 21.6686 21.9313 23.3727 24.9267 23.3726L32.8043 23.3726C33.3566 23.3725 33.8043 23.8203 33.8043 24.3725C33.8044 24.9248 33.3566 25.3725 32.8044 25.3726L29.4081 25.3726C29.4142 25.4172 29.4173 25.4628 29.4173 25.5091C29.4173 29.0627 26.1868 31.4165 22.6091 31.4165C19.2966 31.4165 16.5385 29.0518 15.9271 25.9188C15.8213 25.3767 16.175 24.8516 16.717 24.7458C17.2591 24.64 17.7843 24.9936 17.89 25.5357C18.3217 27.7475 20.2716 29.4165 22.6091 29.4165C25.447 29.4165 27.4173 27.6256 27.4173 25.5091C27.4173 25.4628 27.4205 25.4172 27.4266 25.3726L24.9267 25.3726C21.1684 25.3727 17.7375 23.2346 16.0818 19.8607C15.8385 19.3649 16.0432 18.7658 16.539 18.5225Z"
              fill="hsl(var(--foreground-light))"
            />
            <path
              d="M21.7224 13.0006C21.7224 13.6338 22.2358 14.1472 22.869 14.1472C23.5022 14.1472 24.0156 13.6338 24.0156 13.0006C24.0156 12.3674 23.5022 11.854 22.869 11.854C22.2358 11.854 21.7224 12.3674 21.7224 13.0006Z"
              fill="hsl(var(--foreground-light))"
            />
          </svg>
        ),
        heading: 'Scalable and dependable',
        subheading:
          'Supabase is Postgres, with all the performance, high availability, and flexibility your users need to grow.',
      },
    ],
  },
  quote: {
    id: 'quote',
    quote: {
      text: 'Supabase powers prototyping for fast-moving teams such as GitHub Next.',
      author: 'Idan Gazit',
      logo: (
        <svg
          width="91"
          height="24"
          viewBox="0 0 91 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            d="M10.4878 10.2692C10.2941 10.2692 10.1376 10.4244 10.1376 10.6166V14.263C10.1376 14.4552 10.2941 14.6129 10.4878 14.6129H13.4204V19.1438C13.4204 19.1438 12.7624 19.3656 10.9422 19.3656C8.79419 19.3656 5.79445 18.587 5.79445 12.0431C5.79445 5.49923 8.91835 4.6369 11.851 4.6369C14.3889 4.6369 15.484 5.08038 16.1793 5.29474C16.3978 5.36126 16.599 5.14444 16.599 4.95227L17.4383 1.42901C17.4383 1.33785 17.4085 1.22944 17.3042 1.15799C17.0211 0.958425 15.2978 2.14502e-06 10.9422 2.14502e-06C5.92606 -0.00246167 0.77832 2.11642 0.77832 12.2969C0.77832 22.4774 6.67103 23.9951 11.6375 23.9951C15.7497 23.9951 18.2429 22.2507 18.2429 22.2507C18.3447 22.194 18.3571 22.0511 18.3571 21.9871V10.6166C18.3571 10.4244 18.2007 10.2692 18.007 10.2692H10.4878Z"
            fill="currentColor"
          />
          <path
            d="M56.7404 1.21713C56.7404 1.02248 56.5864 0.867264 56.3927 0.867264H52.1613C51.9676 0.867264 51.8112 1.02495 51.8112 1.21713V9.33046H45.2157V1.21713C45.2157 1.02248 45.0593 0.867264 44.8656 0.867264H40.6342C40.4405 0.867264 40.284 1.02495 40.284 1.21713V23.1894C40.284 23.384 40.4405 23.5417 40.6342 23.5417H44.8656C45.0593 23.5417 45.2157 23.384 45.2157 23.1894V13.7924H51.8112L51.7988 23.1894C51.7988 23.384 51.9552 23.5417 52.1489 23.5417H56.3903C56.584 23.5417 56.7379 23.384 56.7404 23.1894V1.21713Z"
            fill="currentColor"
          />
          <path
            d="M25.9906 4.09979C25.9906 2.58701 24.7688 1.36495 23.2615 1.36495C21.7542 1.36495 20.5324 2.58701 20.5324 4.09979C20.5324 5.61257 21.7542 6.83462 23.2615 6.83462C24.7688 6.83462 25.9906 5.6101 25.9906 4.09979Z"
            fill="currentColor"
          />
          <path
            d="M25.6876 8.41392C25.6876 8.22174 25.5312 8.06406 25.3375 8.06406H21.1185C20.9248 8.06406 20.7509 8.26117 20.7509 8.45581V22.9874C20.7509 23.4136 21.0191 23.5417 21.3668 23.5417H25.1686C25.5858 23.5417 25.6876 23.3397 25.6876 22.98V8.41392Z"
            fill="currentColor"
          />
          <path
            d="M72.8218 8.09609H68.6227C68.429 8.09609 68.2725 8.25377 68.2725 8.44842V19.2227C68.2725 19.2227 67.2047 19.9963 65.6924 19.9963C64.1802 19.9963 63.7754 19.3138 63.7754 17.8429V8.44842C63.7754 8.25377 63.6189 8.09609 63.4253 8.09609H59.164C58.9728 8.09609 58.8139 8.25377 58.8139 8.44842V18.555C58.8139 22.9233 61.2673 23.9926 64.6445 23.9926C67.4133 23.9926 69.6482 22.4749 69.6482 22.4749C69.6482 22.4749 69.755 23.2756 69.8022 23.3693C69.8494 23.4629 69.976 23.559 70.1101 23.559L72.8218 23.5467C73.013 23.5467 73.1719 23.389 73.1719 23.1968V8.44842C73.1719 8.25377 73.013 8.09609 72.8193 8.09609H72.8218Z"
            fill="currentColor"
          />
          <path
            d="M84.3018 7.60086C81.9154 7.60086 80.2938 8.65784 80.2938 8.65784V1.21713C80.2938 1.02248 80.1374 0.867264 79.9437 0.867264H75.6999C75.5062 0.867264 75.3497 1.02495 75.3497 1.21713V23.1894C75.3497 23.384 75.5062 23.5417 75.6999 23.5417H78.645C78.7766 23.5417 78.8784 23.4727 78.9529 23.3545C79.0249 23.2362 79.1317 22.3419 79.1317 22.3419C79.1317 22.3419 80.8675 23.9729 84.1528 23.9729C88.0092 23.9729 90.2218 22.0314 90.2218 15.2584C90.2218 8.48537 86.6882 7.60086 84.3018 7.60086ZM82.6455 19.9815C81.1878 19.9372 80.202 19.2818 80.202 19.2818V12.324C80.202 12.324 81.1754 11.7302 82.3723 11.6243C83.8846 11.4888 85.3423 11.9421 85.3423 15.522C85.3423 19.2966 84.6842 20.0407 82.6479 19.9815H82.6455Z"
            fill="currentColor"
          />
          <path
            d="M37.8505 8.05913H34.6769C34.6769 8.05913 34.6719 3.90022 34.6719 3.89775C34.6719 3.74007 34.59 3.66123 34.4062 3.66123H30.0804C29.9116 3.66123 29.8222 3.73514 29.8222 3.89529V8.19464C29.8222 8.19464 27.6543 8.71451 27.5078 8.75639C27.3613 8.79828 27.2545 8.93132 27.2545 9.09147V11.7943C27.2545 11.9889 27.411 12.1441 27.6047 12.1441H29.8222V18.6437C29.8222 23.4727 33.2366 23.9458 35.5386 23.9458C36.5915 23.9458 37.8505 23.6107 38.0591 23.5343C38.1857 23.4875 38.2577 23.3594 38.2577 23.219V20.2476C38.2602 20.053 38.0963 19.8978 37.9101 19.8978C37.7238 19.8978 37.252 19.9717 36.7653 19.9717C35.2058 19.9717 34.6769 19.2522 34.6769 18.3209C34.6769 17.3896 34.6769 12.1441 34.6769 12.1441H37.8505C38.0442 12.1441 38.2006 11.9865 38.2006 11.7943V8.409C38.2006 8.21435 38.0442 8.05913 37.8505 8.05913Z"
            fill="currentColor"
          />
        </svg>
      ),
      role: 'Senior Director of Research, GitHub Next',
    },
  },
  'request-a-demo': {
    id: 'request-a-demo',
    heading: 'Request a demo',
    subheading:
      'We can take your requirements and show you how Supabase can help you achieve your goals.',
    quote: {
      text: 'Supabase powers prototyping for fast-moving teams such as GitHub Next.',
      author: '',
      logo: '',
      company: 'GitHub',
    },
  },
}
