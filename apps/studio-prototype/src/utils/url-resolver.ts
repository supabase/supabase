export function resolveHideBranchesDropdown(
  pathName: string,
  organization: string | undefined,
  project: string | undefined
) {
  return (
    (pathName.startsWith(`/${organization}/settings`) &&
      !pathName.startsWith(`/${organization}/settings/project`)) ||
    pathName.startsWith(`/${organization}/settings/project/${project}/general`) ||
    pathName.startsWith(`/${organization}/settings/project/${project}/infrastructure`) ||
    pathName.startsWith(`/${organization}/settings/project/${project}/api`) ||
    pathName.startsWith(`/${organization}/settings/project/${project}/integrations`) ||
    pathName.startsWith(`/${organization}/settings/project/${project}/add-ons`) ||
    pathName.startsWith(`/${organization}/settings/project/${project}/branching`)
  )
}
