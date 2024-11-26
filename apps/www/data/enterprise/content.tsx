import {
  Activity,
  ArrowLeftRight,
  ClipboardCheck,
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
  Users,
  UserX,
} from 'lucide-react'
import RequestADemoForm from '../../components/Forms/RequestADemoForm'
import { IntlShape, FormattedMessage } from 'react-intl'

export default ({ intl }: { intl: IntlShape }) => ({
  metadata: {
    metaTitle: intl.formatMessage({ id: 'enterprise.metadata.title' }),
    metaDescription: intl.formatMessage({ id: 'enterprise.metadata.description' }),
  },
  heroSection: {
    id: 'hero',
    title: intl.formatMessage({ id: 'enterprise.heroSection.title.label' }),
    h1: (
      <FormattedMessage
        id="enterprise.heroSection.title.text"
        values={{
          br: () => <br />,
        }}
      />
    ),
    subheader: [
      <FormattedMessage id="enterprise.heroSection.subheader" />,
    ],
    image: <RequestADemoForm />,
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
    label: intl.formatMessage({ id: 'enterprise.useCases.label' }),
    heading: intl.formatMessage({ id: 'enterprise.useCases.heading' }),
    stories: [
      {
        icon: '/images/customers/logos/light/mozilla.png',
        url: 'https://developer.mozilla.org/en-US/blog/introducing-ai-help/',
        target: '_blank',
        heading: intl.formatMessage({ id: 'enterprise.useCases.stories.0.heading' }),
        subheading: (
          <FormattedMessage
            id="enterprise.useCases.stories.0.subheading"
            values={{
              highlight: (chunks: React.ReactNode) => <span className="text-foreground">{chunks}</span>,
            }}
          />
        ),
      },
      {
        icon: '/images/customers/logos/light/epsilon3.png',
        url: '/customers/epsilon3',
        heading: intl.formatMessage({ id: 'enterprise.useCases.stories.1.heading' }),
        subheading: (
          <FormattedMessage
            id="enterprise.useCases.stories.1.subheading"
            values={{
              highlight: (chunks: React.ReactNode) => <span className="text-foreground">{chunks}</span>,
            }}
          />
        ),
      },
      {
        icon: '/images/customers/logos/light/pebblely.png',
        url: '/customers/pebblely',
        heading: intl.formatMessage({ id: 'enterprise.useCases.stories.2.heading' }),
        subheading: (
          <FormattedMessage
            id="enterprise.useCases.stories.2.subheading"
            values={{
              highlight: (chunks: React.ReactNode) => <span className="text-foreground">{chunks}</span>,
            }}
          />
        ),
      },
    ],
    highlights: [
      {
        icon: LineChart,
        heading: intl.formatMessage({ id: 'enterprise.highlights.0.heading' }),
        subheading: intl.formatMessage({ id: 'enterprise.highlights.0.subheading' }),
        url: '/customers/maergo',
      },
      {
        icon: DollarSign,
        heading: intl.formatMessage({ id: 'enterprise.highlights.1.heading' }),
        subheading: intl.formatMessage({ id: 'enterprise.highlights.1.subheading' }),
        url: '/customers/shotgun',
      },
      {
        icon: Timer,
        heading: intl.formatMessage({ id: 'enterprise.highlights.2.heading' }),
        subheading: intl.formatMessage({ id: 'enterprise.highlights.2.subheading' }),
        url: '/customers/voypost',
      },
      {
        icon: Scale,
        heading: intl.formatMessage({ id: 'enterprise.highlights.3.heading' }),
        subheading: intl.formatMessage({ id: 'enterprise.highlights.3.subheading' }),
        url: '/customers/markprompt',
      },
    ],
  },
  performance: {
    id: 'performance',
    heading: (
      <FormattedMessage
        id="enterprise.performance.heading"
        values={{
          br: () => <br />,
        }}
      />
    ),
    subheading: <FormattedMessage id="enterprise.performance.subheading" />,
    highlights: [
      {
        heading: intl.formatMessage({ id: 'enterprise.performance.highlights.0.heading' }),
        subheading: '1,000,000+',
      },
      {
        heading: intl.formatMessage({ id: 'enterprise.performance.highlights.1.heading' }),
        subheading: '3,500+',
      },
    ],
  },
  security: {
    id: 'security',
    label: intl.formatMessage({ id: 'enterprise.security.label' }),
    heading: intl.formatMessage({ id: 'enterprise.security.heading' }),
    subheading: intl.formatMessage({ id: 'enterprise.security.subheading' }),
    cta: {
      label: intl.formatMessage({ id: 'enterprise.security.cta.label' }),
      url: '/security',
    },
    features: [
      {
        icon: ShieldCheck,
        heading: intl.formatMessage({ id: 'enterprise.security.features.0.heading' }),
      },
      {
        icon: Activity,
        heading: intl.formatMessage({ id: 'enterprise.security.features.1.heading' }),
      },
      {
        icon: ShieldAlert,
        heading: intl.formatMessage({ id: 'enterprise.security.features.2.heading' }),
      },
      {
        icon: Lock,
        heading: intl.formatMessage({ id: 'enterprise.security.features.3.heading' }),
      },
      {
        icon: ClipboardCheck,
        heading: intl.formatMessage({ id: 'enterprise.security.features.4.heading' }),
      },
      {
        icon: Users,
        heading: intl.formatMessage({ id: 'enterprise.security.features.5.heading' }),
      },
      {
        icon: LayoutList,
        heading: intl.formatMessage({ id: 'enterprise.security.features.6.heading' }),
      },
      {
        icon: Lightbulb,
        heading: intl.formatMessage({ id: 'enterprise.security.features.7.heading' }),
      },
      {
        icon: FolderLock,
        heading: intl.formatMessage({ id: 'enterprise.security.features.8.heading' }),
      },
      {
        icon: UserX,
        heading: intl.formatMessage({ id: 'enterprise.security.features.9.heading' }),
      },
    ],
  },
  support: {
    id: 'support',
    label: intl.formatMessage({ id: 'enterprise.support.label' }),
    heading: <FormattedMessage id="enterprise.support.heading" />,
    features: [
      {
        icon: Globe2,
        heading: intl.formatMessage({ id: 'enterprise.support.features.0.heading' }),
        subheading: intl.formatMessage({ id: 'enterprise.support.features.0.subheading' }),
      },
      {
        icon: Users,
        heading: intl.formatMessage({ id: 'enterprise.support.features.1.heading' }),
        subheading: intl.formatMessage({ id: 'enterprise.support.features.1.subheading' }),
      },
      {
        icon: ArrowLeftRight,
        heading: intl.formatMessage({ id: 'enterprise.support.features.2.heading' }),
        subheading: intl.formatMessage({ id: 'enterprise.support.features.2.subheading' }),
      },
    ],
  },
  quote: {
    id: 'quote',
    quote: {
      text: intl.formatMessage({ id: 'enterprise.quote.text' }),
      author: intl.formatMessage({ id: 'enterprise.quote.author' }),
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
      role: intl.formatMessage({ id: 'enterprise.quote.role' }),
    },
  },
  'request-a-demo': {
    id: 'request-a-demo',
    heading: intl.formatMessage({ id: 'enterprise.requestDemo.heading' }),
    subheading: intl.formatMessage({ id: 'enterprise.requestDemo.subheading' }),
  },
});
