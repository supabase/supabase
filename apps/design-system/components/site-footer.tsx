import { siteConfig } from '@/config/site'

export function SiteFooter() {
  return (
    <footer className="py-6 md:px-8 md:py-0 mx-auto border-r border-l border-b w-full max-w-site">
      <div className="flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-balance text-center text-sm leading-loose text-foreground-muted md:text-left">
          Built by{' '}
          <a
            href={siteConfig.links.twitter}
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4 hover:text-foreground-lighter"
          >
            Supabase
          </a>
          . The source code is available on{' '}
          <a
            href={siteConfig.links.github}
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4 hover:text-foreground-lighter"
          >
            GitHub
          </a>
          .
        </p>
        <p className="text-balance text-center text-sm leading-loose text-foreground-muted">
          Site inspired by{' '}
          <a
            href={siteConfig.links.credits.radix}
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4 hover:text-foreground-lighter"
          >
            Radix
          </a>
          ,{' '}
          <a
            href={siteConfig.links.credits.shadcn}
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4 hover:text-foreground-lighter"
          >
            shadcn/ui
          </a>{' '}
          and{' '}
          <a
            href={siteConfig.links.credits.geist}
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4 hover:text-foreground-lighter"
          >
            Geist
          </a>
          .
        </p>
      </div>
    </footer>
  )
}
