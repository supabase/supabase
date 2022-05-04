import { cloneDeep } from 'lodash'
import { Project } from 'types'
import { IRootStore } from '../RootStore'
import { constructHeaders } from 'lib/api/apiHelpers'
import { get } from 'lib/common/fetch'
import { PROJECT_STATUS } from 'lib/constants'
import PostgresMetaInterface, { IPostgresMetaInterface } from '../common/PostgresMetaInterface'

import pingPostgrest from 'lib/pingPostgrest'

export interface IProjectStore extends IPostgresMetaInterface<Project> {
  fetchDetail: (projectRef: string) => Promise<void>
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

  async fetchDetail(projectRef: string) {
    const url = `${this.url}/${projectRef}`
    const headers = constructHeaders(this.headers)
    const response = await get(url, { headers })

    if (!response.error) {
      const project = response as Project
      // to improve UX, we wait for PingPostgrest result before continue
      project.postgrestStatus = await this.pingPostgrest(project)
      // update project detail by key id
      this.data[project.id] = project

      // lazy fetches
      this.fetchSubscriptionTier(project)
    }
  }

  async pingPostgrest(project: Project): Promise<'ONLINE' | 'OFFLINE' | undefined> {
    if (
      project.status === PROJECT_STATUS.ACTIVE_HEALTHY &&
      project.restUrl &&
      project.internalApiKey
    ) {
      const success = await pingPostgrest(project.restUrl, project.internalApiKey, {
        kpsVersion: project.kpsVersion,
      })
      return success ? 'ONLINE' : 'OFFLINE'
    }
    return undefined
  }

  async fetchSubscriptionTier(project: Project) {
    const { id: projectId, ref: projectRef, status } = project
    if (status === PROJECT_STATUS.ACTIVE_HEALTHY) {
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
