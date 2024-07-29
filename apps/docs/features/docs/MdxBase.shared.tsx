import { ArrowDown, Check, X } from 'lucide-react'
import Link from 'next/link'
import { GlassPanel } from 'ui-patterns/GlassPanel'
import { IconPanel } from 'ui-patterns/IconPanel'
import SqlToRest from 'ui-patterns/SqlToRest'
import { Admonition, Button, Image } from 'ui'
import { Heading } from 'ui/src/components/CustomHTMLElements'
import { AppleSecretGenerator } from '~/components/AppleSecretGenerator'
import AuthProviders from '~/components/AuthProviders'
import { AuthSmsProviderConfig } from '~/components/AuthSmsProviderConfig'
import { CostWarning } from '~/components/AuthSmsProviderConfig/AuthSmsProviderConfig.Warnings'
import ButtonCard from '~/components/ButtonCard'
import { Extensions } from '~/components/Extensions'
import { JwtGenerator } from '~/components/JwtGenerator'
import {
  AuthRateLimits,
  CreateClientSnippet,
  DatabaseSetup,
  GetSessionWarning,
  HuggingFaceDeployment,
  KotlinProjectSetup,
  MigrationWarnings,
  ProjectSetup,
  OAuthPkceFlow,
  QuickstartIntro,
  SocialProviderSettingsSupabase,
  SocialProviderSetup,
} from '~/components/MDX/partials'
import { NavData } from '~/components/NavData'
import { ProjectConfigVariables } from '~/components/ProjectConfigVariables'
import { RealtimeLimitsEstimator } from '~/components/RealtimeLimitsEstimator'
import { RegionsList } from '~/components/RegionsList'
import { SharedData } from '~/components/SharedData'
import StepHikeCompact from '~/components/StepHikeCompact'
import { Accordion, AccordionItem } from '~/features/ui/Accordion'
import * as CH from '~/features/ui/CodeHike'
import { Tabs, TabPanel } from '~/features/ui/Tabs'

const components = {
  Accordion,
  AccordionItem,
  Admonition,
  AuthRateLimits,
  AuthSmsProviderConfig,
  AppleSecretGenerator,
  AuthProviders,
  Button,
  ButtonCard,
  CH,
  CostWarning,
  CreateClientSnippet,
  DatabaseSetup,
  Extensions,
  GetSessionWarning,
  GlassPanel,
  HuggingFaceDeployment,
  IconArrowDown: ArrowDown,
  IconCheck: Check,
  IconPanel,
  IconX: X,
  Image: (props: any) => <Image fill className="object-contain" {...props} />,
  JwtGenerator,
  KotlinProjectSetup,
  Link,
  MigrationWarnings,
  NavData,
  OAuthPkceFlow,
  ProjectConfigVariables,
  ProjectSetup,
  QuickstartIntro,
  RealtimeLimitsEstimator,
  RegionsList,
  SharedData,
  SocialProviderSettingsSupabase,
  SocialProviderSetup,
  SqlToRest,
  StepHikeCompact,
  Tabs,
  TabPanel,
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
}

export { components }
