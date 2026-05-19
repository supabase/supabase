import type { PropsWithChildren } from 'react'
import {
  Button,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuTrigger,
} from 'ui'

export const isTemporaryConnectMockPreviewEnabled = () => {
  if (process.env.NEXT_PUBLIC_ENVIRONMENT !== 'prod') return true
  if (typeof window === 'undefined') return false

  return window.location.hostname.endsWith('.vercel.app')
}

export const getConnectMockState = <TState extends string>(
  value: unknown,
  states: readonly TState[]
): TState | undefined => {
  return typeof value === 'string' && states.includes(value as TState)
    ? (value as TState)
    : undefined
}

export const ConnectPreviewToolbar = ({ children }: PropsWithChildren) => (
  <div className="fixed right-3 top-3 z-50 flex items-center gap-2">{children}</div>
)

export const ConnectMockMenu = <TState extends string>({
  state,
  states,
  onSelect,
  width = 'w-[220px]',
}: {
  state: TState
  states: readonly TState[]
  onSelect: (state: TState) => void
  width?: string
}) => (
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button type="warning" size="tiny" className="font-mono">
        mock: {state}
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent align="end" className={width}>
      <DropdownMenuRadioGroup value={state} onValueChange={(value) => onSelect(value as TState)}>
        {states.map((item) => (
          <DropdownMenuRadioItem key={item} value={item} className="font-mono text-xs">
            {item}
          </DropdownMenuRadioItem>
        ))}
      </DropdownMenuRadioGroup>
    </DropdownMenuContent>
  </DropdownMenu>
)
