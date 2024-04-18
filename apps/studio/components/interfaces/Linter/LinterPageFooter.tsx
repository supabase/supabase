import { Button } from 'ui'
import { Markdown } from '../Markdown'

interface LinterPageFooterProps {
  isLoading: boolean
  isRefetching: boolean
  refetch: () => void
}

const LinterPageFooter = ({ isLoading, isRefetching, refetch }: LinterPageFooterProps) => {
  return (
    <div className="px-6 py-6 flex gap-x-4 border-t ">
      <div className="w-[35%] flex flex-col gap-y-1 text-sm">
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
      <div className="w-[35%] flex flex-col gap-y-1 text-sm">
        <p>How are these suggestions generated?</p>
        <Markdown
          className="text-xs"
          content="These suggestions use [splinter (Supabase Postgres LINTER)](https://github.com/supabase/splinter)."
        />
      </div>
    </div>
  )
}

export default LinterPageFooter
