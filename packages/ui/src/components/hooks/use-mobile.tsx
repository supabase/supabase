import * as React from 'react'

// Mirrors Tailwind's default `md` breakpoint (`--breakpoint-md: 48rem`), in
// rem rather than a hardcoded px value. Tailwind's `md:` utilities (e.g. the
// sidebar's `hidden md:block`) resolve in rem, relative to the root font
// size. Comparing against a raw px window width instead can drift out of
// sync with those classes whenever the root font size isn't exactly 16px
// (browser-specific zoom/accessibility text scaling), leaving the sidebar
// with no matching render path — neither the mobile Sheet nor the desktop
// div render.
//
// Uses the Media Queries Level 4 range syntax (`width < 48rem`) rather than
// an approximated `max-width: 47.9375rem` (or similar -1px offset): the
// range syntax is the exact logical complement of Tailwind's
// `min-width: 48rem`, so there is no sliver of viewport width where both (or
// neither) can match — an approximated offset can still leave a sub-pixel
// gap where a fractional viewport width satisfies neither query.
const MOBILE_QUERY = '(width < 48rem)'

export function useIsMobile() {
  const [isMobile, setIsMobile] = React.useState<boolean | undefined>(undefined)

  React.useEffect(() => {
    const mql = window.matchMedia(MOBILE_QUERY)
    const onChange = () => setIsMobile(mql.matches)
    mql.addEventListener('change', onChange)
    setIsMobile(mql.matches)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  return !!isMobile
}
