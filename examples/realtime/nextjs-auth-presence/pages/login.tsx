import type { NextPage } from 'next'
import Head from 'next/head'
import Image from 'next/image'
import styles from '../styles/Home.module.css'
import { useUser, useSupabaseClient } from '@supabase/auth-helpers-react'
import { Auth, ThemeSupa } from '@supabase/auth-ui-react'
import Link from 'next/link'
import { useEffect, useState } from 'react'

import { createBrowserSupabaseClient } from '@supabase/auth-helpers-nextjs'

const LoginPage: NextPage = () => {
  const supabaseClient = useSupabaseClient()
  const user = useUser()

  if (!user) {
    return (
      <main className={styles.main}>
        <Auth
          redirectTo="http://localhost:3000/"
          appearance={{ theme: ThemeSupa }}
          supabaseClient={supabaseClient}
        />
      </main>
    )
  }

  return (
    <>
      <button onClick={() => supabaseClient.auth.signOut()}>Sign out</button>
      <p>user:</p>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </>
  )
  return <h1> Hi</h1>
}

export default LoginPage
