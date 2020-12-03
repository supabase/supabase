import Document, { Html, Head, Main, NextScript } from 'next/document'
import ReactGA from 'react-ga'

export default class MyDocument extends Document {
  componentDidMount() {
    ReactGA.initialize(process.env.NEXT_PUBLIC_GA_PROPERTY_ID)
    ReactGA.pageview(window.location.pathname + window.location.search)
  }

  render() {
    return (
      <Html lang="en" className="dark">
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
