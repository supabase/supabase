import { useState, useEffect } from 'react'
import Link from 'next/link'
import Head from 'next/head'
import styles from 'styles/Home.module.css'

export default function Page() {
  return (
    <div className={styles.container}>
      <Head>
        <title>Live Tracker</title>
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <main className={styles.main}>
        <h1 className={styles.title}>
          Live Tracker
        </h1>

        <p className={styles.description}>
          Get started by choosing your role as Driver or Manager.
        </p>
        <p className={styles.sub_description}>
          You can only login 1 role at a time. Please use incognito window to test multi users.
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

      </main>

      <footer className="footer">
        <a
          href="https://supabase.io"
          target="_blank"
          rel="noopener noreferrer"
        >
          Powered by{' '}
          <img src="/supabase.svg" alt="Supabase Logo" className="logo" />
        </a>
      </footer>
    </div>
  )
}
