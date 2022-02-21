import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'
import { Typography } from '@supabase/ui'

import { withAuth } from 'hooks'
import { AccountLayout } from 'components/layouts'
import ProjectList from 'components/interfaces/Home/ProjectList'

const urlRewriterFactory = (slug: string | string[] | undefined) => {
  return (projectRef: string) => {
    if (!Array.isArray(slug)) {
      return `/project/${projectRef}/settings/general`
    }

    if (slug[0] === 'auth') {
      if (slug[1]) return `/project/${projectRef}/auth/${slug[1]}`
      return `/project/${projectRef}/auth/settings`
    }

    let slugPath = ''
    slug.forEach((s) => {
      slugPath += `${s}/`
    })

    return `/project/${projectRef}/${slugPath}`
  }
}

const Settings: NextPage = () => {
  const router = useRouter()
  const { routesSlug } = router.query

  return (
    <AccountLayout
      title="Supabase"
      // @ts-ignore
      breadcrumbs={[
        {
          key: `supabase-projects`,
          label: 'Projects',
        },
      ]}
    >
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        <div className="p-5">
          <Typography.Title level={4}>
            Select the project to navigate to:{' '}
            {Array.isArray(routesSlug)
              ? routesSlug?.map((slug, idx) =>
                  idx === routesSlug.length - 1 ? slug : `${slug} > `
                )
              : ''}
          </Typography.Title>
          <div className="my-6 space-y-8">
            <ProjectList
              rewriteHref={urlRewriterFactory(routesSlug)}
              showInactiveProjects={false}
              onSelectDelete={() => {}}
              onSelectRestore={() => {}}
            />
          </div>
        </div>
      </main>
    </AccountLayout>
  )
}

export default withAuth(observer(Settings))
