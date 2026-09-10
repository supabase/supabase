import Document, { DocumentContext, Head, Html, Main, NextScript } from 'next/document'

import { inter, manrope, sourceCodePro } from '@/fonts'

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)

    return initialProps
  }

  render() {
    return (
      <Html lang="en">
        <Head />
        <body className={`${inter.variable} ${manrope.variable} ${sourceCodePro.variable}`}>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
