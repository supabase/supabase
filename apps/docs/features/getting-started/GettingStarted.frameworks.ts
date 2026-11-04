import { frameworks } from '~/components/FrameworkQuickstarts.constants'
import { isFeatureEnabled } from 'common/enabled-features'

interface Framework {
  slug: string
  name: string
  icon: string
  href: string
  hasLightIcon?: boolean
  sdk: SdkId
  install?: string
  isCommunity?: boolean
}

interface FrameworkGroup {
  id: string
  label: string
  frameworks: Framework[]
}

type SdkId = 'js' | 'dart' | 'swift' | 'kotlin' | 'python' | 'postgres'

// SDKs without an install command defer to the framework quickstart
const SDKS: Record<SdkId, { install?: string; isCommunity?: boolean }> = {
  js: { install: 'npm install @supabase/supabase-js' },
  dart: { install: 'flutter pub add supabase_flutter' },
  swift: {},
  kotlin: { isCommunity: true },
  python: { install: 'pip install supabase' },
  postgres: {},
}

// frameworks not listed here use the JavaScript SDK
const FRAMEWORK_SDKS: Record<string, SdkId> = {
  'ios-swiftui': 'swift',
  kotlin: 'kotlin',
  flutter: 'dart',
  flask: 'python',
  reflex: 'python',
  laravel: 'postgres',
  redwoodjs: 'postgres',
  'ruby-on-rails': 'postgres',
  'spring-boot': 'postgres',
}

const INSTALL_OVERRIDES: Record<string, string> = {
  nextjs: 'npm install @supabase/supabase-js @supabase/ssr',
  reflex: 'uv add supabase',
}

export const FRAMEWORKS: Framework[] = frameworks
  .filter((framework) => framework.enabled !== false)
  .map((framework) => {
    const slug = framework.href.split('/').pop() ?? framework.href
    const sdk = FRAMEWORK_SDKS[slug] ?? 'js'

    return {
      slug,
      name: framework.name,
      icon: framework.icon,
      href: framework.href,
      hasLightIcon: framework.hasLightIcon,
      sdk,
      install: INSTALL_OVERRIDES[slug] ?? SDKS[sdk].install,
      isCommunity: SDKS[sdk].isCommunity,
    }
  })

const getFrameworksBySlug = (slugs: string[]): Framework[] =>
  slugs.flatMap((slug) => FRAMEWORKS.filter((framework) => framework.slug === slug))

export const FRAMEWORK_GROUPS: FrameworkGroup[] = [
  {
    id: 'popular',
    label: 'Popular',
    frameworks: getFrameworksBySlug([
      'nextjs',
      'reactjs',
      'vue',
      'sveltekit',
      'expo-react-native',
      'flutter',
    ]),
  },
  {
    id: 'fullstack',
    label: 'Full stack',
    frameworks: getFrameworksBySlug([
      'nextjs',
      'tanstack',
      'astrojs',
      'nuxtjs',
      'sveltekit',
      'redwoodjs',
      'reflex',
      'laravel',
      'ruby-on-rails',
    ]),
  },
  {
    id: 'frontend',
    label: 'Frontend',
    frameworks: getFrameworksBySlug(['reactjs', 'vue', 'solidjs', 'refine']),
  },
  {
    id: 'mobile',
    label: 'Mobile',
    frameworks: getFrameworksBySlug(['expo-react-native', 'flutter', 'ios-swiftui', 'kotlin']),
  },
  {
    id: 'backend',
    label: 'Backend',
    frameworks: getFrameworksBySlug(['hono', 'flask', 'spring-boot']),
  },
].filter((group) => group.frameworks.length > 0 && isFeatureEnabled('docs:framework_quickstarts'))

export const getFramework = (slug: string | null): Framework | undefined =>
  FRAMEWORKS.find((framework) => framework.slug === slug)
