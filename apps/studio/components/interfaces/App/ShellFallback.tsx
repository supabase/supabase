import { LogoLoader } from 'ui'

import { IS_PLATFORM } from '@/lib/constants'

// Baked into the prerendered SPA shell (_shell.html) — this is the static HTML
// shown on every cold load until the JS bundle hydrates, so nothing here can
// rely on JS: the loader animation, the 7s stuck-load help reveal, and the
// noscript message are all pure CSS/HTML.
export function ShellFallback() {
  return (
    <>
      <style>{`
        /* visibility (not just opacity) so the text is also hidden from
           screen readers until the reveal. */
        #studio-shell-help {
          visibility: hidden;
          opacity: 0;
          animation: studio-shell-help-reveal 0.3s ease-out 7s forwards;
        }
        @keyframes studio-shell-help-reveal {
          to {
            visibility: visible;
            opacity: 1;
          }
        }
      `}</style>
      <div
        id="studio-shell-loader"
        className="fixed inset-0 flex flex-col items-center justify-center gap-8 p-4"
      >
        {/* LogoLoader fills its parent, so give it a fixed-height box — otherwise
            it stretches to the full column and pushes the help text offscreen. */}
        <div className="h-[62px] w-full">
          <LogoLoader />
        </div>
        {/* data-nosnippet keeps Google from surfacing this boilerplate as the
            search snippet for dashboard URLs (the shell serves every route). */}
        <p
          id="studio-shell-help"
          data-nosnippet=""
          className="max-w-md text-center text-sm text-foreground-light"
        >
          Taking longer than expected? Try clearing your browser cookies and reloading the page.
          {IS_PLATFORM && (
            <>
              {' '}
              If the problem persists, contact{' '}
              <a href="mailto:support@supabase.com" className="underline">
                support@supabase.com
              </a>
              .
            </>
          )}
        </p>
      </div>
      {/* dangerouslySetInnerHTML keeps React hydration from diffing noscript
          children, which the server renders as real markup but the client
          treats as raw text. */}
      <noscript
        dangerouslySetInnerHTML={{
          __html: `
            <style>#studio-shell-loader{display:none}</style>
            <div data-nosnippet class="fixed inset-0 flex items-center justify-center p-4">
              <p class="text-sm text-foreground-light text-center">
                Supabase Studio requires JavaScript. Enable JavaScript in your browser settings and reload the page.
              </p>
            </div>
          `,
        }}
      />
    </>
  )
}
