import { contract } from './deploy-edge-function'
import { toolFromContract } from './tool-from-contract'
import type { ToolFactory } from './types'
import { deployEdgeFunction } from '@/data/edge-functions/edge-functions-deploy-mutation'

export const createTool: ToolFactory<typeof contract> = (ctx) =>
  toolFromContract(contract, ctx, async ({ name, code }) => {
    await deployEdgeFunction({
      projectRef: ctx.projectRef ?? '',
      slug: name,
      metadata: {
        entrypoint_path: 'index.ts',
        name,
        verify_jwt: true,
      },
      files: [{ name: 'index.ts', content: code }],
      authorization: ctx.authorization,
    })
    return { success: true }
  })
