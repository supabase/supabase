import { PropsWithChildren } from 'react'
import Head from 'next/head'
import { useThemeSync } from 'common'

const SiteLayout = ({ children }: PropsWithChildren<{}>) => {
  useThemeSync('docs')

  return (
    <>
      <Head>
        <title>Supabase Docs</title>
      </Head>
      <main className="grow overflow-hidden">{children}</main>
    </>
  )
}

export default SiteLayout
