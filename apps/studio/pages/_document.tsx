import Document, { DocumentContext, Head, Html, Main, NextScript } from 'next/document'

import { BootTimeoutFallback } from '@/components/ui/BootTimeoutFallback/BootTimeoutFallback'
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
          <BootTimeoutFallback />
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
