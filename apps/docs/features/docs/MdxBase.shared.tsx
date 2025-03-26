import { ArrowDown, Check, X } from 'lucide-react'
import Link from 'next/link'

import { Button, Image } from 'ui'
import { Admonition } from 'ui-patterns/admonition'
import { GlassPanel } from 'ui-patterns/GlassPanel'
import { IconPanel } from 'ui-patterns/IconPanel'
import SqlToRest from 'ui-patterns/SqlToRest'
import { Heading } from 'ui/src/components/CustomHTMLElements'

import { AiPromptsIndex } from '~/app/guides/getting-started/ai-prompts/[slug]/AiPromptsIndex'
import { AppleSecretGenerator } from '~/components/AppleSecretGenerator'
import AuthProviders from '~/components/AuthProviders'
import { AuthSmsProviderConfig } from '~/components/AuthSmsProviderConfig'
import { CostWarning } from '~/components/AuthSmsProviderConfig/AuthSmsProviderConfig.Warnings'
import ButtonCard from '~/components/ButtonCard'
import { Extensions } from '~/components/Extensions'
import { JwtGenerator } from '~/components/JwtGenerator'
import { NavData } from '~/components/NavData'
import { ProjectConfigVariables } from '~/components/ProjectConfigVariables'
import { RealtimeLimitsEstimator } from '~/components/RealtimeLimitsEstimator'
import { RegionsList } from '~/components/RegionsList'
import { SharedData } from '~/components/SharedData'
import StepHikeCompact from '~/components/StepHikeCompact'
import { CodeSampleDummy, CodeSampleWrapper } from '~/features/directives/CodeSample.client'
import { Accordion, AccordionItem } from '~/features/ui/Accordion'
import { CodeBlock } from '~/features/ui/CodeBlock/CodeBlock'
import InfoTooltip from '~/features/ui/InfoTooltip'
import { TabPanel, Tabs } from '~/features/ui/Tabs'
import { ShowUntil } from '~/features/ui/ShowUntil'

const components = {
  Accordion,
  AccordionItem,
  Admonition,
  AiPromptsIndex,
  AuthSmsProviderConfig,
  AppleSecretGenerator,
  AuthProviders,
  Button,
  ButtonCard,
  CodeSampleDummy,
  CodeSampleWrapper,
  CostWarning,
  Extensions,
  GlassPanel,
  IconArrowDown: ArrowDown,
  IconCheck: Check,
  IconPanel,
  IconX: X,
  Image: (props: any) => <Image fill alt="" className="object-contain" {...props} />,
  JwtGenerator,
  Link,
  NavData,
  ProjectConfigVariables,
  RealtimeLimitsEstimator,
  RegionsList,
  SharedData,
  ShowUntil,
  SqlToRest,
  StepHikeCompact,
  Tabs,
  TabPanel,
  InfoTooltip,
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
  pre: CodeBlock,
}

export { components }
