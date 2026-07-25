import * as React from 'react'

// Rem, not px, to match Tailwind's `md` breakpoint exactly — a px comparison
// can drift out of sync with `md:` CSS classes and hide the sidebar entirely.
// Range syntax keeps it the exact complement of Tailwind's `min-width: 48rem`.
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
