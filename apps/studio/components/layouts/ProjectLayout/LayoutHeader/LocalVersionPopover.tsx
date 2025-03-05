import dayjs from 'dayjs'

import { InlineLink } from 'components/ui/InlineLink'
import { useDockerHubStudioVersionsQuery } from 'data/misc/docker-hub-versions-query'
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
  PopoverTrigger_Shadcn_,
  SimpleCodeBlock,
  Tabs_Shadcn_,
  TabsContent_Shadcn_,
  TabsList_Shadcn_,
  TabsTrigger_Shadcn_,
} from 'ui'
import { Admonition } from 'ui-patterns'

export const LocalVersionPopover = () => {
  const { data } = useDockerHubStudioVersionsQuery()
  const hasLatestVersionCheck = !!data?.latest
  const isLatestVersion = data?.latest === STUDIO_VERSION

  const approximateNextRelease = !!data?.last_updated_at
    ? dayjs(data?.last_updated_at).utc().add(14, 'day').format('DD MMM YYYY')
    : undefined

  return (
    <Popover_Shadcn_ modal={false}>
      <PopoverTrigger_Shadcn_ className="flex items-center">
        <Badge variant={isLatestVersion ? 'default' : 'brand'}>
          {isLatestVersion ? 'Latest' : 'Update available'}
        </Badge>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ align="end" className="w-80">
        <p className="text-xs text-foreground-lighter">Studio version:</p>
        <div className="flex items-center gap-x-2">
          <p className="text-sm font-mono">{STUDIO_VERSION}</p>
          {hasLatestVersionCheck ? (
            isLatestVersion ? (
              <Badge variant="outline">Latest</Badge>
            ) : (
              <Badge variant="brand">Update available</Badge>
            )
          ) : null}
        </div>

        {hasLatestVersionCheck ? (
          !isLatestVersion ? (
            <div>
              <p className="text-xs my-2">
                A new version of Supabase Studio is available and can be updated via the CLI:
              </p>
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
          ) : null
        ) : null}

        <div className="flex flex-col gap-y-2 mt-3">
          <p className="text-xs text-foreground-lighter">
            All available image versions of Supabase Studio can be found on our{' '}
            <InlineLink href="https://hub.docker.com/r/supabase/studio/tags">Docker Hub</InlineLink>
            .
          </p>
        </div>

        <div className="flex items-center gap-x-2 mt-3">
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
                  <div className="flex items-center bg-surface-200 py-1 px-2 rounded mt-3">
                    <SimpleCodeBlock parentClassName="bg-surface-200">
                      npm i supabase@beta --save-dev
                    </SimpleCodeBlock>
                  </div>
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
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
