import Document, { Head, Main, NextScript } from 'next/document'
export default class MyDocument extends Document {
  render() {
    return (
      <html>
        <head>
          <meta charSet="utf-8" />
          <meta name="viewport" content="width=device-width, initial-scale=1" />
          <link rel="shortcut icon" type="image/png" href="/favicon.png" />
          <link rel="stylesheet" type="text/css" href="/css/prism-tomorrow.css" />
          <title>Supabase</title>
        </head>
        <Head />
        <body className="has-navbar-fixed-bottom ">
          <Main />
          <NextScript />
        </body>
      </html>
    )
  }
}
