import { memo } from 'react'
import { ServiceFlowBlockProps } from '../types'
import { Block, MemoizedBlock, BlockConfig } from './shared/Block'
import {
  authBlockConfig,
  postgrestBlockConfig,
  networkBlockConfig,
  edgeFunctionBlockConfig,
  storageBlockConfig,
  postgresBlockConfig,
} from '../config/blockConfigs'

// Factory function to create block components
const createBlockComponent = (config: BlockConfig) => {
  const BlockComponent = memo((props: ServiceFlowBlockProps) => {
    return <Block config={config} {...props} />
  })

  const MemoizedBlockComponent = memo((props: ServiceFlowBlockProps) => {
    return <MemoizedBlock config={config} {...props} />
  })

  return { BlockComponent, MemoizedBlockComponent }
}

// Generate all block components
const { BlockComponent: GoTrueBlock, MemoizedBlockComponent: MemoizedGoTrueBlock } =
  createBlockComponent(authBlockConfig)

const { BlockComponent: PostgRESTBlock, MemoizedBlockComponent: MemoizedPostgRESTBlock } =
  createBlockComponent(postgrestBlockConfig)

const { BlockComponent: NetworkBlock, MemoizedBlockComponent: MemoizedNetworkBlock } =
  createBlockComponent(networkBlockConfig)

const { BlockComponent: EdgeFunctionBlock, MemoizedBlockComponent: MemoizedEdgeFunctionBlock } =
  createBlockComponent(edgeFunctionBlockConfig)

const { BlockComponent: StorageBlock, MemoizedBlockComponent: MemoizedStorageBlock } =
  createBlockComponent(storageBlockConfig)

const { BlockComponent: PostgresBlock, MemoizedBlockComponent: MemoizedPostgresBlock } =
  createBlockComponent(postgresBlockConfig)

// Set display names for debugging
GoTrueBlock.displayName = 'GoTrueBlock'
PostgRESTBlock.displayName = 'PostgRESTBlock'
NetworkBlock.displayName = 'NetworkBlock'
EdgeFunctionBlock.displayName = 'EdgeFunctionBlock'
StorageBlock.displayName = 'StorageBlock'
PostgresBlock.displayName = 'PostgresBlock'

export {
  GoTrueBlock,
  MemoizedGoTrueBlock,
  PostgRESTBlock,
  MemoizedPostgRESTBlock,
  NetworkBlock,
  MemoizedNetworkBlock,
  EdgeFunctionBlock,
  MemoizedEdgeFunctionBlock,
  StorageBlock,
  MemoizedStorageBlock,
  PostgresBlock,
  MemoizedPostgresBlock,
}
