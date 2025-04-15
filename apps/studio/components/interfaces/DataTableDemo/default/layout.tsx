import * as React from 'react'
import { SocialsFooter } from '../components/layout/socials-footer'

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <main className="container mx-auto flex min-h-screen flex-col gap-4 p-4 sm:p-8">
      <div className="flex flex-col gap-4 sm:gap-8 w-full max-w-7xl mx-auto relative min-h-full h-full rounded-lg border border-border/50 bg-background/50 p-4 backdrop-blur-[2px] sm:p-8">
        {children}
      </div>
      <SocialsFooter />
    </main>
  )
}
