'use client'

import { StepHikeCompact } from '~/components/StepHikeCompact'
import { SOURCE_FOOTER_CLASSES, SourceFrame } from '~/features/directives/CodeSample.client'
import { CodeTabs } from '~/features/directives/CodeTabs.components'
import { IconLinkImage } from '~/features/ui/IconLink'
import {
  Prompt,
  PromptContent,
  PromptCopy,
  PromptMarkdown,
  PromptPanel,
  PromptTitle,
} from '~/features/ui/PromptPanel'
import { TabPanel } from '~/features/ui/Tabs'
import { useSendTelemetryEvent } from '~/lib/telemetry'
import { useSearchParamsShallow } from 'common'
import { ArrowRight, ArrowUpRight, Check } from 'lucide-react'
import { animate, useMotionValue, useMotionValueEvent, useReducedMotion } from 'motion/react'
import Link from 'next/link'
import { RadioGroup } from 'radix-ui'
import { useId, useState, type ReactNode } from 'react'
import { Badge, Button, cn, ToggleGroup, ToggleGroupItem } from 'ui'
import { IsoShape } from 'ui-patterns/IsoShape/IsoShape'

import {
  EXPLORE_ITEMS,
  getNextSteps,
  parseChoices,
  START_OPTIONS,
  type ExploreItem,
} from './GettingStarted.data'
import { FRAMEWORK_GROUPS, getFramework } from './GettingStarted.frameworks'
import { buildPrompt, buildVerifyPrompt } from './GettingStarted.prompts'
import { useGettingStartedVariant } from './useGettingStartedVariant'

// flags load in the browser, so the server html and readers without javascript get the control
export const GettingStartedVariantSwitch = ({
  control,
  children,
}: GettingStartedVariantSwitchProps) => {
  const { variant, isReady } = useGettingStartedVariant()

  return (
    <div className={cn(!isReady && 'invisible noscript:visible')}>
      {variant === 'stepper' ? children : control}
    </div>
  )
}

