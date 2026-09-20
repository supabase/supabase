'use client'

import {
  Prompt,
  PromptContent,
  PromptCopy,
  PromptMarkdown,
  PromptPanel,
  PromptTitle,
} from '~/features/ui/PromptPanel'
import { isFeatureEnabled } from 'common'
import { type ReactNode } from 'react'

import { getCustomContent } from '../lib/custom-content/getCustomContent'
import DocsCoverLogo from './DocsCoverLogo'
import { setupCommands, setupPrompt } from './HomePageCover.constants'

const fullGettingStartedEnabled = isFeatureEnabled('docs:full_getting_started')

function SetupPrompt({ cliCode }: { cliCode: ReactNode }) {
  return (
    <PromptPanel telemetry={{ source: 'homepage' }}>
      <Prompt value="prompt" expandable>
        <PromptTitle>Agent Prompt</PromptTitle>
        <PromptCopy>{setupPrompt}</PromptCopy>
        <PromptContent>
          <PromptMarkdown>{setupPrompt}</PromptMarkdown>
        </PromptContent>
      </Prompt>
      <Prompt value="cli">
        <PromptTitle>CLI</PromptTitle>
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
        <div className="flex flex-col gap-10 lg:flex-row lg:items-start lg:gap-12 xl:gap-16">
          <div className="flex w-full min-w-0 flex-1 items-center gap-4 sm:gap-8 mt-10">
            <DocsCoverLogo aria-hidden="true" className="w-12 shrink-0 sm:w-[60px] md:w-[100px]" />
            <div className="flex min-w-0 flex-col">
              <h1 className="m-0 text-3xl text-foreground sm:text-4xl">
                {homepageHeading || title}
              </h1>
              <p className="m-0 mt-2 text-base leading-7 text-foreground-light sm:mt-3 sm:text-xl">
                Learn how to get up and running with Supabase through tutorials, APIs and platform
                resources.
              </p>
            </div>
          </div>
          {fullGettingStartedEnabled && (
            <div className="w-full lg:max-w-[478px] lg:shrink-0">
              <SetupPrompt cliCode={cliCode} />
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default HomePageCover
