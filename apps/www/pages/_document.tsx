import Document, { Html, Head, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en">
        <Head>
          <script async src="https://platform.twitter.com/widgets.js" />
        </Head>
        <body className="dark">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