export const GettingStartedStepperClient = ({
  localCommandsCode,
  installCodes,
}: GettingStartedStepperClientProps) => {
  const searchParams = useSearchParamsShallow()
  const choices = parseChoices(searchParams)
  const framework = getFramework(choices.fw)
  const isAgent = choices.start === 'agent'
  const sendTelemetryEvent = useSendTelemetryEvent()
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null)
  // until the reader picks a group, show the first group that holds the framework
  const activeGroup =
    FRAMEWORK_GROUPS.find((group) => group.id === selectedGroupId) ??
    FRAMEWORK_GROUPS.find((group) => group.frameworks.some((item) => item.slug === choices.fw)) ??
    FRAMEWORK_GROUPS[0]

  const handleStartChange = (start: string) => {
    searchParams.set('start', start)
    sendTelemetryEvent({
      action: 'docs_getting_started_option_clicked',
      properties: { optionType: 'start', optionId: start },
    })
  }
  const handleFrameworkChange = (fw: string) => {
    searchParams.set('fw', fw)
    sendTelemetryEvent({
      action: 'docs_getting_started_option_clicked',
      properties: { optionType: 'framework', optionId: fw },
    })
  }
  // an empty list means the reader skipped the step, so the prompt asks
  const handleFeatureToggle = (id: string) => {
    const wasSelected = choices.features.includes(id)
    searchParams.set(
      'features',
      wasSelected
        ? choices.features.filter((feature) => feature !== id).join(',')
        : [...choices.features, id].join(',')
    )
    sendTelemetryEvent({
      action: 'docs_getting_started_option_clicked',
      properties: { optionType: 'feature', optionId: id, isSelected: !wasSelected },
    })
  }
  const handleQuickstartClick = () => {
    if (!framework) return
    sendTelemetryEvent({
      action: 'docs_content_listing_clicked',
      properties: {
        targetPath: framework.href,
        linkTitle: `${framework.name} quickstart`,
        groupTitle: 'Connect your app',
        listingId: 'getting-started-stepper',
      },
    })
  }
  const handleGroupChange = (groupId: string) => {
    const group = FRAMEWORK_GROUPS.find((item) => item.id === groupId)
    if (!group) return
    setSelectedGroupId(group.id)
    if (!group.frameworks.some((item) => item.slug === choices.fw)) {
      searchParams.delete('fw')
    }
  }

  return (
    <div className="not-prose @container flex flex-col gap-12">
      <p className="m-0 text-lg text-foreground-light">
        Create a Supabase project and connect it to your app.
      </p>
      <StepHikeCompact title="Get started">
        <StepHikeCompact.Step step={1} title="Choose how to start">
          <StepHikeCompact.Details title="Choose how to start">
            <p className="m-0 text-sm text-foreground-light">
              Let your AI agent set up Supabase, run Supabase locally, or create a hosted project.
            </p>
          </StepHikeCompact.Details>
          <StepHikeCompact.Code>
            <StartChoiceCards value={choices.start} onValueChange={handleStartChange} />
          </StepHikeCompact.Code>
        </StepHikeCompact.Step>
        {choices.start === 'cli' ? (
          <StepHikeCompact.Step step={2} title="Run Supabase locally">
            <StepHikeCompact.Details title="Run Supabase locally">
              <p className="m-0 text-sm text-foreground-light">
                Install the Supabase CLI, initialize your project, then start the local stack. The
                CLI needs Node.js 20 or later, and the local stack needs Docker or another container
                runtime.
              </p>
            </StepHikeCompact.Details>
            <StepHikeCompact.Code>{localCommandsCode}</StepHikeCompact.Code>
          </StepHikeCompact.Step>
        ) : choices.start === 'dashboard' ? (
          <StepHikeCompact.Step step={2} title="Create a project">
            <StepHikeCompact.Details title="Create a project">
              <p className="m-0 text-sm text-foreground-light">
                Create a hosted project in the Supabase Dashboard, then return here to connect your
                app.
              </p>
            </StepHikeCompact.Details>
            <StepHikeCompact.Code>
              <Button
                asChild
                variant="primary"
                size="small"
                iconRight={<ArrowUpRight aria-hidden strokeWidth={2.25} />}
                className="w-fit"
              >
                <a
                  href="https://supabase.com/dashboard/new"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  Create a project
                  <span className="sr-only"> (opens in a new tab)</span>
                </a>
              </Button>
            </StepHikeCompact.Code>
          </StepHikeCompact.Step>
        ) : null}
        {/* without an agent, the run or create step comes before the framework */}
        {HAS_FRAMEWORKS ? (
          <StepHikeCompact.Step step={isAgent ? 2 : 3} title="Choose your framework">
            <StepHikeCompact.Details title="Choose your framework">
              <p className="m-0 text-sm text-foreground-light">
                {isAgent
                  ? 'Your agent sets up Supabase for the framework you choose.'
                  : 'Choose the framework your app uses.'}
              </p>
            </StepHikeCompact.Details>
            <StepHikeCompact.Code>
              <CodeTabs value={activeGroup.id} onValueChange={handleGroupChange}>
                {FRAMEWORK_GROUPS.map((group) => (
                  <TabPanel key={group.id} id={group.id} label={group.label}>
                    <div className="overflow-hidden rounded-lg border border-default bg-200">
                      <div className="flex flex-wrap items-center gap-2 px-3 py-3">
                        <ToggleGroup
                          type="single"
                          size="tiny"
                          allowDeselect={false}
                          aria-label="Framework"
                          value={choices.fw ?? ''}
                          onValueChange={handleFrameworkChange}
                          className="flex-wrap justify-start gap-x-6 gap-y-1"
                        >
                          {group.frameworks.map((item) => (
                            <ToggleGroupItem
                              key={item.slug}
                              value={item.slug}
                              className="cursor-pointer gap-1.5 px-0 hover:bg-transparent hover:text-foreground data-[state=on]:bg-transparent"
                            >
                              <span className="flex size-4 items-center justify-center [&_img]:w-4">
                                {item.slug === choices.fw ? (
                                  <FilledCheck shape="circle" />
                                ) : (
                                  <IconLinkImage
                                    path={item.icon}
                                    hasLightIcon={item.hasLightIcon}
                                  />
                                )}
                              </span>
                              {item.name}
                            </ToggleGroupItem>
                          ))}
                        </ToggleGroup>
                        {framework?.isCommunity ? <Badge>Community SDK</Badge> : null}
                      </div>
                    </div>
                  </TabPanel>
                ))}
              </CodeTabs>
            </StepHikeCompact.Code>
          </StepHikeCompact.Step>
        ) : null}
        {isAgent || !framework ? null : (
          <StepHikeCompact.Step step={4} title="Connect your app">
            <StepHikeCompact.Details title="Connect your app">
              <p className="m-0 text-sm text-foreground-light">
                {framework.install
                  ? `Install the client library, then follow the ${framework.name} quickstart.`
                  : framework.sdk === 'postgres'
                    ? `The ${framework.name} quickstart connects your app to Supabase with a Postgres connection string.`
                    : `The ${framework.name} quickstart covers installing the client library.`}
              </p>
            </StepHikeCompact.Details>
            <StepHikeCompact.Code>
              <div className="flex flex-col gap-4">
                {framework.install ? installCodes[framework.install] : null}
                <Button asChild variant="default" size="small" className="w-fit">
                  <Link href={framework.href} onClick={handleQuickstartClick}>
                    Follow the {framework.name} quickstart
                  </Link>
                </Button>
              </div>
            </StepHikeCompact.Code>
          </StepHikeCompact.Step>
        )}
        {isAgent ? (
          <StepHikeCompact.Step step={HAS_FRAMEWORKS ? 3 : 2} title="Add features">
            <StepHikeCompact.Details
              title={
                <span className="inline-flex items-center gap-2">
                  Add features
                  <Badge>Optional</Badge>
                </span>
              }
            >
              <p className="m-0 text-sm text-foreground-light">
                Choose the features your app needs. If you skip this step, your agent asks which
                features you need.
              </p>
            </StepHikeCompact.Details>
            <StepHikeCompact.Code>
              <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 @lg:grid-cols-2 @3xl:grid-cols-3">
                {/* the Supabase plugin from the prompt already bundles the MCP server */}
                {EXPLORE_ITEMS.filter((item) => item.id !== 'mcp').map((item) => (
                  <li key={item.id}>
                    <FeatureToggleCard
                      item={item}
                      isSelected={choices.features.includes(item.id)}
                      onFeatureToggle={handleFeatureToggle}
                    />
                  </li>
                ))}
              </ul>
            </StepHikeCompact.Code>
          </StepHikeCompact.Step>
        ) : null}
        {isAgent ? (
          <StepHikeCompact.Step
            step={HAS_FRAMEWORKS ? 4 : 3}
            title="Copy the prompt into your agent"
          >
            <StepHikeCompact.Details title="Copy the prompt into your agent">
              <p className="m-0 text-sm text-foreground-light">
                Your agent installs the Supabase CLI and the Supabase plugin, sets up a project,
                then connects your {framework ? `${framework.name} app` : 'app'}.
              </p>
            </StepHikeCompact.Details>
            <StepHikeCompact.Code>
              <AgentPrompt
                title="Setup Prompt"
                promptId="getting-started-setup"
                prompt={buildPrompt({ fw: choices.fw, features: choices.features })}
              />
            </StepHikeCompact.Code>
          </StepHikeCompact.Step>
        ) : null}
        {/* the quickstarts already end with the app reading data, so only the agent path needs this */}
        {isAgent ? (
          <StepHikeCompact.Step step={HAS_FRAMEWORKS ? 5 : 4} title="Check that it works">
            <StepHikeCompact.Details title="Check that it works">
              <p className="m-0 text-sm text-foreground-light">
                When your agent finishes, send this prompt. Your app reads a row from your project,
                so you can see the connection work.
              </p>
            </StepHikeCompact.Details>
            <StepHikeCompact.Code>
              <AgentPrompt
                title="Check Prompt"
                promptId="getting-started-verify"
                prompt={buildVerifyPrompt(choices.fw)}
              />
            </StepHikeCompact.Code>
          </StepHikeCompact.Step>
        ) : null}
      </StepHikeCompact>
      <section aria-labelledby="next-steps" className="flex flex-col gap-4">
        <h2 id="next-steps" className="m-0 text-xl text-foreground">
          Next steps
        </h2>
        <ul className="m-0 grid list-none grid-cols-1 gap-4 p-0 @lg:grid-cols-2 @3xl:grid-cols-3">
          {/* agent mode selects features in an earlier step, so these cards only link */}
          {isAgent
            ? getNextSteps(choices.fw).map((step) => (
                <li key={step.id}>
                  <LinkCard href={step.href} title={step.title} groupTitle="Next steps">
                    <FeatureCardBody item={{ name: step.title, description: step.description }} />
                  </LinkCard>
                </li>
              ))
            : EXPLORE_ITEMS.map((item) => (
                <li key={item.id}>
                  <ExploreCard item={item} />
                </li>
              ))}
        </ul>
      </section>
    </div>
  )
}

