import { MessagesSquare, ScrollText } from 'lucide-react'
import Link from 'next/link'
import type { ReactNode } from 'react'
import { cn, IconDiscord, IconGitHubSolid, IconTwitterX, IconYoutubeSolid } from 'ui'
import { secondaryLinks } from '~/data/footer'
import { LayoutMainContent } from '~/layouts/DefaultLayout'

interface FooterProps {
  className?: string
}

interface FooterCell {
  label: string
  href: string
  indicator: ReactNode
}

const FOOTER_CELLS: FooterCell[] = [
  {
    label: 'System status',
    href: 'https://status.supabase.com',
    indicator: <span className="size-2 rounded-xs bg-current" />,
  },
  {
    label: 'Product updates',
    href: 'https://supabase.com/changelog',
    indicator: <ScrollText aria-hidden strokeWidth={2} className="size-full" />,
  },
  {
    label: 'Contact support',
    href: 'https://supabase.com/support',
    indicator: <MessagesSquare aria-hidden strokeWidth={2} className="size-full" />,
  },
]

export const Footer = ({ className }: FooterProps) => {
  return (
    <footer role="contentinfo" aria-label="footer" className={cn('mt-16', className)}>
      <ul className="grid grid-cols-1 divide-y border-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {FOOTER_CELLS.map((cell) => (
          <li key={cell.label} className="flex min-w-0">
            <a
              href={cell.href}
              target="_blank"
              rel="noreferrer noopener"
              className="group flex min-h-16 w-full items-center justify-center px-4 py-6 focus-ring sm:h-13.75 sm:min-h-0 sm:px-8 sm:py-0"
            >
              <span className="flex items-center gap-2">
                <span className="flex size-3.75 shrink-0 items-center justify-center text-foreground-lighter transition-colors duration-150 group-hover:text-foreground group-focus-visible:text-foreground">
                  {cell.indicator}
                </span>
                <span className="text-xs font-medium text-foreground-light transition-colors duration-150 group-hover:text-foreground">
                  {cell.label}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      <LayoutMainContent className="mx-0 max-w-none pt-6">
        <FooterBottomRow />
      </LayoutMainContent>
    </footer>
  )
}

export const FooterBottomRow = () => (
  <div className="flex gap-4 items-center justify-between">
    <div className="flex flex-col lg:flex-row gap-3 ">
      <Link href="https://supabase.com/" className="text-xs text-foreground-lighter">
        &copy; Supabase Inc
      </Link>
      <span className="text-xs text-foreground-lighter">—</span>
      {secondaryLinks.map(({ component: Component, ...item }) =>
        item.url ? (
          <Link
            href={item.url}
            key={item.url}
            className="text-xs text-foreground-lighter hover:underline"
          >
            {item.title}
          </Link>
        ) : (
          Component && (
            <Component key={item.title} className="text-xs text-foreground-lighter hover:underline">
              {item.title}
            </Component>
          )
        )
      )}
    </div>
    <div className="flex items-center gap-4">
      <a
        href="https://twitter.com/supabase"
        className="text-foreground-muted hover:text-foreground transition"
      >
        <span className="sr-only">Twitter</span>
        <IconTwitterX size={14} />
      </a>

      <a
        href="https://github.com/supabase"
        className="text-foreground-muted hover:text-foreground transition"
      >
        <span className="sr-only">GitHub</span>
        <IconGitHubSolid size={14} />
      </a>

      <a
        href="https://discord.supabase.com/"
        className="text-foreground-muted hover:text-foreground transition"
      >
        <span className="sr-only">Discord</span>
        <IconDiscord size={14} />
      </a>

      <a
        href="https://youtube.com/c/supabase"
        className="text-foreground-muted hover:text-foreground transition"
      >
        <span className="sr-only">Youtube</span>
        <IconYoutubeSolid size={14} />
      </a>
    </div>
  </div>
)
