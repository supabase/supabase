import { cloneDeep } from 'lodash'
import { values } from 'mobx'
import { Organization, Project } from 'types'

import { API_URL, STRIPE_PRODUCT_IDS } from 'lib/constants'
import { IRootStore } from '../RootStore'
import DatabaseStore, { IDatabaseStore } from './DatabaseStore'
import OrganizationStore from './OrganizationStore'
import ProjectStore from './ProjectStore'

export interface IAppStore {
  projects: ProjectStore
  organizations: OrganizationStore
  database: IDatabaseStore
  onProjectUpdated: (project: any) => void
  onProjectDeleted: (project: any) => void
  onOrgAdded: (org: any) => void
  onOrgUpdated: (org: any) => void
  onOrgDeleted: (org: any) => void
}
export default class AppStore implements IAppStore {
  rootStore: IRootStore
  projects: ProjectStore
  organizations: OrganizationStore
  database: DatabaseStore

  baseUrl: string

  constructor(rootStore: IRootStore) {
    this.rootStore = rootStore
    this.baseUrl = API_URL || '/api'

    const headers: any = {}

    this.projects = new ProjectStore(rootStore, `${this.baseUrl}/projects`, headers)
    this.organizations = new OrganizationStore(rootStore, `${this.baseUrl}/organizations`, headers)
    this.database = new DatabaseStore(rootStore, `${this.baseUrl}/database`, headers)
  }

  onProjectUpdated(project: any) {
    if (project && project.id) {
      const kpsVersion =
        project.services?.length > 0
          ? project.services[0]?.infrastructure[0]?.app_versions?.version
          : undefined
      const clone: any = cloneDeep((this.projects.data as any)[project.id])
      clone.kpsVersion = kpsVersion
      clone.name = project.name
      clone.status = project.status
      clone.services = project.services
      ;(this.projects.data as any)[project.id] = clone
    }
  }

  onProjectDeleted(project: any) {
    if (project && project.id) {
      // cleanup project saved queries
      localStorage.removeItem(`supabase-queries-state-${project.ref}`)
      localStorage.removeItem(`supabase_${project.ref}`)
      delete this.projects.data[project.id]
    }
  }

  onOrgUpdated(updatedOrg: Organization) {
    if (updatedOrg && updatedOrg.id) {
      const originalOrg = this.organizations.data[updatedOrg.id]
      this.organizations.data[updatedOrg.id] = {
        ...originalOrg,
        ...updatedOrg,
      }
    }
  }

  onOrgAdded(org: Organization) {
    if (org && org.id) {
      this.organizations.data[org.id] = org
    }
  }

  onOrgDeleted(org: Organization) {
    if (org && org.id) {
      const projects = values(this.projects.data)
      // cleanup projects saved queries
      const removedprojects = projects.filter(
        (project: Project) => project.organization_id === org.id
      )
      removedprojects.forEach((project: Project) => {
        localStorage.removeItem(`supabase-queries-state-${project.ref}`)
        localStorage.removeItem(`supabase_${project.ref}`)
      })
      // remove projects belong to removed org
      const updatedProjects = projects.filter(
        (project: Project) => project.organization_id != org.id
      )
      this.projects.data = updatedProjects.reduce((map: any, x: any) => {
        map[x.id] = { ...x }
        return map
      }, {})
      delete (this.organizations.data as any)[org.id]
    }
  }
}
