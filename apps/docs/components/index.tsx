/**
 * This entire file could do with a cleanup and better code-splitting, but one thing at a time.
 */

// Basic UI things
import Link from 'next/link'
import { Accordion, Admonition, Alert, Button, CodeBlock, markdownComponents, Tabs } from 'ui'
import { GlassPanel } from 'ui-patterns/GlassPanel'
import { IconPanel } from 'ui-patterns/IconPanel'
import { ThemeImage } from 'ui-patterns/ThemeImage'

// Common components
import { CH } from '@code-hike/mdx/components'
import StepHikeCompact from '~/components/StepHikeCompact'
import ButtonCard from './ButtonCard'
import { Heading } from './CustomHTMLElements'

// Reference guide specific
// [Charis] I think we can factor these out so they aren't in the bundle for absolutely everything
import CliGlobalFlagsHandler from '~/components/reference/enrichments/cli/CliGlobalFlagsHandler'
import RefSubLayout from '~/layouts/ref/RefSubLayout'
import RefHeaderSection from './reference/RefHeaderSection'

// Other components
import AuthProviders from '~/components/AuthProviders'
import Options from '~/components/Options'
import Param from '~/components/Params'
import { ProjectConfigVariables } from './ProjectConfigVariables'

// Data wrappers
import { NavData } from './NavData'
import { SharedData } from './SharedData'

// Partials
import DatabaseSetup from './MDX/database_setup.mdx'
import GetSessionWarning from './MDX/get_session_warning.mdx'
import HuggingFaceDeployment from './MDX/ai/quickstart_hf_deployment.mdx'
import KotlinProjectSetup from './MDX/kotlin_project_setup.mdx'
import MigrationWarnings from './MDX/migration_warnings.mdx'
import ProjectSetup from './MDX/project_setup.mdx'
import QuickstartIntro from './MDX/quickstart_intro.mdx'
import SocialProviderSettingsSupabase from './MDX/social_provider_settings_supabase.mdx'
import SocialProviderSetup from './MDX/social_provider_setup.mdx'

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
import { IconArrowDown, IconCheck } from 'ui'

// Heavy/rare (lazy-loaded)
import { AppleSecretGenerator } from './AppleSecretGenerator'
import { Extensions } from './Extensions'
import { JwtGenerator } from './JwtGenerator'
import { Mermaid } from './Mermaid'
import { RealtimeLimitsEstimator } from './RealtimeLimitsEstimator'

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
  Extensions,
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
  HuggingFaceDeployment,
  IconCheck,
  IconMenuApi,
  IconArrowDown,
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
  JwtGenerator,
  KotlinProjectSetup,
  Link,
  Mermaid,
  MigrationWarnings,
  NavData,
  Options,
  Param,
  ProjectConfigVariables,
  ProjectSetup,
  QuickstartIntro,
  RealtimeLimitsEstimator,
  RefHeaderSection: (props: any) => <RefHeaderSection {...props} />,
  RefSubLayout,
  SharedData,
  SocialProviderSettingsSupabase,
  SocialProviderSetup,
  StepHikeCompact,
  TabPanel: (props: any) => <Tabs.Panel {...props}>{props.children}</Tabs.Panel>,
  Tabs: (props: any) => <Tabs wrappable {...props} />,
}

export default components
