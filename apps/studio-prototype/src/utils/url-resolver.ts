export function resolveHideBranchesDropdown(
  pathName: string,
  organizationKey: string | undefined,
  projectKey: string | undefined
) {
  return (
    (pathName.startsWith(`/${organizationKey}/settings`) &&
      !pathName.startsWith(`/${organizationKey}/settings/project`)) ||
    pathName.startsWith(`/${organizationKey}/settings/project/${projectKey}/general`) ||
    pathName.startsWith(`/${organizationKey}/settings/project/${projectKey}/infrastructure`) ||
    pathName.startsWith(`/${organizationKey}/settings/project/${projectKey}/api`) ||
    pathName.startsWith(`/${organizationKey}/settings/project/${projectKey}/integrations`) ||
    pathName.startsWith(`/${organizationKey}/settings/project/${projectKey}/add-ons`) ||
    pathName.startsWith(`/${organizationKey}/settings/project/${projectKey}/branching`)
  )
}

export function resolveHideProjectsDropdown(
  pathName: string,
  organizationKey: string | undefined,
  projectKey: string | undefined
) {
  return (
    pathName.startsWith(`/${organizationKey}/settings`) &&
    !pathName.startsWith(`/${organizationKey}/settings/project/${projectKey}`) &&
    !pathName.startsWith(`/${organizationKey}/settings/account`)
  )
}
