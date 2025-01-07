import type { Config } from '@react-router/dev/config'

export default {
  basename: process.env.NEXT_PUBLIC_BASE_PATH ?? '/',
  ssr: false,
} satisfies Config
