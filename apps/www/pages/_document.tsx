import Document, { Html, Head, Main, NextScript } from 'next/document'
// import { useEffect } from 'react'

export default class MyDocument extends Document {
  render() {
    // useEffect(() => {
    //   const s = document.createElement('script')
    //   s.setAttribute('src', 'https://platform.twitter.com/widgets.js')
    //   s.setAttribute('async', 'true')
    //   document.head.appendChild(s)
    // }, [])

    return (
      <Html lang="en" className="dark">
        <Head>
          <script async src="https://platform.twitter.com/widgets.js" />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
