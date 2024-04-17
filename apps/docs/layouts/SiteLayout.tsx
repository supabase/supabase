import useThemeSync from 'common/hooks/useThemeSync'
import Head from 'next/head'
import { PropsWithChildren } from 'react'

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