interface ExploreCardProps {
  item: ExploreItem
}

const ExploreCard = ({ item }: ExploreCardProps) => {
  const { shapeProps, motionHandlers } = useShapeMotion()
  const grainId = useId().replace(/[^a-zA-Z0-9_-]/g, '')

  return (
    <LinkCard
      href={item.href}
      title={item.name}
      groupTitle="Add features"
      motionHandlers={motionHandlers}
    >
      <span style={{ filter: `url(#${grainId})` }} className="flex">
        <svg aria-hidden className="absolute size-0">
          {/* srgb keeps the dark fill's color. the default linear rgb shifts it toward green */}
          <filter id={grainId} colorInterpolationFilters="sRGB">
            <feTurbulence type="fractalNoise" baseFrequency={1.1} numOctaves={1} seed={7} />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  2.4 0 0 0 -0.55"
              result="grain"
            />
            <feComposite in="SourceGraphic" in2="grain" operator="in" />
          </filter>
        </svg>
        <IsoShape
          name={item.shape}
          {...shapeProps}
          preserveAspectRatio="xMinYMid meet"
          className={cn(
            'h-20 w-28 fill-background-200 text-foreground-muted transition-colors group-hover/card:fill-background-surface-300',
            item.shapeClassName
          )}
        />
      </span>
      <FeatureCardBody item={item} />
    </LinkCard>
  )
}

