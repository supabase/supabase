import { cloneDeep } from 'lodash'
import { Project } from 'types'
import { IRootStore } from '../RootStore'
import { constructHeaders } from 'lib/api/apiHelpers'
import { get } from 'lib/common/fetch'
import { PROJECT_STATUS } from 'lib/constants'
import PostgresMetaInterface, { IPostgresMetaInterface } from '../common/PostgresMetaInterface'

import pingPostgrest from 'lib/pingPostgrest'

export interface IProjectStore extends IPostgresMetaInterface<Project> {
  fetchDetail: (projectRef: string) => void
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
      if (
        project.status === PROJECT_STATUS.ACTIVE_HEALTHY &&
        project.restUrl &&
        project.internalApiKey
      ) {
        const success = await pingPostgrest(project.restUrl, project.internalApiKey, {
          kpsVersion: project.kpsVersion,
        })
        project.postgrestStatus = success ? 'ONLINE' : 'OFFLINE'
      }
      this.data[project.id] = project

      // lazy fetchs
      this.fetchSubscriptionTier(project.id, project.ref)
    }
  }

  async fetchSubscriptionTier(projectId: number, projectRef: string) {
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
