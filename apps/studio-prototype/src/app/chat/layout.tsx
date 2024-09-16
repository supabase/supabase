// import "./globals.css";
import { Metadata } from 'next'
// import { Toaster } from 'sonner'
import { AI } from './actions'

export const metadata: Metadata = {
  metadataBase: new URL('https://ai-sdk-preview-rsc-genui.vercel.dev'),
  title: 'Generative User Interfaces Preview',
  description: 'Generative UI with React Server Components and Vercel AI SDK',
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <>
      {/* <Toaster position="top-center" richColors /> */}
      <AI>{children}</AI>
    </>
  )
}
