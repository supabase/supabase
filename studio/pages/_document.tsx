/* eslint-disable @next/next/no-css-tags */
import { BASE_PATH } from 'lib/constants'
import Document, { DocumentContext, Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)

    return initialProps
  }

  render() {
    return (
      <Html lang="en">
        <Head>
          {/* Workaround for https://github.com/suren-atoyan/monaco-react/issues/272 */}
          <link
            rel="stylesheet"
            type="text/css"
            data-name="vs/editor/editor.main"
            href={`${BASE_PATH}/monaco-editor/editor/editor.main.css`}
          />
          <link rel="stylesheet" type="text/css" href="/css/fonts.css" />
        </Head>
        <body className="dark">
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}

export default MyDocument
