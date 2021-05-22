import { useContext, useEffect } from 'react'
import { AppContext } from 'lib/constants'
import Link from 'next/link'
import styles from 'styles/Home.module.css'
import PageLayout from 'components/PageLayout'

export default function Page() {
  const { session } = useContext(AppContext)

  useEffect(() => {
    console.log('session: ', session)
  }, [])

  return (
    <PageLayout title="Live Tracker">
      <h1 className={styles.title}>Live Tracker</h1>

      <p className={styles.description}>Get started by choosing your role as Driver or Manager.</p>
      <p className={styles.sub_description}>
        You can only login 1 role at a time. Please use incognito mode to test multi users.
      </p>

      <div className={styles.grid}>
        <Link href="/driver">
          <a className={styles.card}>
            <h3>Driver View &rarr;</h3>
            <p>Find in-depth information about Next.js features and API.</p>
          </a>
        </Link>
        <Link href="/manager">
          <a className={styles.card}>
            <h3>Manager View &rarr;</h3>
            <p>Find in-depth information about Next.js features and API.</p>
          </a>
        </Link>
      </div>
    </PageLayout>
  )
}
