import { FC } from 'react'
import Link from 'next/link'
import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'

import { withAuth } from 'hooks'
import BaseLayout from 'components/layouts'
import ProjectList from 'components/interfaces/Home/ProjectList'
import { Typography } from '@supabase/ui'

interface Props {}

const Header: FC<Props> = () => {
  return (
    <div className="p-3 border-b dark:border-dark">
      <div className="space-x-2 flex items-center">
        <Link href="/">
          <a>
            <img
              src="/img/supabase-logo.svg"
              alt="Supabase"
              className="border dark:border-dark rounded p-1 hover:border-white"
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
  const { routeSlug } = router.query

  const urlRewriterFactory = (slug: string | string[] | undefined) => {
    return (projectRef: string) => {
      if (!Array.isArray(slug)) {
        return `/project/${projectRef}`
      }

      const slugPath = slug.reduce((a: string, b: string) => `${a}/${b}`, '').slice(1)
      return `/project/${projectRef}/${slugPath}`
    }
  }

  return (
    <BaseLayout hideHeader hideIconBar>
      <Header />
      <div className="py-8 w-full max-w-5xl mx-auto">
        <h3 className="text-2xl">Select a project to continue</h3>
        <div className="my-6 space-y-8">
          <ProjectList
            rewriteHref={urlRewriterFactory(routeSlug)}
            onSelectDelete={() => {}}
            onSelectRestore={() => {}}
          />
        </div>
      </div>
    </BaseLayout>
  )
}

export default withAuth(observer(GenericProjectPage))
