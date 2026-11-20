import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Reference (beta)',
  // Experimental route: keep it out of search results.
  robots: { index: false, follow: false },
}

export default function ReferenceBetaLayout({ children }: { children: React.ReactNode }) {
  return children
}
