import { ReactElement } from 'react'
import Head from 'next/head'
import styles from '../../styles/Home.module.css'
import NavBar from '../nav/NavBar'
import SideBar from '../nav/SideBar'
import Footer from '../Footer'

const DocsLayout = ({ title, children }: { title: String; children: ReactElement }) => {
  return (
    <div className="h-screen">
      <Head>
        <title>{title} | Supabase</title>
        <meta name="description" content="Supabase docs" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className={`${styles.container} h-full`}>
        <main className={`${styles.main}`}>
          <NavBar />
          <div className="flex flex-row ">
            <SideBar />
            <div className={`${styles.content} p-8`}>{children}</div>
          </div>
          <Footer />
        </main>
      </div>
    </div>
  )
}

export default DocsLayout
