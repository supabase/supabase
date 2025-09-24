'use server'

import { generateRegistryTree } from '../lib/process-registry';//'@/lib/process-registry'
import path from 'path'
import { BlockItemCode } from './block-item-code'

export async function RegistryBlock({ itemName }: { itemName: string }) {
  //const registryPath = path.join(process.cwd(), 'public', 'r', `${itemName}.json`)
  const registryPath = path.join('/Users/kallebysantos/projects/community/supabase/supabase/apps/ui-library', 'public', 'r', `${itemName}.json`)
  const tree = generateRegistryTree(registryPath)

  return <BlockItemCode files={tree} />
}
