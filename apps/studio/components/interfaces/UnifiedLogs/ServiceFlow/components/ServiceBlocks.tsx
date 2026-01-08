import {
  authBlockConfig,
  edgeFunctionBlockConfig,
  networkBlockConfig,
  postgresBlockConfig,
  postgrestBlockConfig,
  storageBlockConfig,
} from '../config/blockConfigs'
import { createBlock } from './shared/Block'

// Generate all block components
export const MemoizedGoTrueBlock = createBlock(authBlockConfig)
MemoizedGoTrueBlock.displayName = 'MemoizedGoTrueBlock'

export const MemoizedPostgRESTBlock = createBlock(postgrestBlockConfig)
MemoizedPostgRESTBlock.displayName = 'MemoizedPostgRESTBlock'

export const MemoizedNetworkBlock = createBlock(networkBlockConfig)
MemoizedNetworkBlock.displayName = 'MemoizedNetworkBlock'

export const MemoizedEdgeFunctionBlock = createBlock(edgeFunctionBlockConfig)
MemoizedEdgeFunctionBlock.displayName = 'MemoizedEdgeFunctionBlock'

export const MemoizedStorageBlock = createBlock(storageBlockConfig)
MemoizedStorageBlock.displayName = 'MemoizedStorageBlock'

export const MemoizedPostgresBlock = createBlock(postgresBlockConfig)
MemoizedPostgresBlock.displayName = 'MemoizedPostgresBlock'
