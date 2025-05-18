import { Button, cn } from 'ui'
import { Markdown } from '../Markdown'

interface LinterPageFooterProps {
  isLoading: boolean
  isRefetching: boolean
  refetch: () => void
  hideDbInspectCTA?: boolean
}

const LinterPageFooter = ({
  isLoading,
  isRefetching,
  refetch,
  hideDbInspectCTA,
}: LinterPageFooterProps) => {
  return (
    <div className="px-6 py-6 flex gap-x-4 border-t ">
      <div
        className={cn(hideDbInspectCTA ? 'w-[35%]' : 'w-[33%]', 'flex flex-col gap-y-1 text-sm')}
      >
        <p>Reset suggestions</p>
        <p className="text-xs text-foreground-light">
          Consider resetting the analysis making any changes
        </p>

        <Button
          type="default"
          className="!mt-3 w-min"
          disabled={isLoading || isRefetching}
          loading={isLoading || isRefetching}
          onClick={() => refetch()}
        >
          Rerun linter
        </Button>
      </div>

      <div
        className={cn(hideDbInspectCTA ? 'w-[35%]' : 'w-[33%]', 'flex flex-col gap-y-1 text-sm')}
      >
        <p>How are these suggestions generated?</p>
        <div className="prose text-xs">
          <p>
            <span>These suggestions use </span>
            <a href="https://github.com/supabase/splinter" target="" rel="">
              splinter (Supabase Postgres LINTER)
            </a>
            .
          </p>
        </div>
      </div>

      {!hideDbInspectCTA && (
        <div className="w-[33%] flex flex-col gap-y-1 text-sm">
          <p>Inspect your database for potential issues</p>
          <Markdown
            className="text-xs"
            content="The Supabase CLI comes with a range of tools to help inspect your Postgres instances for
            potential issues. [Learn more here](https://supabase.com/docs/guides/database/inspect)."
          />
        </div>
      )}
    </div>
  )
}

export default LinterPageFooter
