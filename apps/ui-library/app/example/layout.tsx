import type { Metadata } from 'next'

// Demo routes are embedded as previews in the docs, not meant to rank on their own.
// Child layouts that don't set `robots` inherit this.
export const metadata: Metadata = {
  robots: {
    index: false,
    follow: false,
  },
}

export default function ExampleLayout({ children }: { children: React.ReactNode }) {
  return children
}
