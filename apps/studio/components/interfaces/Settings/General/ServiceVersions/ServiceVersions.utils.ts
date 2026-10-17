export const getServiceVersionsPath = (projectRef?: string) =>
  `/project/${projectRef ?? '_'}/settings/general#service-versions`
