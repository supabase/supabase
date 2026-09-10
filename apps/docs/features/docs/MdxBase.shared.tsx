import { AiPromptsIndex } from '~/app/guides/getting-started/ai-prompts/[slug]/AiPromptsIndex'
import { AiSkillsIndex } from '~/app/guides/getting-started/ai-skills/AiSkillsIndex'
import { AppleSecretGenerator } from '~/components/AppleSecretGenerator'
import AuthProviders from '~/components/AuthProviders'
import { AuthSmsProviderConfig } from '~/components/AuthSmsProviderConfig'
import ButtonCard from '~/components/ButtonCard'
import { ComputeDiskLimitsTable } from '~/components/ComputeDiskLimitsTable'
import { ContentListings } from '~/components/ContentListings'
import { CustomContent } from '~/components/CustomContent'
import { DatabaseAdvisorsIndex } from '~/components/DatabaseAdvisorsIndex'
import { Extensions } from '~/components/Extensions'
import Image, { type ImageProps } from '~/components/Image'
import { McpCiConfigBlock } from '~/components/McpCiConfigBlock'
import { Mermaid } from '~/components/Mermaid'
import { MetricsStackCards } from '~/components/MetricsStackCards'
import { NavData } from '~/components/NavData'
import { Price } from '~/components/Price'
import { ProjectConfigVariables } from '~/components/ProjectConfigVariables'
import { RealtimeLimitsEstimator } from '~/components/RealtimeLimitsEstimator'
import { RegionsList, SmartRegionsList } from '~/components/RegionsList'
import { SharedData } from '~/components/SharedData'
import StepHikeCompact from '~/components/StepHikeCompact'
import { TerraformProviderSchema } from '~/components/TerraformProviderSchema'
import { WrapperDashboardIntegration } from '~/components/WrapperDashboardIntegration'
import { CodeSampleDummy, CodeSampleWrapper } from '~/features/directives/CodeSample.client'
import { NamedCodeBlock } from '~/features/directives/CodeTabs.components'
import { MdxAnchor } from '~/features/docs/MdxAnchor'
import { Accordion, AccordionItem } from '~/features/ui/Accordion'
import { CodeBlock } from '~/features/ui/CodeBlock/CodeBlock'
import { ShowUntil } from '~/features/ui/ShowUntil'
import { TabPanel, Tabs } from '~/features/ui/Tabs'
import { ArrowDown, Check, X } from 'lucide-react'
import Link from 'next/link'
import { type ComponentPropsWithoutRef } from 'react'
import { Badge, Button, Heading } from 'ui'
import { Admonition, type AdmonitionProps } from 'ui-patterns/Admonition'
import { GlassPanel } from 'ui-patterns/GlassPanel'
import SqlToRest from 'ui-patterns/SqlToRest'

import { AgentPluginsPanel } from '../ui/AgentPluginsPanel'
import { AgentSetup } from '../ui/AgentSetup'
import { AgentWatchSchedule } from '../ui/AgentWatchSchedule'
import { AiPrompt } from '../ui/AiPrompt'
import { ErrorCodes } from '../ui/ErrorCodes'
import { McpConfigPanel } from '../ui/McpConfigPanel'

// Admonition as it appears in docs pages: sits in MDX prose, so it needs a margin-bottom.
const DocsAdmonition = (props: AdmonitionProps) => {
  return <Admonition {...props} className="mb-8" />
}

/**
 * Route fenced ```mermaid blocks through the Mermaid component; everything else
 * continues through `CodeBlock` for syntax highlighting.
 */
const Pre = (props: any) => {
  const child = Array.isArray(props.children) ? props.children[0] : props.children
  const className: unknown = child?.props?.className
  if (typeof className === 'string' && className.split(' ').includes('language-mermaid')) {
    const code = child.props.children
    if (typeof code === 'string') {
      return <Mermaid chart={code.trim()} />
    }
  }
  return <CodeBlock {...props} />
}

const components = {
  Accordion,
  AccordionItem,
  Admonition: DocsAdmonition,
  AgentPluginsPanel,
  AgentSetup,
  AgentWatchSchedule,
  AiPrompt,
  AiPromptsIndex,
  AiSkillsIndex,
  AuthSmsProviderConfig,
  AppleSecretGenerator,
  AuthProviders,
  Badge,
  Button,
  ButtonCard,
  CodeSampleDummy,
  CodeSampleWrapper,
  ComputeDiskLimitsTable,
  CustomContent,
  ContentListings,
  DatabaseAdvisorsIndex,
  ErrorCodes,
  Extensions,
  GlassPanel,
  IconArrowDown: ArrowDown,
  IconCheck: Check,
  IconX: X,
  Image: (props: ImageProps) => <Image className="rounded-md w-full" {...props} />,
  Link,
  McpCiConfigBlock,
  McpConfigPanel,
  Mermaid,
  MetricsStackCards,
  NamedCodeBlock,
  NavData,
  ProjectConfigVariables,
  RealtimeLimitsEstimator,
  RegionsList,
  SmartRegionsList,
  SharedData,
  ShowUntil,
  SqlToRest,
  StepHikeCompact,
  Tabs,
  TabPanel,
  TerraformProviderSchema,
  WrapperDashboardIntegration,
  a: MdxAnchor,
  h2: (props: ComponentPropsWithoutRef<'h2'>) => (
    <Heading tag="h2" {...props}>
      {props.children}
    </Heading>
  ),
  h3: (props: ComponentPropsWithoutRef<'h3'>) => (
    <Heading tag="h3" {...props}>
      {props.children}
    </Heading>
  ),
  h4: (props: ComponentPropsWithoutRef<'h4'>) => (
    <Heading tag="h4" {...props}>
      {props.children}
    </Heading>
  ),
  pre: Pre,
  /**
   * Force inline code tags to go sync, this prevents Heading anchor resolution fail due to
   * our CodeBlock component being async. We need to find a better solution for more future
   * proof MDX rendering. Definitely improving the anchors utility in the ui/Heading component
   * plus having a more resilient highlighting strategy.
   */
  code: (props: any) => <code {...props}>{props.children}</code>,
  Price,
}

export { components }
