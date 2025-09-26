import { LOCAL_STORAGE_KEYS } from 'common'
import { useLocalStorageQuery } from 'hooks/misc/useLocalStorage'
import { DOCS_URL } from 'lib/constants'
import { X } from 'lucide-react'
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
  const [showBottomSection, setShowBottomSection] = useLocalStorageQuery(
    LOCAL_STORAGE_KEYS.LINTER_SHOW_FOOTER,
    true
  )

  if (!showBottomSection) {
    return null
  }

  return (
    <div className="px-6 py-6 flex gap-x-4 border-t relative">
      <Button
        className="absolute top-1.5 right-3 px-1.5"
        type="text"
        size="tiny"
        onClick={() => setShowBottomSection(false)}
      >
        <X size="14" />
      </Button>
      <div
        className={cn(hideDbInspectCTA ? 'w-[35%]' : 'w-[33%]', 'flex flex-col gap-y-1 text-sm')}
      >
        <p>Reset suggestions</p>
        <p className="text-xs text-foreground-light">
          Consider resetting the analysis after making any changes
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
            content={`The Supabase CLI comes with a range of tools to help inspect your Postgres instances for
            potential issues. [Learn more here](${DOCS_URL}/guides/database/inspect).`}
          />
        </div>
      )}
    </div>
  )
}

export { LinterPageFooter }
