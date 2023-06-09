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
import { Mermaid } from 'mdx-mermaid/lib/Mermaid'
import RefSubLayout from '~/layouts/ref/RefSubLayout'
import { Heading } from './CustomHTMLElements'
import DatabaseSetup from './MDX/database_setup.mdx'
import ProjectSetup from './MDX/project_setup.mdx'
import QuickstartIntro from './MDX/quickstart_intro.mdx'
import SocialProviderSettingsSupabase from './MDX/social_provider_settings_supabase.mdx'
import SocialProviderSetup from './MDX/social_provider_setup.mdx'
import StorageManagement from './MDX/storage_management.mdx'
import { CH } from '@code-hike/mdx/components'
import RefHeaderSection from './reference/RefHeaderSection'

// Ref version specific
import CliGlobalFlagsHandler from '~/components/reference/enrichments/cli/CliGlobalFlagsHandler'

import Options from '~/components/Options'
import Param from '~/components/Params'

import {
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
  IconMenuSwift,
  IconMenuKotlin,
  IconMenuApi,
  IconMenuCli,
} from './Navigation/NavigationMenu/HomeMenuIcons'

const components = {
  ...markdownComponents,
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
  Alert: (props: any) => (
    <Alert {...props} className="not-prose">
      {props.children}
    </Alert>
  ),
  Tabs,
  TabPanel: (props: any) => <Tabs.Panel {...props}>{props.children}</Tabs.Panel>,
  h2: (props: any) => (
    <Heading tag="h2" {...props}>
      {props.children}
    </Heading>
  ),
  h3: (props: any) => (
    <Heading tag="h3" {...props}>
      {props.children}
    </Heading>
  ),
  RefSubLayout,
  RefHeaderSection: (props: any) => <RefHeaderSection {...props} />,
  CliGlobalFlagsHandler: () => <CliGlobalFlagsHandler />,
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

export default components
