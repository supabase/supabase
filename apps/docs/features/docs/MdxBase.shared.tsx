import { ArrowDown, Check, X } from 'lucide-react'
import Link from 'next/link'
import { Button, Image } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { GlassPanel } from 'ui-patterns/GlassPanel'
import { IconPanel } from 'ui-patterns/IconPanel'
import SqlToRest from 'ui-patterns/SqlToRest'
import { Heading } from 'ui/src/components/CustomHTMLElements'
import { AppleSecretGenerator } from '~/components/AppleSecretGenerator'
import AuthProviders from '~/components/AuthProviders'
import { AuthSmsProviderConfig } from '~/components/AuthSmsProviderConfig'
import { CostWarning } from '~/components/AuthSmsProviderConfig/AuthSmsProviderConfig.Warnings'
import ButtonCard from '~/components/ButtonCard'
import { Extensions } from '~/components/Extensions'
import { JwtGenerator } from '~/components/JwtGenerator'
import {
  AuthErrorCodesTable,
  AuthRateLimits,
  CreateClientSnippet,
  DatabaseSetup,
  GetSessionWarning,
  HuggingFaceDeployment,
  KotlinProjectSetup,
  MigrationWarnings,
  OAuthPkceFlow,
  ProjectSetup,
  QuickstartDbSetup,
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
import { CodeSampleWrapper } from '~/features/directives/CodeSample.client'
import { Accordion, AccordionItem } from '~/features/ui/Accordion'
import * as CH from '~/features/ui/CodeHike'
import { TabPanel, Tabs } from '~/features/ui/Tabs'

const components = {
  Accordion,
  AccordionItem,
  Admonition,
  AuthErrorCodesTable,
  AuthRateLimits,
  AuthSmsProviderConfig,
  AppleSecretGenerator,
  AuthProviders,
  Button,
  ButtonCard,
  CH,
  CodeSampleWrapper,
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
  QuickstartDbSetup,
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
