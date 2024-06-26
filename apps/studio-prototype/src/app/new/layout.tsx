'use client'

import RedirectCatcher from '@/src/components/redirect-catcher'

export default function OrgLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <div className="w-screen h-screen flex flex-col bg-dash-canvas">
      <div className="w-full border-b h-12 text-foreground-lighter text-sm px-5">
        <div className="flex items-center h-full gap-5">
          <div className="flex items-center h-full gap-2">
            Logged in
            <span className="text-foreground">jon.summers.muir@googlemail.com</span>
          </div>
          <span>Log out</span>
        </div>
      </div>
      <div className="grow bg-dash-canvas overflow-auto">{children}</div>
      <RedirectCatcher />
    </div>
  )
}
