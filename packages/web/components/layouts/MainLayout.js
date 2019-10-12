import '~/styles/style.scss'
import Navbar from '../Navbar'
import Footer from '../Footer'
import Head from 'next/head'

export default function MainLaout(props) {
  return (
    <>
      <Head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <title>Supabase</title>
        <link rel="shortcut icon" type="image/png" href="/favicon.png" />
      </Head>
      <div className="">
        <Navbar />
        {props.children}
        <Footer />
      </div>
    </>
  )
}
