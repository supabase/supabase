const rawBasePath = process.env.NEXT_PUBLIC_BASE_PATH || 'design-system'

export const BASE_PATH = rawBasePath.startsWith('/') ? rawBasePath : `/${rawBasePath}`
