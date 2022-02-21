import Document, { DocumentContext, Html, Head, Main, NextScript } from 'next/document'

class MyDocument extends Document {
  static async getInitialProps(ctx: DocumentContext) {
    const initialProps = await Document.getInitialProps(ctx)

    return initialProps
  }

  render() {
    return (
      <Html>
        <Head>
          {/* Workaround for https://github.com/suren-atoyan/monaco-react/issues/272 */}
          <link
            rel="stylesheet"
            type="text/css"
            data-name="vs/editor/editor.main"
            href="https://cdn.jsdelivr.net/npm/monaco-editor@0.28.1/min/vs/editor/editor.main.css"
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
