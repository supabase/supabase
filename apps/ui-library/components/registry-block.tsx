'use server'

import { generateRegistryTree } from '../lib/process-registry';//'@/lib/process-registry'
import path from 'path'
import { BlockItemCode } from './block-item-code'

const REGISTRY_BASE_URL = process.env.NEXT_PUBLIC_UI_LIBRARY_REGISTRY_URL
  || process.env.NEXT_PUBLIC_SITE_URL
  || path.join(process.cwd(), 'public');

export async function RegistryBlock({ itemName }: { itemName: string }) {
  // http://ui-library/ui/r/${itemName}.json
  const registryPath = path.join(REGISTRY_BASE_URL, 'r', `${itemName}.json`)

  const tree = await generateRegistryTree(registryPath)

  return <BlockItemCode files={tree} />
}
