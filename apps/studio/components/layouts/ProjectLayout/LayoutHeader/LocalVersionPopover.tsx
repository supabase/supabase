import dayjs from 'dayjs'

import { DocsButton } from 'components/ui/DocsButton'
import { InlineLink } from 'components/ui/InlineLink'
import { useCLIReleaseVersionQuery } from 'data/misc/cli-release-version-query'
import { STUDIO_VERSION } from 'lib/constants'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogSection,
  DialogTitle,
  DialogTrigger,
  Popover_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverSeparator_Shadcn_,
  PopoverTrigger_Shadcn_,
  SimpleCodeBlock,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'

/**
 * TODO: Chat with Qiao how we can pass the CLI version into the env var for STUDIO_VERSION
 * Ideally we can also mark the beta version via STUDIO_VERSION too
 *
 */

export const LocalVersionPopover = () => {
  const { data, isSuccess } = useCLIReleaseVersionQuery()
  const hasLatestCLIVersion = isSuccess && !!data?.latest
  const isLatestVersion = data?.latest === STUDIO_VERSION

  // [Joshen] This is just scaffolding
  const isBeta = true ///(data?.latest ?? '').includes('beta')

  const approximateNextRelease = !!data?.published_at
    ? dayjs(data?.published_at).utc().add(14, 'day').format('DD MMM YYYY')
    : undefined

  if (!isSuccess) return null

  return (
    <Popover_Shadcn_>
      <PopoverTrigger_Shadcn_ className="flex items-center">
        <Badge variant={isBeta ? 'warning' : isLatestVersion ? 'default' : 'brand'}>
          {isBeta ? 'Beta' : isLatestVersion ? 'Latest' : 'Update available'}
        </Badge>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ align="end" className="w-80 px-0">
        {hasLatestCLIVersion ? (
          !isBeta && !isLatestVersion ? (
            <div className="px-4 mb-3">
              <p className="text-sm mb-2">A new version of Supabase CLI is available:</p>
              <Tabs_Shadcn_ defaultValue="macos">
                <TabsList_Shadcn_ className="mt-2">
                  <TabsTrigger_Shadcn_ className="px-2 text-xs" value="macos">
                    macOS
                  </TabsTrigger_Shadcn_>
                  <TabsTrigger_Shadcn_ className="px-2 text-xs" value="windows">
                    Windows
                  </TabsTrigger_Shadcn_>
                  <TabsTrigger_Shadcn_ className="px-2 text-xs" value="linux">
                    Linux
                  </TabsTrigger_Shadcn_>
                  <TabsTrigger_Shadcn_ className="px-2 text-xs" value="npm">
                    npm / Bun
                  </TabsTrigger_Shadcn_>
                </TabsList_Shadcn_>
                <TabsContent_Shadcn_ className="mt-2 text-xs" value="macos">
                  <SimpleCodeBlock parentClassName="bg-selection rounded !px-2">
                    brew upgrade supabase
                  </SimpleCodeBlock>
                </TabsContent_Shadcn_>
                <TabsContent_Shadcn_ className="mt-2 text-xs" value="windows">
                  <SimpleCodeBlock parentClassName="bg-selection rounded !px-2">
                    scoop upgrade supabase
                  </SimpleCodeBlock>
                </TabsContent_Shadcn_>
                <TabsContent_Shadcn_ className="mt-2 text-xs" value="linux">
                  <SimpleCodeBlock parentClassName="bg-selection rounded !px-2">
                    brew upgrade supabase
                  </SimpleCodeBlock>
                </TabsContent_Shadcn_>
                <TabsContent_Shadcn_ className="mt-2 text-xs" value="npm">
                  <SimpleCodeBlock parentClassName="bg-selection rounded !px-2">
                    npm update supabase --save-dev
                  </SimpleCodeBlock>
                </TabsContent_Shadcn_>
              </Tabs_Shadcn_>
            </div>
          ) : (
            <div className="px-4 mb-3">
              {isBeta ? (
                <p className="text-sm">You're on the Beta version of Supabase CLI</p>
              ) : (
                <p className="text-sm">You're on the latest version of Supabase CLI</p>
              )}
            </div>
          )
        ) : null}

        <div className="flex flex-col gap-y-2 px-4">
          <p className="text-xs text-foreground-lighter">
            All available release versions of the CLI can be found on our{' '}
            <InlineLink href="https://github.com/supabase/cli/releases">
              GitHub repository
            </InlineLink>
            .
          </p>
        </div>

        <div className="flex items-center gap-x-2 mt-3 px-4">
          <Dialog>
            <DialogTrigger asChild>
              <Button type="default">Release schedule</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader className="border-b">
                <DialogTitle>Stable release schedule</DialogTitle>
              </DialogHeader>
              <DialogSection className="flex flex-col gap-y-2">
                <p className="text-foreground-lighter text-xs font-mono uppercase">
                  Approximate next release: {approximateNextRelease}
                </p>
                <p className="text-sm">
                  Supabase CLI releases follows a 2 weeks cadence, which stable releases will be
                  available for{' '}
                  <InlineLink href="https://supabase.com/docs/guides/local-development/cli/getting-started?queryGroups=platform&platform=linux#updating-the-supabase-cli">
                    update
                  </InlineLink>{' '}
                  via the CLI.
                </p>
                <Admonition
                  type="default"
                  title="Beta Releases"
                  description="Beta releases are also available in between stable releases via the Beta version of the CLI if you might be waiting on a fix. If you'd like to try, we recommend doing so via npm:"
                >
                  <div className="flex items-center bg-surface-200 py-1 px-2 rounded mt-2">
                    <SimpleCodeBlock parentClassName="bg-surface-200">
                      npm i supabase@beta --save-dev
                    </SimpleCodeBlock>
                  </div>
                  <DocsButton
                    href="https://supabase.com/docs/guides/local-development/cli/getting-started?queryGroups=platform&platform=linux#using-beta-version"
                    className="!no-underline mt-2"
                  />
                </Admonition>
              </DialogSection>
            </DialogContent>
          </Dialog>
          <Button type="default" asChild>
            <a
              target="_blank"
              rel="noreferrer noopener"
              href="https://supabase.com/docs/guides/local-development/cli/getting-started?queryGroups=platform&platform=linux"
            >
              CLI Docs
            </a>
          </Button>
        </div>
        <PopoverSeparator_Shadcn_ className="my-4" />
        <div className="flex items-center gap-x-4 px-4">
          <div className="flex flex-col gap-y-1">
            <p className="text-xs">Current version:</p>
            <p className="text-sm font-mono">{STUDIO_VERSION}</p>
          </div>
          {hasLatestCLIVersion && !isLatestVersion && !isBeta && (
            <div className="flex flex-col gap-y-1">
              <p className="text-xs">Available version:</p>
              <p className="text-sm font-mono">{data.latest}</p>
            </div>
          )}
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
