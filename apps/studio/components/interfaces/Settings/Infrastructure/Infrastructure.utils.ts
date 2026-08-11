export const getInfrastructurePath = (projectRef?: string) =>
  `/project/${projectRef ?? '_'}/settings/infrastructure`
