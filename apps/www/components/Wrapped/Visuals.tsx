import { ComponentProps } from 'react'

export const Stripes = () => (
  <div
    className="flex-grow absolute inset-0"
    style={{
      backgroundImage: `repeating-linear-gradient(
        45deg,
        hsl(var(--border-muted)) 0px,
        hsl(var(--border-muted)) 1px,
        transparent 1px,
        transparent 8px
      )`,
    }}
  />
)

export const Dots = () => (
  <div
    className="h-full w-full absolute inset-0 bg-foreground-muted dark:bg-muted"
    style={{
      maskImage: 'url("/images/state-of-startups/pattern-stipple.svg")',
      maskSize: '4px',
      maskRepeat: 'repeat',
      maskPosition: 'center',
    }}
  />
)

export const Android = (props: ComponentProps<'svg'>) => (
  <svg fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" {...props}>
    <path
      d="M2 5h2v2H2V5zm4 4H4V7h2v2zm2 0H6v2H4v2H2v6h20v-6h-2v-2h-2V9h2V7h2V5h-2v2h-2v2h-2V7H8v2zm0 0h8v2h2v2h2v4H4v-4h2v-2h2V9zm2 4H8v2h2v-2zm4 0h2v2h-2v-2z"
      fill="currentColor"
    />
  </svg>
)
