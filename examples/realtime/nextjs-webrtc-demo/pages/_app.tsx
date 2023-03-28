import '../styles/globals.css'
import type { AppProps } from 'next/app'
import Head from 'next/head'

function MyApp({ Component, pageProps }: AppProps) {
  return (
    <>
      <Head>
        <title>Realtime | Supabase</title>
        <link rel="icon" href="/favicon.ico" />
        <meta name="description" content="Presence and ephemeral state, by Supabase" />

        <meta
          key="ogimage"
          property="og:image"
          content={`https://multiplayer.dev/img/multiplayer-og.png`}
        />
        <meta property="og:site_name" key="ogsitename" content="multiplayer.dev" />
        <meta property="og:title" key="ogtitle" content="Realtime | Supabase" />
        <meta
          property="og:description"
          key="ogdesc"
          content="Realtime collaborative app to display broadcast, presence, and database listening over WebSockets"
        />
      </Head>
      <Component {...pageProps} />
    </>
  )
}

export default MyApp
