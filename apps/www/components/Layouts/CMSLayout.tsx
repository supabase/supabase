import { ReactNode } from 'react'

interface CMSLayoutProps {
  children: ReactNode
}

export default function CMSLayout({ children }: CMSLayoutProps) {
  return (
    <div className="min-h-screen bg-alternative">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
    </div>
  )
}
