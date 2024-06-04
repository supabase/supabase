import Head from 'next/head'
import { PropsWithChildren } from 'react'

const SiteLayout = ({ children }: PropsWithChildren<{}>) => {
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