interface LinkCardProps {
  href: string
  title: string
  groupTitle: string
  motionHandlers?: ShapeMotion['motionHandlers']
  children: ReactNode
}

const LinkCard = ({ href, title, groupTitle, motionHandlers, children }: LinkCardProps) => {
  const sendTelemetryEvent = useSendTelemetryEvent()
  const handleClick = () =>
    sendTelemetryEvent({
      action: 'docs_content_listing_clicked',
      properties: {
        targetPath: href,
        linkTitle: title,
        groupTitle,
        listingId: 'getting-started-stepper',
      },
    })

  return (
    <Link
      href={href}
      {...motionHandlers}
      onClick={handleClick}
      className="group/card block h-full rounded-lg focus-ring"
    >
      <NotchCard
        notch={
          <ArrowRight
            strokeWidth={2.25}
            className={cn(
              'size-3.5 -translate-x-7 transition-transform duration-200 ease-enter motion-reduce:transition-none',
              'group-hover/card:translate-x-px group-focus-visible/card:translate-x-px'
            )}
          />
        }
      >
        {children}
      </NotchCard>
    </Link>
  )
}

interface FeatureToggleCardProps {
  item: ExploreItem
  isSelected: boolean
  onFeatureToggle: (id: string) => void
}

const FeatureToggleCard = ({ item, isSelected, onFeatureToggle }: FeatureToggleCardProps) => {
  const handleClick = () => onFeatureToggle(item.id)

  return (
    <button
      type="button"
      tabIndex={0}
      aria-pressed={isSelected}
      onClick={handleClick}
      className="group/card block h-full w-full cursor-pointer rounded-lg text-left focus-ring"
    >
      <NotchCard
        notch={<ChoiceIndicator type="checkbox" isSelected={isSelected} />}
        isSelected={isSelected}
      >
        <FeatureCardBody item={item} />
      </NotchCard>
    </button>
  )
}

interface NotchCardProps {
  notch: ReactNode
  isSelected?: boolean
  children: ReactNode
}

const NotchCard = ({ notch, isSelected, children }: NotchCardProps) => (
  <span className="block h-full [&_.code-sample-source]:h-full [&_.codeblock-drop-shadow]:h-full [&_.shiki-wrapper]:my-0!">
    <SourceFrame
      notchWidth={40}
      footer={
        <span aria-hidden className={cn(SOURCE_FOOTER_CLASSES, 'justify-center overflow-hidden')}>
          {notch}
        </span>
      }
    >
      <span
        className={cn(
          'code-sample-surface flex h-full flex-col gap-4 rounded-lg border border-default p-5 transition-colors group-hover/card:bg-surface-300',
          isSelected ? 'bg-surface-300' : 'bg-200'
        )}
      >
        {children}
      </span>
    </SourceFrame>
  </span>
)

interface ChoiceIndicatorProps {
  type: 'checkbox' | 'radio'
  isSelected: boolean
}

const ChoiceIndicator = ({ type, isSelected }: ChoiceIndicatorProps) => {
  if (isSelected) return <FilledCheck shape={type === 'checkbox' ? 'square' : 'circle'} />
  return (
    <span
      className={cn(
        'size-4 border border-strong',
        type === 'checkbox' ? 'rounded-sm' : 'rounded-full'
      )}
    />
  )
}

interface FilledCheckProps {
  shape: 'circle' | 'square'
}

const FilledCheck = ({ shape }: FilledCheckProps) => (
  <span
    className={cn(
      'flex size-4 items-center justify-center bg-foreground text-background',
      shape === 'circle' ? 'rounded-full' : 'rounded-sm'
    )}
  >
    <Check strokeWidth={5} className="size-2" />
  </span>
)

