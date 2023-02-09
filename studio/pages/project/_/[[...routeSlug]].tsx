import { FC } from 'react'
import Link from 'next/link'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'

import { withAuth } from 'hooks'
import ProjectList from 'components/interfaces/Home/ProjectList'

interface Props {}

const Header: FC<Props> = () => {
  return (
    <div className="dark:border-dark border-b p-3">
      <div className="flex items-center space-x-2">
        <Link href="/projects">
          <a>
            <img
              src="/img/supabase-logo.svg"
              alt="Supabase"
              className="dark:border-dark rounded border p-1 hover:border-white"
              style={{ height: 24 }}
            />
          </a>
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
  const queryString =
    Object.keys(queryParams).length > 0
      ? new URLSearchParams(queryParams as Record<string, string>).toString()
      : ''

  const urlRewriterFactory = (slug: string | string[] | undefined) => {
    return (projectRef: string) => {
      if (!Array.isArray(slug)) {
        return `/project/${projectRef}?${queryString}`
      }

      const slugPath = slug.reduce((a: string, b: string) => `${a}/${b}`, '').slice(1)
      return `/project/${projectRef}/${slugPath}?${queryString}`
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
          <ProjectList rewriteHref={urlRewriterFactory(routeSlug)} />
        </div>
      </div>
    </>
  )
}

export default withAuth(observer(GenericProjectPage))
