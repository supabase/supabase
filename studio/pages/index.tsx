import { NextPage } from 'next'
import { useEffect, useState } from 'react'
import { observer } from 'mobx-react-lite'
import { NextRouter, useRouter } from 'next/router'
import { isUndefined } from 'lodash'
import { Typography } from '@supabase/ui'

import { Project } from 'types'
import { useStore, withAuth } from 'hooks'
import { post, delete_ } from 'lib/common/fetch'
import { API_URL, IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import { AccountLayout } from 'components/layouts'
import { auth } from 'lib/gotrue'
import Landing from 'components/interfaces/Home/Landing'
import ProjectList from 'components/interfaces/Home/ProjectList'
import OrganizationDropdown from 'components/to-be-cleaned/Dropdown/OrganizationDropdown'
import TextConfirmModal from 'components/to-be-cleaned/ModalsDeprecated/TextConfirmModal'
import Connecting from 'components/ui/Loading'

const Home: NextPage = () => {
  const { app, ui } = useStore()
  const { profile } = ui

  const router = useRouter()

  const [isDeletingProject, setIsDeletingProject] = useState<boolean>(false)
  const [selectedProjectToDelete, setSelectedProjectToDelete] = useState<Project>()

  if (!profile) {
    return <UnauthorizedLanding />
  } else {
    const isRedirect = isRedirectFromThirdPartyService(router)
    if (isRedirect) {
      const queryParams = (router.query as any) || {}
      const params = new URLSearchParams(queryParams)
      if (router.query?.next?.includes('https://vercel.com')) {
        router.push(`/vercel/integrate?${params.toString()}`)
      }
      if (router.query?.next?.includes('new-project')) {
        router.push('/new/project')
      }
      if (router.query['x-amzn-marketplace-token'] != undefined) {
        router.push(`/account/associate?${params.toString()}`)
      }
      return <Connecting />
    }
  }

  const onSelectDeleteProject = async (project: Project) => {
    setSelectedProjectToDelete(project)
    setIsDeletingProject(false)
  }

  const onDeleteProject = async (project?: Project) => {
    if (!project) return
    const response = await delete_(`${API_URL}/projects/${project.ref}/remove`)

    if (response.error) {
      return ui.setNotification({ category: 'error', message: response.error.message })
    }

    app.onProjectDeleted(response)
    ui.setNotification({ category: 'success', message: `Deleted ${project.name} successfully!` })

    setIsDeletingProject(false)
    setSelectedProjectToDelete(undefined)
  }

  const onRestoreProject = async (project: Project) => {
    app.onProjectUpdated({ ...project, status: PROJECT_STATUS.COMING_UP })
    await post(`${API_URL}/projects/${project.ref}/restore`, {})
    router.push(`/project/${project.ref}`)
  }

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
      <div className="p-4">
        {IS_PLATFORM && (
          <div className="my-2">
            <div className="flex">
              <div className="">
                <OrganizationDropdown organizations={app.organizations} />
              </div>
            </div>
          </div>
        )}
        <div className="my-8 space-y-8">
          <ProjectList onSelectDelete={onSelectDeleteProject} onSelectRestore={onRestoreProject} />
        </div>
      </div>
      <TextConfirmModal
        visible={!isUndefined(selectedProjectToDelete)}
        title="Are you absolutely sure?"
        alert="Deleting this project will also remove your database. Make sure you have made a backup if you want to keep your data."
        text={
          <span key="confirm-text">
            This action <Typography.Text strong>cannot</Typography.Text> be undone. This will
            permanently delete the{' '}
            <Typography.Text strong>{selectedProjectToDelete?.name}</Typography.Text> project and
            all of its data.
          </span>
        }
        loading={isDeletingProject}
        confirmLabel="Confirm delete"
        confirmPlaceholder="Type in name of project"
        confirmString={selectedProjectToDelete?.name}
        onCancel={() => setSelectedProjectToDelete(undefined)}
        onConfirm={() => onDeleteProject(selectedProjectToDelete)}
      />
    </AccountLayout>
  )
}
export default withAuth(observer(Home))

// detect for redirect from 3rd party service like vercel, aws...
function isRedirectFromThirdPartyService(router: NextRouter) {
  return router.query.next !== undefined || router.query['x-amzn-marketplace-token'] !== undefined
}

const UnauthorizedLanding = () => {
  const router = useRouter()
  const autoLogin = isRedirectFromThirdPartyService(router)

  useEffect(() => {
    if (autoLogin) {
      const queryParams = (router.query as any) || {}
      const params = new URLSearchParams(queryParams)
      // trigger github signIn
      auth.signIn(
        { provider: 'github' },
        {
          redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}?${params.toString()}`,
        }
      )
    }
  }, [])

  return autoLogin ? <Connecting /> : <Landing />
}
