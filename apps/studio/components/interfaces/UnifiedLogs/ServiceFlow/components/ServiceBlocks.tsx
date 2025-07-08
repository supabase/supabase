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
const MemoizedGoTrueBlock = createBlock(authBlockConfig)

const MemoizedPostgRESTBlock = createBlock(postgrestBlockConfig)

const MemoizedNetworkBlock = createBlock(networkBlockConfig)

const MemoizedEdgeFunctionBlock = createBlock(edgeFunctionBlockConfig)

const MemoizedStorageBlock = createBlock(storageBlockConfig)

const MemoizedPostgresBlock = createBlock(postgresBlockConfig)

// Set display names for debugging
MemoizedGoTrueBlock.displayName = 'MemoizedGoTrueBlock'
MemoizedPostgRESTBlock.displayName = 'MemoizedPostgRESTBlock'
MemoizedNetworkBlock.displayName = 'MemoizedNetworkBlock'
MemoizedEdgeFunctionBlock.displayName = 'MemoizedEdgeFunctionBlock'
MemoizedStorageBlock.displayName = 'MemoizedStorageBlock'
MemoizedPostgresBlock.displayName = 'MemoizedPostgresBlock'

export {
  MemoizedEdgeFunctionBlock,
  MemoizedGoTrueBlock,
  MemoizedNetworkBlock,
  MemoizedPostgresBlock,
  MemoizedPostgRESTBlock,
  MemoizedStorageBlock,
}
