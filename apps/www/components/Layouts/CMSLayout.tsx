import { ReactNode } from 'react'

interface CMSLayoutProps {
  children: ReactNode
}

export default function CMSLayout({ children }: CMSLayoutProps) {
  return (
    <div className="min-h-screen bg-surface-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">{children}</div>
    </div>
  )
}
