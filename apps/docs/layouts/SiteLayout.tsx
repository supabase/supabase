import Head from 'next/head'
import { PropsWithChildren } from 'react'

const SiteLayout = ({ children }: PropsWithChildren<{}>) => {
  return (
    <>
      <Head>
        <title>Supabase Docs</title>
      </Head>
      <div className="grow">{children}</div>
    </>
  )
}

export default SiteLayout
