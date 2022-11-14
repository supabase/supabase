import Head from 'next/head'
import { Playthrough } from '~/components/Playthrough'

export default function Page() {
  return (
    <>
      <Head>
        <title>Next.js Playthrough | Supabase</title>
      </Head>
      <Playthrough />
    </>
  )
}
