import { NextPage } from 'next'
import Link from 'next/link'
import { useRouter } from 'next/router'

import { ProjectList } from 'components/interfaces/Home/ProjectList'
import { withAuth } from 'hooks/misc/withAuth'
import { BASE_PATH } from 'lib/constants'

const Header = () => {
  return (
    <div className="border-default border-b p-3">
      <div className="flex items-center space-x-2">
        <Link href="/projects">
          <img
            src={`${BASE_PATH}/img/supabase-logo.svg`}
            alt="Supabase"
            className="border-default rounded border p-1 hover:border-white"
            style={{ height: 24 }}
          />
        </Link>
      </div>
    </div>
  )
}

// [Joshen] I'd say we don't do route validation here, this page will act more
// like a proxy to the project specific pages, and we let those pages handle
// any route validation logic instead

const GenericProjectPage: NextPage = () => {
  const router = useRouter()
  const { routeSlug, ...queryParams } = router.query

  const query = Object.keys(queryParams).length
    ? `?${new URLSearchParams(queryParams as Record<string, string>)}`
    : undefined

  const urlRewriterFactory = (slug: string | string[] | undefined) => {
    return (projectRef: string) => {
      const hash = location.hash

      if (!Array.isArray(slug)) {
        return [`/project/${projectRef}`, query, hash].filter(Boolean).join('')
      }

      const slugPath = slug.join('/')
      return [`/project/${projectRef}/${slugPath}`, query, hash].filter(Boolean).join('')
    }
  }

  return (
    <>
      <Header />
      <div className="flex flex-col mx-auto w-full max-w-5xl">
        <h1 className="mt-8 text-2xl">Select a project to continue</h1>
        <div
          className="flex-grow py-6 space-y-8 overflow-y-auto"
          style={{ maxHeight: 'calc(100vh - 49px - 64px)' }}
        >
          <ProjectList rewriteHref={urlRewriterFactory(routeSlug)} search="" />
        </div>
      </div>
    </>
  )
}

export default withAuth(GenericProjectPage)
