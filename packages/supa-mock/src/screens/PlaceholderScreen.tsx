import { useMockRouter } from '../router/MockRouterContext'

export function PlaceholderScreen() {
  const { currentPath } = useMockRouter()

  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8">
      <div className="rounded-lg border bg-surface-100 p-8 text-center">
        <p className="text-sm text-foreground-lighter font-mono mb-2">{currentPath}</p>
        <p className="text-foreground-light text-sm">This screen is not yet implemented</p>
      </div>
    </div>
  )
}
