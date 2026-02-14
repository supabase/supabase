import Link from 'next/link'
import { Button, cn, IconDiscord, IconGitHubSolid, IconTwitterX, IconYoutubeSolid } from 'ui'
import { primaryLinks, secondaryLinks } from '~/data/footer'
import { LayoutMainContent } from '~/layouts/DefaultLayout'

const Footer = ({ className }: { className?: string }) => (
  <LayoutMainContent className={cn('pt-0', className)}>
    <footer role="contentinfo" aria-label="footer">
      <div className="mt-16">
        <ul className="flex flex-col gap-2">
          {primaryLinks.map(({ url, featherIcon: Icon, text, ctaLabel }) => (
            <li key={url} className="flex items-center gap-1 text-xs text-foreground-lighter">
              {Icon && <Icon aria-hidden="true" size={16} strokeWidth={1} />}
              <p>{text}</p>
              <Link
                href={url}
                className="text-brand-link hover:underline"
                target="_blank"
                rel="noreferrer noopener"
              >
                {ctaLabel}
              </Link>
            </li>
          ))}
        </ul>
      </div>
      <hr className="border-default my-6"></hr>
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
                <Component
                  key={item.title}
                  className="text-xs text-foreground-lighter hover:underline"
                >
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
    </footer>
  </LayoutMainContent>
)

export default Footer
