import Document, { Html, Head, Main, NextScript } from 'next/document'

export default class MyDocument extends Document {
  render() {
    const locale = this.props.__NEXT_DATA__.locale || 'en'
    
    return (
      <Html lang={locale}>
        <Head></Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
