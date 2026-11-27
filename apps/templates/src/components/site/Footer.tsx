import { CheckCircle, FlaskConical, LifeBuoy } from 'lucide-react'
import { IconDiscord, IconGitHubSolid, IconTwitterX, IconYoutubeSolid } from 'ui'

import { PrivacySettingsLink } from './PrivacySettingsLink'

// Mirrors apps/kb/src/components/Footer.astro

const primaryLinks = [
  {
    Icon: LifeBuoy,
    text: 'Need some help?',
    ctaLabel: 'Contact support',
    url: 'https://supabase.com/support',
  },
  {
    Icon: FlaskConical,
    text: 'Latest product updates?',
    ctaLabel: 'See Changelog',
    url: 'https://supabase.com/changelog',
  },
  {
    Icon: CheckCircle,
    text: "Something's not right?",
    ctaLabel: 'Check system status',
    url: 'https://status.supabase.com/',
  },
]

const secondaryLinks = [
  { title: 'Open Source', url: 'https://supabase.com/open-source' },
  { title: 'SupaSquad', url: 'https://supabase.com/open-source/contributing/supasquad' },
  { title: 'Privacy', url: 'https://supabase.com/privacy' },
]

const socialLinks = [
  { label: 'Twitter', url: 'https://twitter.com/supabase', Icon: IconTwitterX },
  { label: 'GitHub', url: 'https://github.com/supabase', Icon: IconGitHubSolid },
  { label: 'Discord', url: 'https://discord.supabase.com/', Icon: IconDiscord },
  { label: 'Youtube', url: 'https://youtube.com/c/supabase', Icon: IconYoutubeSolid },
]

export function Footer() {
  return (
    <footer aria-label="footer" className="section-container pb-6 pt-12">
      <ul className="flex flex-col gap-2">
        {primaryLinks.map(({ Icon, text, ctaLabel, url }) => (
          <li key={url} className="flex items-center gap-1 text-xs text-foreground-lighter">
            <Icon aria-hidden size={16} strokeWidth={1} />
            <p>{text}</p>
            <a
              href={url}
              className="text-brand-600 hover:underline"
              target="_blank"
              rel="noreferrer noopener"
            >
              {ctaLabel}
            </a>
          </li>
        ))}
      </ul>
      <hr className="my-6 border-default" />
      <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-3">
        <div className="flex min-w-0 flex-wrap items-center gap-x-4 gap-y-3">
          <a href="https://supabase.com/" className="text-xs text-foreground-lighter">
            &copy; Supabase Inc
          </a>
          <span className="text-xs text-foreground-lighter">—</span>
          <PrivacySettingsLink />
          {secondaryLinks.map(({ title, url }) => (
            <a key={url} href={url} className="text-xs text-foreground-lighter hover:underline">
              {title}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-4">
          {socialLinks.map(({ label, url, Icon }) => (
            <a
              key={url}
              href={url}
              className="text-foreground-muted transition hover:text-foreground"
            >
              <span className="sr-only">{label}</span>
              <Icon size={14} />
            </a>
          ))}
        </div>
      </div>
    </footer>
  )
}
