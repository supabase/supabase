import Head from 'next/head'
import DashboardLayout from '../components/layouts/Dashboard'
import styles from '../styles/Home.module.css'

export default function Home() {
  return (
    <DashboardLayout>
      <div className={styles.container}>
        <Head>
          <title>Supabase | API</title>
          <meta name="description" content="Supabase API Documentation" />
          <link rel="icon" href="/favicon.ico" />
        </Head>

        <main className={styles.main}>
          <h1 className={styles.title}>API Docs</h1>
        </main>
      </div>
    </DashboardLayout>
  )
}
