export const getInfrastructurePath = (projectRef?: string) =>
  `/project/${projectRef ?? '_'}/settings/infrastructure`

export const getReadReplicaPath = (projectRef: string | undefined, replicaId: string) =>
  `/project/${projectRef ?? '_'}/settings/infrastructure/replica/${replicaId}`

export const getAddReadReplicaPath = (projectRef?: string) =>
  `/project/${projectRef ?? '_'}/settings/infrastructure?addReplica=true`
