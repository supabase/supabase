import { cn as uiCN } from 'ui'

export const cn = uiCN

export function absoluteUrl(path: string) {
  return `${process.env.NEXT_PUBLIC_APP_URL}${path}`
}
