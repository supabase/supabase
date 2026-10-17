import { useTheme } from 'next-themes'
import { parseAsBoolean, parseAsString, useQueryStates } from 'nuqs'
import { ConnectionIcon } from 'ui-patterns/McpUrlBuilder/components/ConnectionIcon'

export const AssistantAgentHarnessFooter = () => {
  const { resolvedTheme } = useTheme()
  const theme = resolvedTheme === 'dark' ? 'dark' : 'light'
  const [, setConnectParams] = useQueryStates({
    showConnect: parseAsBoolean.withDefault(false),
    connectTab: parseAsString,
  })

  return (
    <div className="mx-3">
      <button
        type="button"
        tabIndex={0}
        className="flex w-full shrink-0 cursor-pointer items-center justify-between gap-3 overflow-hidden rounded-b-lg border-x border-b bg-surface-100 py-2 pr-2 pl-3 text-left text-xs text-foreground-light shadow-xs transition-colors hover:bg-surface-200 hover:border-default"
        onClick={() => setConnectParams({ showConnect: true, connectTab: 'mcp' })}
      >
        <span className="min-w-0 flex-1">Use your own agent</span>
        <span className="flex shrink-0 items-center gap-3" aria-hidden="true">
          <ConnectionIcon connection="claude" theme={theme} />
          <ConnectionIcon connection="openai" theme={theme} hasDistinctDarkIcon />
          <ConnectionIcon connection="cursor" theme={theme} hasDistinctDarkIcon />
        </span>
      </button>
    </div>
  )
}
