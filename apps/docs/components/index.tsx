import { MDXRemoteProps } from 'next-mdx-remote'
import Link from 'next/link'
import { Alert, Button, CodeBlock, GlassPanel, markdownComponents, Tabs } from 'ui'
import StepHikeCompact from '~/components/StepHikeCompact'
// Common components
import Admonition from './Admonition'
import ButtonCard from './ButtonCard'
import JwtGenerator from './JwtGenerator'

// Page specific components
import AuthProviders from './AuthProviders'
import Extensions from './Extensions'
import Frameworks from './Frameworks'
import FunctionsExamples from './FunctionsExamples'

// Other components
import { CH } from '@code-hike/mdx/components'
import { Mermaid } from 'mdx-mermaid/lib/Mermaid'
import RefSubLayout from '~/layouts/ref/RefSubLayout'
import { Heading } from './CustomHTMLElements'
import DatabaseSetup from './MDX/database_setup.mdx'
import ProjectSetup from './MDX/project_setup.mdx'
import QuickstartIntro from './MDX/quickstart_intro.mdx'
import SocialProviderSettingsSupabase from './MDX/social_provider_settings_supabase.mdx'
import SocialProviderSetup from './MDX/social_provider_setup.mdx'
import StorageManagement from './MDX/storage_management.mdx'
import RefHeaderSection from './reference/RefHeaderSection'

// Ref version specific
import CliGlobalFlagsHandler from '~/components/reference/enrichments/cli/CliGlobalFlagsHandler'

import Options from '~/components/Options'
import Param from '~/components/Params'

import { AlertProps } from 'ui/src/components/Alert/Alert'
import {
  IconMenuApi,
  IconMenuAuth,
  IconMenuCli,
  IconMenuCsharp,
  IconMenuDatabase,
  IconMenuEdgeFunctions,
  IconMenuFlutter,
  IconMenuGettingStarted,
  IconMenuHome,
  IconMenuIntegrations,
  IconMenuJavascript,
  IconMenuKotlin,
  IconMenuPlatform,
  IconMenuPython,
  IconMenuRealtime,
  IconMenuResources,
  IconMenuSelfHosting,
  IconMenuServerlessApis,
  IconMenuStorage,
  IconMenuSwift,
} from './Navigation/NavigationMenu/HomeMenuIcons'

const components: MDXRemoteProps['components'] = {
  ...markdownComponents,
  a: ({ href, ...props }) =>
    href ? (
      <Link href={href}>
        <a {...props} />
      </Link>
    ) : (
      <a {...props} />
    ),
  Admonition,
  Button,
  ButtonCard,
  CH,
  CodeBlock,
  GlassPanel,
  Link,
  Frameworks,
  AuthProviders,
  FunctionsExamples,
  JwtGenerator,
  QuickstartIntro,
  DatabaseSetup,
  ProjectSetup,
  SocialProviderSetup,
  SocialProviderSettingsSupabase,
  StepHikeCompact,
  StorageManagement,
  Mermaid,
  Extensions,
  Alert: ({ children, ...props }: AlertProps) => (
    <Alert {...props} className="not-prose">
      {children}
    </Alert>
  ),
  Tabs,
  TabPanel: Tabs.Panel,
  h2: ({ children, ...props }) => (
    <Heading tag="h2" {...props}>
      {children}
    </Heading>
  ),
  h3: ({ children, ...props }) => (
    <Heading tag="h3" {...props}>
      {children}
    </Heading>
  ),
  RefSubLayout,
  RefHeaderSection,
  CliGlobalFlagsHandler,
  Options,
  Param,
  IconMenuJavascript,
  IconMenuHome,
  IconMenuGettingStarted,
  IconMenuDatabase,
  IconMenuServerlessApis,
  IconMenuAuth,
  IconMenuEdgeFunctions,
  IconMenuRealtime,
  IconMenuStorage,
  IconMenuPlatform,
  IconMenuResources,
  IconMenuSelfHosting,
  IconMenuIntegrations,
  IconMenuFlutter,
  IconMenuPython,
  IconMenuCsharp,
  IconMenuKotlin,
  IconMenuSwift,
  IconMenuApi,
  IconMenuCli,
}

// we need to cast this to any because we're using this same object
// for both next-mdx-remote and react-markdown
export default components as any
