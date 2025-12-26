import { Metadata } from 'next'

import { BaseInjector } from './../base-injector'
import { ThemeProvider } from '@/app/Providers'

export const metadata: Metadata = {
  title: 'Social Auth Example',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html style={{ height: '100%', overflow: 'hidden' }}>
      <head>
        <style
          dangerouslySetInnerHTML={{
            __html: `
          html, body, #root, main {
            height: 100% !important;
            min-height: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important;
          }
        `,
          }}
        />
      </head>
      <body style={{ height: '100%', margin: 0, padding: 0, overflow: 'hidden' }}>
        <BaseInjector />
        <ThemeProvider
          themes={['dark', 'light', 'classic-dark']}
          defaultTheme="system"
          enableSystem
        >
          <div
            className="flex w-full h-full items-center justify-center p-6 md:p-10 preview bg-surface-100"
            style={{ minHeight: '100%' }}
          >
            <div className="z-0 pointer-events-none absolute h-full w-full bg-[radial-gradient(hsla(var(--foreground-default)/0.05)_1px,transparent_1px)] [background-size:16px_16px] [mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)]"></div>
            <div className="w-full max-w-sm">{children}</div>
          </div>
        </ThemeProvider>
      </body>
    </html>
  )
}
