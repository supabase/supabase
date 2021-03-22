import Document, { Html, Head, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
  render() {
    return (
      <Html lang="en" className="dark">
        <Head></Head>
        <body className="lg:overflow-auto">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
