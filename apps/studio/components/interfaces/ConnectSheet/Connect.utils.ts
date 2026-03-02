import { FRAMEWORKS, MOBILES } from './Connect.constants'

type FieldValue = string | boolean | string[] | undefined

interface FrameworkLibraryInput {
  framework?: FieldValue
  frameworkVariant?: FieldValue
  library?: FieldValue
  [key: string]: FieldValue
}

export function resolveFrameworkLibraryKey(state: FrameworkLibraryInput): string | null {
  const { framework, frameworkVariant, library } = state

  if (!framework) return null

  if (library) return String(library)

  const allFrameworks = [...FRAMEWORKS, ...MOBILES]
  const selectedFramework = allFrameworks.find((f) => f.key === framework)

  if (!selectedFramework?.children?.length) return null

  if (frameworkVariant) {
    const variant = selectedFramework.children.find((c) => c.key === frameworkVariant)
    if (variant?.children?.length) {
      return variant.children[0].key
    }
  }

  const firstChild = selectedFramework.children[0]
  if (firstChild?.children?.length) {
    return firstChild.children[0].key
  }

  return firstChild?.key ?? null
}
