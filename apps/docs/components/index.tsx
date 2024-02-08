/**
 * This entire file could do with a cleanup and better code-splitting, but one thing at a time.
 */

// Basic UI things
import Link from 'next/link'
import {
  Accordion,
  Admonition,
  Alert,
  Button,
  CodeBlock,
  GlassPanel,
  IconPanel,
  markdownComponents,
  Tabs,
  ThemeImage,
} from 'ui'
import { Heading } from './CustomHTMLElements'

// Common components
import { CH } from '@code-hike/mdx/components'
import StepHikeCompact from '~/components/StepHikeCompact'
import ButtonCard from './ButtonCard'

// Reference guide specific
// [Charis] I think we can factor these out so they aren't in the bundle for absolutely everything
import CliGlobalFlagsHandler from '~/components/reference/enrichments/cli/CliGlobalFlagsHandler'
import RefHeaderSection from './reference/RefHeaderSection'
import RefSubLayout from '~/layouts/ref/RefSubLayout'

// Other components
import AuthProviders from '~/components/AuthProviders'
import { ProjectConfigVariables } from './ProjectConfigVariables'
import Options from '~/components/Options'
import Param from '~/components/Params'

// Data wrappers
import { NavData } from './NavData'

// Partials
import DatabaseSetup from './MDX/database_setup.mdx'
import GetSessionWarning from './MDX/get_session_warning.mdx'
import MigrationWarnings from './MDX/migration_warnings.mdx'
import ProjectSetup from './MDX/project_setup.mdx'
import QuickstartIntro from './MDX/quickstart_intro.mdx'
import SocialProviderSettingsSupabase from './MDX/social_provider_settings_supabase.mdx'
import SocialProviderSetup from './MDX/social_provider_setup.mdx'
import StorageManagement from './MDX/storage_management.mdx'

// Icons
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
  IconMenuRestApis,
  IconMenuSelfHosting,
  IconMenuStorage,
  IconMenuSwift,
} from './Navigation/NavigationMenu/HomeMenuIcons'

// Heavy/rare (lazy-loaded)
import { AppleSecretGenerator } from './AppleSecretGenerator'
import { Mermaid } from './Mermaid'

const components = {
  ...markdownComponents,
  Accordion,
  Admonition,
  Alert: (props: any) => (
    <Alert {...props} className="not-prose">
      {props.children}
    </Alert>
  ),
  AppleSecretGenerator,
  AuthProviders,
  Button,
  ButtonCard,
  CH,
  CliGlobalFlagsHandler: () => <CliGlobalFlagsHandler />,
  CodeBlock,
  DatabaseSetup,
  GetSessionWarning,
  GlassPanel,
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
  h4: (props: any) => (
    <Heading tag="h4" {...props}>
      {props.children}
    </Heading>
  ),
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
  IconMenuRestApis,
  IconMenuSelfHosting,
  IconMenuStorage,
  IconMenuSwift,
  IconPanel,
  Image: (props: any) => <ThemeImage fill className="object-contain" {...props} />,
  Link,
  Mermaid,
  MigrationWarnings,
  NavData,
  Options,
  Param,
  ProjectConfigVariables,
  ProjectSetup,
  QuickstartIntro,
  RefHeaderSection: (props: any) => <RefHeaderSection {...props} />,
  RefSubLayout,
  SocialProviderSettingsSupabase,
  SocialProviderSetup,
  StepHikeCompact,
  StorageManagement,
  TabPanel: (props: any) => <Tabs.Panel {...props}>{props.children}</Tabs.Panel>,
  Tabs: (props: any) => <Tabs wrappable {...props} />,
}

export default components
