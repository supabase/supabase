// @ts-ignore - built at `vite build` time, not present in source
import handler from '../dist/server/server.js'

// eslint-disable-next-line import/no-anonymous-default-export, no-restricted-exports
export default (request) => handler.fetch(request)
