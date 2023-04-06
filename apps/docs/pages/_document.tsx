import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en" className="dark">
      <Head>
        <meta name="viewport" content="width=device-width, initial-scale=1.0"></meta>
        <link
          rel="search"
          type="application/opensearchdescription+xml"
          title="Supabase Docs"
          href="/docs/opensearch.xml"
        />
      </Head>
      <body>
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
