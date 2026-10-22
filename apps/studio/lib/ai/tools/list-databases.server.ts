import { getAuthHeaders } from './auth-headers'
import { contract } from './list-databases'
import { toolFromContract } from './tool-from-contract'
import type { ToolFactory } from './types'
import { getReadReplicas } from '@/data/read-replicas/replicas-query'

export const createTool: ToolFactory<typeof contract> = (ctx) => {
  const { projectRef } = ctx
  const authHeaders = getAuthHeaders(ctx.authorization)

  return toolFromContract(contract, ctx, async (_input, { abortSignal }) => {
    const databases = await getReadReplicas({ projectRef }, abortSignal, authHeaders)

    return {
      databases: (databases ?? []).map((database) => ({
        identifier: database.identifier,
        is_primary: database.identifier === projectRef,
        region: database.region,
        status: database.status,
      })),
    }
  })
}
