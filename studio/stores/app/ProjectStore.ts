import { cloneDeep, keyBy } from 'lodash'
import { Project } from 'types'
import { IRootStore } from '../RootStore'
import { constructHeaders } from 'lib/api/apiHelpers'
import { get } from 'lib/common/fetch'
import { IS_PLATFORM, PROJECT_STATUS } from 'lib/constants'
import PostgresMetaInterface, { IPostgresMetaInterface } from '../common/PostgresMetaInterface'

import pingPostgrest from 'lib/pingPostgrest'

export interface IProjectStore extends IPostgresMetaInterface<Project> {
  fetchDetail: (projectRef: string, callback?: (project: Project) => void) => Promise<void>
  fetchSubscriptionTier: (project: Project) => Promise<void>
}

export default class ProjectStore extends PostgresMetaInterface<Project> {
  constructor(
    rootStore: IRootStore,
    dataUrl: string,
    headers?: {
      [prop: string]: any
    },
    options?: { identifier: string }
  ) {
    super(rootStore, dataUrl, headers, options)
  }

  // [Joshen] Method override here due to race condition between projects.load() and fetchDetail()
  // There's a race condition that can happen here when these 2 methods are called, such that if
  // fetchDetail() completes before projects.load() completes, the response from project.loads()
  // then overrides what fetchDetail() has already populated into the store - causing parameters like
  // connectionString to become undefined and hence causing the dashboard to stay in a Connecting state.
  // You can reproduce this by giving a setTimeout to project.loads under withAuth.tsx

  // This thus ensures that the response from project.loads() do not override projects which are already
  // loaded in the store from a successful fetchDetail() - This should be fine as project.loads() is only
  // called once in this whole app under withAuth.tsx
  setDataArray(value: any[]) {
    const formattedValue = keyBy(value, this.identifier)
    Object.keys(this.data).forEach((projectId) => {
      if (formattedValue[projectId] !== undefined) {
        formattedValue[projectId] = this.data[projectId]
      }
    })
    this.data = formattedValue
  }

  async fetchDetail(projectRef: string, callback?: (project: Project) => void) {
    const url = `${this.url}/${projectRef}`
    const headers = constructHeaders(this.headers)
    const response = await get(url, { headers })

    if (!response.error) {
      const project = response as Project
      // to improve UX, we wait for PingPostgrest result before continue
      project.postgrestStatus = await this.pingPostgrest(project)
      // update project detail by key id
      this.data[project.id] = project

      callback?.(project)

      // lazy fetches
      if (IS_PLATFORM) {
        this.fetchSubscriptionTier(project)
      }
    }
  }

  async pingPostgrest(project: Project): Promise<'ONLINE' | 'OFFLINE' | undefined> {
    if (project.status === PROJECT_STATUS.ACTIVE_HEALTHY && project.restUrl) {
      const success = await pingPostgrest(project.restUrl, project.ref, {
        kpsVersion: project.kpsVersion,
      })
      return success ? 'ONLINE' : 'OFFLINE'
    }
    return undefined
  }

  async fetchSubscriptionTier(project: Project) {
    const { id: projectId, ref: projectRef, status } = project
    if (status !== PROJECT_STATUS.REMOVED) {
      const url = `${this.url}/${projectRef}/subscription`
      const headers = constructHeaders(this.headers)
      const response = await get(url, { headers })
      if (!response.error) {
        const subscriptionInfo = response as {
          tier: {
            supabase_prod_id: string
          }
        }
        // update subscription_tier key
        const clone = cloneDeep(this.data[projectId])
        clone.subscription_tier = subscriptionInfo.tier.supabase_prod_id
        this.data[projectId] = clone
      }
    }
  }
}
