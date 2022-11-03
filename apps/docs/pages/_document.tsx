import { Html, Head, Main, NextScript } from 'next/document'

export default function Document() {
  return (
    <Html lang="en" className="dark">
      <Head></Head>
      <body className="bg-white dark:bg-gray-800">
        <Main />
        <NextScript />
      </body>
    </Html>
  )
}
