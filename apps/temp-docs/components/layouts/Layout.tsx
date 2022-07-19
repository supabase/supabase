import Head from 'next/head'
import NavBar from '../nav/NavBar'
import Footer from '../Footer'

const Layout = ({
  children,
  meta,
  currentPage,
}: {
  meta: { title: string; description: string }
  children: React.ReactNode
  currentPage: string
}) => {
  return (
    <>
      <Head>
        <title>{meta?.title} | Supabase</title>
        <meta name="description" content={meta?.description} />
        <meta content="width=device-width, initial-scale=1" name="viewport" />
        <link rel="icon" href="/favicon.ico" />
        <meta property="og:type" content="website" />
        <meta property="og:site_name" content={meta?.title} />
        <meta property="og:description" content={meta?.description} />
        <meta property="og:title" content={meta?.title} />
      </Head>
      <main>
        <NavBar currentPage={currentPage} />
        <article className="text-scale-1200 mx-4 md:mx-8 xl:mx-auto xl:max-w-7xl">
          {children}
        </article>
        <Footer />
      </main>
    </>
  )
}

export default Layout
