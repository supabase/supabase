import { NextPage } from 'next'
import { useRouter } from 'next/router'
import { observer } from 'mobx-react-lite'

import { withAuth } from 'hooks'
import BaseLayout from 'components/layouts'
import ProjectList from 'components/interfaces/Home/ProjectList'

const urlRewriterFactory = (slug: string | string[] | undefined) => {
  console.log(slug)
  return (projectRef: string) => {
    if (!Array.isArray(slug)) return `/project/${projectRef}/settings/general`
    if (slug[0] === 'auth') {
      if (slug[1]) return `/project/${projectRef}/auth/${slug[1]}`
      return `/project/${projectRef}/auth/settings`
    }
    let slugPath = ''
    slug.forEach((s) => {
      slugPath += `${s}/`
    })
    return `/project/${projectRef}/settings/${slugPath}`
  }
}

const Settings: NextPage = () => {
  const router = useRouter()
  const { settingsSlug } = router.query
  return (
    <BaseLayout title={'Settings'} product="Settings">
      <main style={{ maxHeight: '100vh' }} className="flex-1 overflow-y-auto">
        <div className="p-5">
          <h1>
            Settings{Array.isArray(settingsSlug) ? settingsSlug?.map((slug) => ` > ${slug}`) : ''}
          </h1>
          <ProjectList
            rewriteHref={urlRewriterFactory(settingsSlug)}
            showInactiveProjects={false}
            onSelectDelete={() => {}}
            onSelectRestore={() => {}}
          />
        </div>
      </main>
    </BaseLayout>
  )
}

export default withAuth(observer(Settings))