interface FeatureCardBodyProps {
  item: Pick<ExploreItem, 'name' | 'description'>
}

const FeatureCardBody = ({ item }: FeatureCardBodyProps) => (
  <span className="flex flex-col gap-1">
    <span className="text-base text-foreground">{item.name}</span>
    <span className="pr-10 text-sm text-foreground-light">{item.description}</span>
  </span>
)

interface ShapeMotion {
  shapeProps: { yaw: number; activation: number; fluidStep: number }
  motionHandlers: {
    onPointerEnter: () => void
    onPointerLeave: () => void
    onFocus: () => void
    onBlur: () => void
  }
}

const useShapeMotion = (): ShapeMotion => {
  const yaw = useMotionValue(0)
  const activation = useMotionValue(0)
  const [renderedYaw, setRenderedYaw] = useState(0)
  const [renderedActivation, setRenderedActivation] = useState(0)
  const shouldReduceMotion = useReducedMotion()
  useMotionValueEvent(yaw, 'change', setRenderedYaw)
  useMotionValueEvent(activation, 'change', setRenderedActivation)

  const handleActivate = () => {
    animate(activation, 1, {
      duration: shouldReduceMotion ? 0 : ACTIVATE_DURATION_S,
      ease: 'easeOut',
    })
    if (shouldReduceMotion) return
    animate(yaw, yaw.get() + FULL_TURN, {
      duration: TURN_DURATION_S,
      ease: 'linear',
      repeat: Infinity,
    })
  }
  const handleDeactivate = () => {
    animate(activation, 0, {
      duration: shouldReduceMotion ? 0 : ACTIVATE_DURATION_S,
      ease: 'easeOut',
    })
    animate(yaw, Math.round(yaw.get() / FULL_TURN) * FULL_TURN, {
      duration: 0.6,
      ease: 'easeOut',
    })
  }

  return {
    shapeProps: {
      yaw: renderedYaw,
      activation: renderedActivation,
      // the glyphs move only while the shape turns
      // one glyph row each 200 ms, as on kb covers
      fluidStep: Math.floor(renderedYaw / (FULL_TURN / ((TURN_DURATION_S * 1000) / 200))),
    },
    motionHandlers: {
      onPointerEnter: handleActivate,
      onPointerLeave: handleDeactivate,
      onFocus: handleActivate,
      onBlur: handleDeactivate,
    },
  }
}

interface StartChoiceCardsProps {
  value: string
  onValueChange: (value: string) => void
}

// the radix primitive keeps arrow key movement between the cards
const StartChoiceCards = ({ value, onValueChange }: StartChoiceCardsProps) => (
  <RadioGroup.Root
    aria-label="Choose how to start"
    value={value}
    onValueChange={onValueChange}
    className="grid grid-cols-1 gap-4 @lg:grid-cols-3"
  >
    {START_OPTIONS.map((option) => (
      <RadioGroup.Item
        key={option.id}
        value={option.id}
        className="group/card block h-full w-full cursor-pointer rounded-lg text-left focus-ring"
      >
        <NotchCard
          notch={<ChoiceIndicator type="radio" isSelected={value === option.id} />}
          isSelected={value === option.id}
        >
          <FeatureCardBody item={{ name: option.label, description: option.description }} />
        </NotchCard>
      </RadioGroup.Item>
    ))}
  </RadioGroup.Root>
)

interface AgentPromptProps {
  title: string
  promptId: string
  prompt: string
}

const AgentPrompt = ({ title, promptId, prompt }: AgentPromptProps) => (
  <PromptPanel telemetry={{ source: 'guide', promptId }}>
    <Prompt value="prompt" expandable>
      <PromptTitle>{title}</PromptTitle>
      <PromptCopy>{prompt}</PromptCopy>
      <PromptContent>
        <PromptMarkdown>{prompt}</PromptMarkdown>
      </PromptContent>
    </Prompt>
  </PromptPanel>
)

// builds without framework quickstarts skip the framework step
const HAS_FRAMEWORKS = FRAMEWORK_GROUPS.length > 0
const FULL_TURN = Math.PI * 2
const TURN_DURATION_S = 2.4
const ACTIVATE_DURATION_S = 0.7

interface GettingStartedVariantSwitchProps {
  control: ReactNode
  children: ReactNode
}

interface GettingStartedStepperClientProps {
  localCommandsCode: ReactNode
  /** Highlighted install commands, keyed by command. */
  installCodes: Record<string, ReactNode>
}
