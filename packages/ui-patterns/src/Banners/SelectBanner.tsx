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
    <div className="relative w-full flex items-center group justify-center text-foreground-contrast dark:text-white bg-black border-b border-muted transition-colors overflow-hidden ">
      <div className="relative z-10 flex gap-5 items-stretch justify-center">
        <Link target="_blank" href={selectSiteUrl} className={baseStyles}>
          <img src="/images/select/supabase-select.svg" alt="Supabase Select" className="w-36" />
        </Link>

        {desc.map((item, index) => (
          <div key={index} className={`${styles} hidden sm:flex`}>
            <p>{item}</p>
          </div>
        ))}
        <div className={`${styles} hidden xl:flex`}>
          <p>{descExtended}</p>
        </div>

        <Link
          target="_blank"
          href={selectSiteUrl}
          className="inline-flex items-center justify-center gap-2 whitespace-nowrap ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0 h-11 px-8 relative bg-accent-1-foreground/20 border border-dashed border-accent-1-foreground/30 text-sm font-medium hover:bg-accent-1-foreground/80 hover:border-accent-1-foreground/60 transition-all duration-300 text-white"
        >
          {cta}
        </Link>
      </div>
    </div>
  )
}

export default SelectBanner
