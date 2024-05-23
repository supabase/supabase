'use client'

import * as React from 'react'
import { DropdownMenuTriggerProps } from '@radix-ui/react-dropdown-menu'

// import { NpmCommands } from 'types/unist'

// import { Event, trackEvent } from '@/lib/events'
import { cn } from 'ui'
import { Button } from 'ui'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'ui'
import { Check, Copy } from 'lucide-react'

interface CopyButtonProps extends React.HTMLAttributes<HTMLButtonElement> {
  value: string
  src?: string
  //   event?: Event['name']
}

export async function copyToClipboardWithMeta(
  value: string
  // event?: Event
) {
  navigator.clipboard.writeText(value)
  if (event) {
    // trackEvent(event)
  }
}

export function CopyButton({
  value,
  className,
  src,
  // event,
  ...props
}: CopyButtonProps) {
  const [hasCopied, setHasCopied] = React.useState(false)

  React.useEffect(() => {
    setTimeout(() => {
      setHasCopied(false)
    }, 2000)
  }, [hasCopied])

  return (
    <Button
      size="small"
      type="outline"
      className={cn(
        'relative z-10 h-6 w-6 text-foreground-muted hover:bg-surface-100 hover:text-foreground p-0',
        className
      )}
      onClick={() => {
        copyToClipboardWithMeta(
          value
          //   event
          //     ? {
          //         name: event,
          //         properties: {
          //           code: value,
          //         },
          //       }
          //     : undefined
        )
        setHasCopied(true)
      }}
      {...props}
    >
      <span className="sr-only">Copy</span>
      {hasCopied ? <Check className="h-3 w-3 text-brand-600" /> : <Copy className="h-3 w-3" />}
    </Button>
  )
}

interface CopyWithClassNamesProps extends DropdownMenuTriggerProps {
  value: string
  classNames: string
  className?: string
}

export function CopyWithClassNames({
  value,
  classNames,
  className,
  ...props
}: CopyWithClassNamesProps) {
  const [hasCopied, setHasCopied] = React.useState(false)

  React.useEffect(() => {
    setTimeout(() => {
      setHasCopied(false)
    }, 2000)
  }, [hasCopied])

  const copyToClipboard = React.useCallback((value: string) => {
    copyToClipboardWithMeta(value)
    setHasCopied(true)
  }, [])

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          size="small"
          type="outline"
          className={cn(
            'relative z-10 h-6 w-6 text-zinc-50 hover:bg-zinc-700 hover:text-zinc-50',
            className
          )}
        >
          {hasCopied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          <span className="sr-only">Copy</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={() => copyToClipboard(value)}>Component</DropdownMenuItem>
        <DropdownMenuItem onClick={() => copyToClipboard(classNames)}>Classname</DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

interface CopyNpmCommandButtonProps extends DropdownMenuTriggerProps {
  //   commands: Required<NpmCommands>
}

// export function CopyNpmCommandButton({ commands, className, ...props }: CopyNpmCommandButtonProps) {
//   const [hasCopied, setHasCopied] = React.useState(false)

//   React.useEffect(() => {
//     setTimeout(() => {
//       setHasCopied(false)
//     }, 2000)
//   }, [hasCopied])

//   //   const copyCommand = React.useCallback((value: string, pm: 'npm' | 'pnpm' | 'yarn' | 'bun') => {
//   //     copyToClipboardWithMeta(value,
//   //     //     {
//   //     //   name: 'copy_npm_command',
//   //     //   properties: {
//   //     //     command: value,
//   //     //     pm,
//   //     //   },
//   //     })
//   //     setHasCopied(true)
//   //   }, [])

//   return (
//     <DropdownMenu>
//       <DropdownMenuTrigger asChild>
//         <Button
//           //   size="icon"
//           type="outline"
//           className={cn(
//             'relative z-10 h-6 w-6 text-zinc-50 hover:bg-zinc-700 hover:text-zinc-50',
//             className
//           )}
//         >
//           {hasCopied ? <CheckIcon className="h-3 w-3" /> : <CopyIcon className="h-3 w-3" />}
//           <span className="sr-only">Copy</span>
//         </Button>
//       </DropdownMenuTrigger>
//       <DropdownMenuContent align="end">
//         <DropdownMenuItem onClick={() => copyCommand(commands.__npmCommand__, 'npm')}>
//           npm
//         </DropdownMenuItem>
//         <DropdownMenuItem onClick={() => copyCommand(commands.__yarnCommand__, 'yarn')}>
//           yarn
//         </DropdownMenuItem>
//         <DropdownMenuItem onClick={() => copyCommand(commands.__pnpmCommand__, 'pnpm')}>
//           pnpm
//         </DropdownMenuItem>
//         <DropdownMenuItem onClick={() => copyCommand(commands.__bunCommand__, 'bun')}>
//           bun
//         </DropdownMenuItem>
//       </DropdownMenuContent>
//     </DropdownMenu>
//   )
// }
