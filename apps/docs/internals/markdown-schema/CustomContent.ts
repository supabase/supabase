import { resolveSharedDataPath } from '~/components/SharedData.utils'
import {
  getCustomContent,
  type CustomContent as CustomContentKey,
} from '~/lib/custom-content/getCustomContent'

export const CustomContent = ({
  props,
  children,
}: {
  props: Record<string, unknown>
  children: string
}): string => {
  const key = String(props.data ?? '') as CustomContentKey
  const result = getCustomContent([key])
  const value = Object.values(result)[0]
  if (value == null) return ''

  const path = children.trim()
  if (!path) return typeof value === 'string' ? value : JSON.stringify(value)

  const resolved = resolveSharedDataPath(value, path)
  return resolved != null ? String(resolved) : ''
}
