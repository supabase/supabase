'use client'

import {
  Prompt,
  PromptContent,
  PromptCopy,
  PromptPanel,
  PromptTitle,
} from '~/features/ui/PromptPanel'
import { isFeatureEnabled } from 'common'
import { Sparkles, Terminal } from 'lucide-react'
import { type ReactNode } from 'react'

import { getCustomContent } from '../lib/custom-content/getCustomContent'
import DocsCoverLogo from './DocsCoverLogo'
import { setupCommand, setupCommands, setupPrompt } from './HomePageCover.constants'

const fullGettingStartedEnabled = isFeatureEnabled('docs:full_getting_started')

function SetupPrompt({ cliCode }: { cliCode: ReactNode }) {
  return (
    <PromptPanel>
      <Prompt value="prompt" expandable>
        <PromptTitle icon={<Sparkles />}>AI Prompt</PromptTitle>
        <PromptCopy>{setupPrompt}</PromptCopy>
        <PromptContent>
          Help me get set up with Supabase. Do the following: 1. Install the Supabase CLI globally
          with{' '}
          <code className="shimmer-none rounded bg-surface-200 px-1 py-0.5 font-mono text-xs text-foreground">
            {setupCommand.installCli}
          </code>
          . 2. Install the Supabase Plugin with{' '}
          <code className="shimmer-none rounded bg-surface-200 px-1 py-0.5 font-mono text-xs text-foreground">
            {setupCommand.installPlugin}
          </code>
          . 3. Review my project and determine whether Supabase is already initialized. If it is not
          initialized, run{' '}
          <code className="shimmer-none rounded bg-surface-200 px-1 py-0.5 font-mono text-xs text-foreground">
            {setupCommand.initialize}
          </code>
          . 4. Suggest the most relevant next steps.
        </PromptContent>
      </Prompt>
      <Prompt value="cli">
        <PromptTitle icon={<Terminal />}>CLI</PromptTitle>
        <PromptCopy>{setupCommands}</PromptCopy>
        <PromptContent shimmer={false}>{cliCode}</PromptContent>
      </Prompt>
    </PromptPanel>
  )
}

const HomePageCover = ({ title, cliCode }: { title: string; cliCode: ReactNode }) => {
  const { homepageHeading } = getCustomContent(['homepage:heading'])

  return (
    <div className="w-full border-b bg-muted/10">
      <div className="mx-auto max-w-7xl px-6 py-16">
        <div className="flex flex-col items-start gap-10 xl:flex-row xl:items-center xl:gap-16">
          <div className="flex w-full flex-1 flex-col gap-4 sm:flex-row sm:items-center sm:gap-8">
            <DocsCoverLogo aria-hidden="true" className="w-[60px] shrink-0 md:w-[100px]" />
            <div className="flex min-w-0 flex-col">
              <h1 className="m-0 text-4xl text-foreground">{homepageHeading || title}</h1>
              <p className="m-0 mt-3 text-xl leading-7 text-foreground-light">
                Learn how to get up and running with Supabase through tutorials, APIs and platform
                resources.
              </p>
            </div>
          </div>
          {fullGettingStartedEnabled && (
            <div className="w-full max-w-xl xl:max-w-[478px] xl:shrink-0">
              <SetupPrompt cliCode={cliCode} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HomePageCover
