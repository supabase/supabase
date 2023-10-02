import { remarkCodeHike } from '@code-hike/mdx'

declare module '@code-hike/mdx' {
  export type CodeHikeRemarkPlugin = typeof remarkCodeHike
  export type CodeHikeConfig = Parameters<CodeHikeRemarkPlugin>[0]
}
