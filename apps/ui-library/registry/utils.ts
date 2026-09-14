import lodash from 'lodash'
import type { RegistryItem } from 'shadcn/schema'

import { uniqueInstalledFiles } from '../lib/registry-resolution'

const { uniq } = lodash

const registryItemAppend = (item: RegistryItem, items: RegistryItem[]) => {
  const neededRegDependencies = [
    ...(item.registryDependencies || []),
    ...items.flatMap((i) => i.registryDependencies ?? []),
  ]
  const neededDependencies = [
    ...(item.dependencies || []),
    ...items.flatMap((i) => i.dependencies ?? []),
  ]
  const neededFiles = [...(item.files || []), ...items.flatMap((i) => i.files ?? [])]

  const registryBlock = {
    ...item,
    registryDependencies: uniq(neededRegDependencies),
    dependencies: uniq(neededDependencies),
    files: uniqueInstalledFiles(neededFiles, `Registry item "${item.name}"`),
    docs: [item.docs, ...items.map((i) => i.docs)].filter(Boolean).join('\n\n'),
    // merge all environment variables
    envVars: {
      ...item.envVars,
      ...items.reduce((acc, i) => ({ ...acc, ...i.envVars }), {}),
    },
  }

  return registryBlock
}

export { registryItemAppend }
