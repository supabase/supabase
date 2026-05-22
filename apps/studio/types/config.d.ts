declare module 'config/tailwind.config' {
  import type { Config } from 'tailwindcss'
  const wrapper: (tailwindConfig: Partial<Config>) => Config
  // eslint-disable-next-line no-restricted-exports
  export default wrapper
}
