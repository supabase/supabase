import '~/styles/style.scss'
import Navbar from '../Navbar'
import Footer from '../Footer'
import Head from 'next/head'

export default function MainLayout(props) {
  return (
    <>
      <Head>
        <title>Supabase</title>
      </Head>
      <div className="">
        <Navbar />
        {props.children}
        <Footer />
      </div>
    </>
  )
}
