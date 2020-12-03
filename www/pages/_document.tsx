import Document, { Html, Head, Main, NextScript } from 'next/document'
// import ReactGA from 'react-ga'

export default class MyDocument extends Document {
  // componentDidMount() {
  //   console.log('inain')
  //   ReactGA.initialize('UA-155232740-1')
  //   ReactGA.pageview(window.location.pathname + window.location.search)
  // }

  render() {
    return (
      <Html lang="en" className="dark">
        <Head>
          <script
            dangerouslySetInnerHTML={{
              __html: `(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
                (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
                m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
                })(window,document,'script','https://www.google-analytics.com/analytics.js','ga');
                
                ga('create', 'UA-155232740-1', 'auto');
                ga('send', 'pageview');`,
            }}
          />
        </Head>
        <body>
          <Main />
          <NextScript />
        </body>
      </Html>
    )
  }
}
