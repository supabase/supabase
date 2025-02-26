import { InlineLink } from 'components/ui/InlineLink'
import { useDockerHubStudioVersionsQuery } from 'data/misc/docker-hub-versions-query'
import { STUDIO_VERSION } from 'lib/constants'
import { Badge, Button, Popover_Shadcn_, PopoverContent_Shadcn_, PopoverTrigger_Shadcn_ } from 'ui'

export const LocalVersionPopover = () => {
  const version = STUDIO_VERSION

  const { data } = useDockerHubStudioVersionsQuery()
  const hasLatestVersionCheck = !!data?.latest
  const isLatestVersion = data?.latest === version

  return (
    <Popover_Shadcn_ modal={false}>
      <PopoverTrigger_Shadcn_ asChild>
        <Button type="text">{version}</Button>
      </PopoverTrigger_Shadcn_>
      <PopoverContent_Shadcn_ align="start" className="w-80">
        <p className="text-xs text-foreground-lighter">Studio version:</p>
        <div className="flex items-center gap-x-2">
          <p className="text-sm font-mono">{version}</p>
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
            <p className="text-xs mt-2">
              A new version of Supabase Studio is available and can be used via the Beta version of
              the CLI
            </p>
          ) : null
        ) : null}

        <div className="flex flex-col gap-y-2 mt-2">
          <p className="text-xs text-foreground-lighter">
            All available image versions of Supabase Studio can be found on our{' '}
            <InlineLink href="https://hub.docker.com/r/supabase/studio/tags">Docker Hub</InlineLink>
            .
          </p>
        </div>
      </PopoverContent_Shadcn_>
    </Popover_Shadcn_>
  )
}
