import Document, { DocumentContext, Head, Html, Main, NextScript } from 'next/document'

import { inter, sourceCodePro } from '@/fonts'
import { BASE_PATH, IS_PLATFORM } from '@/lib/constants'

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)

    return initialProps
  }

  render() {
    return (
      <Html lang="en">
        <Head />
        <body className={`${inter.variable} ${sourceCodePro.variable}`}>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
