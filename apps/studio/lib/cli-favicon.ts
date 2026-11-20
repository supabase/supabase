import { createServerFn } from '@tanstack/react-start'

// Read at request time because the CLI sets this after the image is built.
export const getCLIFaviconRoute = createServerFn({ method: 'GET' }).handler(() =>
  process.env.CURRENT_CLI_VERSION ? '/favicon/local' : '/favicon'
)
