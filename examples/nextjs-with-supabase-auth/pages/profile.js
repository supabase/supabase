// pages/profile.js
import { withPageAuth } from '@supabase/auth-helpers-nextjs'

export default function Profile({ user }) {
  return (
    <>
     <div>Hello {user.user_metadata.full_name}</div>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </>
  )
}

export const getServerSideProps = withPageAuth({ redirectTo: '/login' })