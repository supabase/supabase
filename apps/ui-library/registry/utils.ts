import lodash from 'lodash'
import type { RegistryItem } from 'shadcn/schema'

const { uniq, uniqBy } = lodash

const registryItemAppend = (item: RegistryItem, items: RegistryItem[]) => {
  const neededRegDependencies = [
    ...(item.registryDependencies || []),
    ...items.flatMap((i) => i.registryDependencies),
  ]
  const neededDependencies = [...(item.dependencies || []), ...items.flatMap((i) => i.dependencies)]
  const neededFiles = [...(item.files || []), ...items.flatMap((i) => i.files)]

  const registryBlock = {
    ...item,
    registryDependencies: uniq(neededRegDependencies),
    dependencies: uniq(neededDependencies),
    files: uniqBy(neededFiles, (file) => file?.path),
    docs: (item.docs, items.flatMap((i) => i.docs)).filter(Boolean).join('\n\n'),
    // merge all environment variables
    envVars: {
      ...item.envVars,
      ...items.reduce((acc, i) => ({ ...acc, ...i.envVars }), {}),
    },
  }

  return registryBlock
}

export { registryItemAppend }
