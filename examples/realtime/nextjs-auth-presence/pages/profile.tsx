import { createServerClient } from '@supabase/ssr'
import { serialize } from 'cookie'
import { User } from '@supabase/supabase-js'
import { GetServerSidePropsContext } from 'next'
import Link from 'next/link'

export default function Profile({ user }: { user: User }) {
  return (
    <>
      <p>
        [<Link href="/">Home</Link>] | [<Link href="/protected-page">supabaseServerClient</Link>]
      </p>
      <div>Hello {user.email}</div>
      <pre>{JSON.stringify(user, null, 2)}</pre>
    </>
  )
}

export const getServerSideProps = async (ctx: GetServerSidePropsContext) => {
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!,
    {
      cookies: {
        getAll() {
          return Object.entries(ctx.req.cookies).map(([name, value]) => ({
            name,
            value: value ?? '',
          }))
        },
        setAll(cookiesToSet) {
          const existing = ctx.res.getHeader('Set-Cookie') ?? []
          ctx.res.setHeader('Set-Cookie', [
            ...(Array.isArray(existing) ? existing : [String(existing)]),
            ...cookiesToSet.map(({ name, value, options }) =>
              serialize(name, value, options)
            ),
          ])
        },
      },
    }
  )

  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user)
    return {
      redirect: {
        destination: '/login',
        permanent: false,
      },
    }

  return {
    props: {
      user,
    },
  }
}
