import Link from 'next/link'
// import { Button } from 'ui/src/components/Button'

export function SelectBanner() {
  const selectSiteUrl = 'https://select.supabase.com/'
  const desc = ['Our first user conference', '3rd Oct 2025']
  const descExtended = 'Guillermo Rauch, Dylan Field, and more'
  const cta = 'Save your seat'

  const baseStyles = 'flex flex-col justify-center border-l border-muted py-8'
  const styles = baseStyles + 'pr-8 text-xs font-mono uppercase tracking-wide text-white/50'

  return (
    <div
      className="relative w-full flex items-center group justify-center text-foreground-contrast dark:text-white bg-black border-b border-muted transition-colors overflow-hidden"
      style={{
        '--grid-color': '#374151',
        '--line-width': '1px',
        '--offset-from-top': '64px',
        '--line-spacing': '16px',
        backgroundImage: `
          /* Top horizontal line - 16px above middle line */
          linear-gradient(to bottom, transparent 0, transparent calc(var(--offset-from-top) - var(--line-spacing)), var(--grid-color) calc(var(--offset-from-top) - var(--line-spacing)), var(--grid-color) calc(var(--offset-from-top) - var(--line-spacing) + var(--line-width)), transparent calc(var(--offset-from-top) - var(--line-spacing) + var(--line-width))),
          /* Middle horizontal line */
          linear-gradient(to bottom, transparent 0, transparent var(--offset-from-top), var(--grid-color) var(--offset-from-top), var(--grid-color) calc(var(--offset-from-top) + var(--line-width)), transparent calc(var(--offset-from-top) + var(--line-width))),
          /* Bottom horizontal line - 16px below middle line */
          linear-gradient(to bottom, transparent 0, transparent calc(var(--offset-from-top) + var(--line-spacing)), var(--grid-color) calc(var(--offset-from-top) + var(--line-spacing)), var(--grid-color) calc(var(--offset-from-top) + var(--line-spacing) + var(--line-width)), transparent calc(var(--offset-from-top) + var(--line-spacing) + var(--line-width)))
        `,
        backgroundSize: '100% 100%',
        backgroundRepeat: 'no-repeat',
      }}
    >
      <div className="relative z-10 flex gap-5 items-stretch justify-center px-4 border-l border-muted">
        <div className={`${baseStyles} -px-4`}>
          <Link
            target="_blank"
            href={selectSiteUrl}
            className="transition-opacity hover:opacity-80"
          >
            <img src="/images/select/supabase-select.svg" alt="Supabase Select" className="w-36" />
          </Link>
        </div>
        {desc.map((item, index) => (
          <div key={index} className={`${styles} hidden sm:flex`}>
            <p>{item}</p>
          </div>
        ))}
        <div className={`${styles} hidden xl:flex`}>
          <p>{descExtended}</p>
        </div>

        <div className="flex flex-col justify-center -px-4 border-r border-muted relative after:absolute after:top-0 after:left-full after:w-screen after:h-full after:bg-black after:-z-10">
          <Link
            target="_blank"
            href={selectSiteUrl}
            className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-11 px-8 relative bg-accent-1-foreground/20 border border-dashed border-accent-1-foreground/30 text-sm font-medium hover:bg-accent-1-foreground/80 hover:border-accent-1-foreground/60 transition-all duration-300 text-white"
          >
            {cta}
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SelectBanner
