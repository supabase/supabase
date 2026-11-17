'use client'

import { Check, ChevronDown } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from 'ui'

import { componentPages, frameworkTitles, oauthBlocks } from '@/config/docs'
import { useFramework } from '@/context/framework-context'

const frameworks = Object.keys(frameworkTitles)

export function FrameworkSelector() {
  const pathname = usePathname()

  // Extract framework and docTitle from pathname
  // Example: /ui/docs/nextjs/password-based-auth
  const pathParts = pathname.split('/')
  const docTitle = pathParts[pathParts.length - 1]
  const framework = pathParts[pathParts.length - 2]

  const { setFramework: setPreferredFramework } = useFramework()
  const selectedFramework = frameworks.includes(framework) ? framework : 'nextjs'

  if (!framework) {
    return null
  }

  // Get the supported frameworks for this component
  const componentItem = [...componentPages.items, ...oauthBlocks.items].find(
    (item) => item.href?.split('/').pop() === docTitle.toLowerCase()
  )
  // Use the supportedFrameworks property if it exists, otherwise default to all frameworks
  const supportedFrameworks = componentItem?.supportedFrameworks

  if (!supportedFrameworks) {
    return null
  }

  // Don't show selector if component only supports one framework
  if (supportedFrameworks && supportedFrameworks.length <= 1) {
    return null
  }

  // Build the URL for a framework by swapping the framework segment (second to last)
  const getFrameworkHref = (value: string) => {
    const parts = [...pathParts]
    parts[parts.length - 2] = value
    return parts.join('/')
  }

  const options =
    supportedFrameworks?.map((f) => ({
      label: frameworkTitles[f],
      value: f,
    })) || []

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        aria-label="Framework"
        className="flex h-7 min-w-28 cursor-pointer items-center justify-between gap-2 rounded-md border-0 bg-surface-75 px-2 text-left text-xs ring-border-control transition-colors duration-200 focus-ring control-surface-shadows raised-control-surface"
      >
        <span className="truncate">{frameworkTitles[selectedFramework]}</span>
        <ChevronDown className="h-4 w-4 shrink-0 text-foreground-lighter" strokeWidth={1.5} />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="start">
        {options.map((f) => (
          <DropdownMenuItem key={f.value} asChild inset>
            <Link
              href={getFrameworkHref(f.value)}
              aria-current={f.value === selectedFramework ? 'page' : undefined}
              onClick={() => setPreferredFramework(f.value as keyof typeof frameworkTitles)}
            >
              {f.value === selectedFramework && (
                <Check className="absolute left-2 h-4 w-4" strokeWidth={1.5} aria-hidden />
              )}
              {f.label}
            </Link>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
