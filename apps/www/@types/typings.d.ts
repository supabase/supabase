declare module '*.json' {
  const value: any
  export default value
}

declare module '*.mdx' {
  import type { ComponentType } from 'react'
  const MDXComponent: ComponentType<any>
  export default MDXComponent
}
