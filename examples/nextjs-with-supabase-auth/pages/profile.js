import Link from 'next/link'
import { supabase } from '../utils/initSupabase'

export default function Profile({ user }) {
  return (
    <>
      <Link href="/">
        <a>Index</a>
      </Link>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </>
  )
}

export async function getServerSideProps({ req }) {
  const { user } = await supabase.auth.api.getUserByCookie(req)

  if (!user) {
    // If no user, redirect to index.
    return { props: {}, redirect: { destination: '/', permanent: false } }
  }

  // If there is a user, return it.
  return { props: { user } }
}
