import { getProjectSettings } from 'data/config/project-settings-v2-query'
import { getProjectDetail } from 'data/projects/project-detail-query'

export const getProjectAIDetails = async ({
  projectRef,
  authorization,
}: {
  projectRef: string
  authorization: string
}) => {
  const headers = {
    'Content-Type': 'application/json',
    ...(authorization && { Authorization: authorization }),
  }

  const [selectedProject, projectSettings] = await Promise.all([
    getProjectDetail({ ref: projectRef }, undefined, headers),
    getProjectSettings({ projectRef }, undefined, headers),
  ])

  return {
    region: selectedProject?.region,
    isSensitive: projectSettings?.is_sensitive,
  }
}
