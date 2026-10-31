export function SiteFooter() {
  return (
    <footer className="py-6 px-4 md:px-8 md:py-0 mx-auto w-full max-w-site">
      <div className="flex flex-col items-center justify-between gap-4 md:h-24 md:flex-row">
        <p className="text-balance text-center text-sm leading-loose text-foreground-muted md:text-left">
          Built by{' '}
          <a
            href="https://twitter.com/supabase"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4 hover:text-foreground-lighter"
          >
            Supabase
          </a>
          . The source code is available on{' '}
          <a
            href="https://github.com/supabase/supabase/tree/master/apps/ui-library"
            target="_blank"
            rel="noreferrer"
            className="font-medium underline underline-offset-4 hover:text-foreground-lighter"
          >
            GitHub
          </a>
          .
        </p>
      </div>
    </footer>
  )
}
