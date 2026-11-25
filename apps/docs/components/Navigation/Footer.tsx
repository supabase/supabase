import { linkCells, secondaryLinks } from '~/data/footer'
import Link from 'next/link'
import { IconDiscord, IconGitHubSolid, IconTwitterX, IconYoutubeSolid } from 'ui'
import { PrivacySettings, PrivacySettingsLabel } from 'ui-patterns/PrivacySettings'

interface FooterProps {
  className?: string
}

export const Footer = ({ className }: FooterProps) => {
  return (
    <footer className={className}>
      <ul className="grid grid-cols-1 divide-y border-y sm:grid-cols-3 sm:divide-x sm:divide-y-0">
        {linkCells.map((cell) => (
          <li key={cell.label} className="flex min-w-0">
            <a
              href={cell.url}
              target="_blank"
              rel="noreferrer noopener"
              className="group flex min-h-16 w-full items-center justify-center px-4 py-6 focus-inset sm:h-13.75 sm:min-h-0 sm:px-8 sm:py-0"
            >
              <span className="flex items-center gap-2">
                <span className="flex size-3.75 shrink-0 items-center justify-center text-foreground-lighter transition-colors duration-150 group-hover:text-foreground group-focus-visible:text-foreground">
                  {cell.icon ? (
                    <cell.icon aria-hidden strokeWidth={2} className="size-full" />
                  ) : (
                    <span className="size-2 rounded-xs bg-current" />
                  )}
                </span>
                <span className="text-xs font-medium text-foreground-light transition-colors duration-150 group-hover:text-foreground group-focus-visible:text-foreground">
                  {cell.label}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
      <div className="px-6 py-5">
        <FooterBottomRow />
      </div>
    </footer>
  )
}

export const FooterBottomRow = () => (
  <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
    <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3">
      <Link href="https://supabase.com/" className="text-xs text-foreground-lighter">
        &copy; Supabase Inc
      </Link>
      <span aria-hidden className="size-1 shrink-0 bg-foreground-muted" />
      <PrivacySettings className="text-left text-xs text-foreground-lighter hover:underline">
        <PrivacySettingsLabel />
      </PrivacySettings>
      {secondaryLinks.map((item) => (
        <Link
          href={item.url}
          key={item.url}
          className="text-xs text-foreground-lighter hover:underline"
        >
          {item.title}
        </Link>
      ))}
    </div>
    <div className="flex items-center gap-4">
      <a
        href="https://twitter.com/supabase"
        className="text-foreground-muted transition hover:text-foreground"
      >
        <span className="sr-only">Twitter</span>
        <IconTwitterX size={14} />
      </a>

      <a
        href="https://github.com/supabase"
        className="text-foreground-muted transition hover:text-foreground"
      >
        <span className="sr-only">GitHub</span>
        <IconGitHubSolid size={14} />
      </a>

      <a
        href="https://discord.supabase.com/"
        className="text-foreground-muted transition hover:text-foreground"
      >
        <span className="sr-only">Discord</span>
        <IconDiscord size={14} />
      </a>

      <a
        href="https://youtube.com/c/supabase"
        className="text-foreground-muted transition hover:text-foreground"
      >
        <span className="sr-only">Youtube</span>
        <IconYoutubeSolid size={14} />
      </a>
    </div>
  </div>
)
