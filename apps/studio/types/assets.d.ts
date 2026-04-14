declare module '*.scss' {
  export const styles: Record<string, string>
  export default styles
}

declare module 'config/tailwind.config' {
  import type { Config } from 'tailwindcss'
  const wrapper: (tailwindConfig: Partial<Config>) => Config
  export default wrapper
}
