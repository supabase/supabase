import React from 'react'
import Link from 'next/link'

export function SelectBanner() {
  const selectSiteUrl = 'https://select.supabase.com/'
  const desc = [
    'Our first user conference',
    'Oct 3 2025',
    'Patrick Collison, Dylan Field, and more',
  ]
  const cta = 'Watch replay'

  const baseStyles = 'flex flex-col justify-center border-l border-muted py-8 '
  const textBlockStyles =
    baseStyles +
    'pr-8 text-xs font-mono uppercase leading-none tracking-wide text-white/50 [&_p]:mt-[5px]'

  return (
    <div
      className="dark relative w-full flex items-center group justify-center bg-black border-b border-muted transition-colors overflow-hidden"
      style={
        {
          '--line-color': 'hsl(var(--border-muted))',
          '--line-width': '1px',
          '--offset-from-top': '64px',
          '--line-spacing': '12px', // Match -3 utility spacing used elsewhere
          backgroundImage: `
          /* Top horizontal line: offset from middle line by line spacing */
          linear-gradient(to bottom, transparent 0, transparent calc(var(--offset-from-top) - var(--line-spacing)), var(--line-color) calc(var(--offset-from-top) - var(--line-spacing)), var(--line-color) calc(var(--offset-from-top) - var(--line-spacing) + var(--line-width)), transparent calc(var(--offset-from-top) - var(--line-spacing) + var(--line-width))),
          /* Middle horizontal line */
          linear-gradient(to bottom, transparent 0, transparent var(--offset-from-top), var(--line-color) var(--offset-from-top), var(--line-color) calc(var(--offset-from-top) + var(--line-width)), transparent calc(var(--offset-from-top) + var(--line-width))),
          /* Bottom horizontal line: offset from middle line by line spacing */
          linear-gradient(to bottom, transparent 0, transparent calc(var(--offset-from-top) + var(--line-spacing)), var(--line-color) calc(var(--offset-from-top) + var(--line-spacing)), var(--line-color) calc(var(--offset-from-top) + var(--line-spacing) + var(--line-width)), transparent calc(var(--offset-from-top) + var(--line-spacing) + var(--line-width)))
        `,
          backgroundSize: '100% 100%',
          backgroundRepeat: 'no-repeat',
        } as React.CSSProperties
      }
    >
      <div className="relative z-10 flex gap-5 items-stretch justify-center px-3 border-l border-muted">
        <div className={`${baseStyles} -px-3`}>
          <Link
            target="_blank"
            href={selectSiteUrl}
            className="transition-opacity hover:opacity-80"
          >
            <img src="/images/supabase-select/logo.svg" alt="Supabase Select" className="w-36" />
          </Link>
        </div>
        <div className={`${textBlockStyles} hidden md:flex`}>
          <p>{desc[0]}</p>
        </div>
        <div className={`${textBlockStyles} hidden sm:flex`}>
          <p>{desc[1]}</p>
        </div>
        <div className={`${textBlockStyles} hidden xl:flex`}>
          <p>{desc[2]}</p>
        </div>

        <div className="flex flex-col justify-center -px-4 border-x border-muted border-dashed relative after:absolute after:top-0 after:left-full after:w-screen after:h-full after:bg-black after:-z-10">
          <Link
            target="_blank"
            href={selectSiteUrl}
            className="relative before:absolute before:inset-0 before:bg-black before:-z-10 px-4 py-1 h-10 flex items-center justify-center bg-brand-600/20 hover:bg-brand-600/50 outline-1 outline-dashed outline-brand-600/40 hover:outline-brand-600 text-sm text-white font-medium transition-all duration-200"
          >
            {cta}
            {/* Crosshairs */}
            <div className="absolute pointer-events-none inset-0 z-10">
              {['top-left', 'top-right', 'bottom-left', 'bottom-right'].map((position) => (
                <div
                  key={position}
                  className={`absolute ${position === 'top-left' ? 'top-0 left-0' : position === 'top-right' ? 'top-0 right-0' : position === 'bottom-left' ? 'bottom-0 left-0' : 'bottom-0 right-0'}`}
                >
                  <div
                    className={`absolute ${position.includes('left') ? '-left-px' : '-right-px'} ${position.includes('top') ? '-top-[3px]' : '-bottom-[3px]'} w-px h-[5px]`}
                    style={{ backgroundColor: 'hsl(var(--brand-600))' }}
                  />
                  <div
                    className={`absolute ${position.includes('left') ? '-left-[3px]' : '-right-[3px]'} ${position.includes('top') ? '-top-px' : '-bottom-px'} w-[5px] h-px`}
                    style={{ backgroundColor: 'hsl(var(--brand-600))' }}
                  />
                </div>
              ))}
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}

export default SelectBanner
