// The Option 1 navigation. Exports here replace today's navigation of the same name.
// Each export name is the menu ID that a guide's URL prefix resolves to.
export * from '@/components/Navigation/NavigationMenu/NavigationMenu.constants'
export { ai } from './option1/ai'
export { aiTools as ai_tools } from './option1/aiTools'
export { apis as api, apis as graphql, apis as realtime } from './option1/apis'
export { auth } from './option1/auth'
export { cronAndQueues as cron, cronAndQueues as queues } from './option1/cronAndQueues'
export { database } from './option1/database'
export { deployment } from './option1/deployment'
export { functions } from './option1/functions'
export { integrations } from './option1/integrations'
export { localDevelopment as local_development } from './option1/localDevelopment'
export {
  runAndManage as platform,
  runAndManage as security,
  runAndManage as telemetry,
} from './option1/runAndManage'
export { selfHosting as self_hosting } from './option1/selfHosting'
export { start as gettingstarted } from './option1/start'
export { storage } from './option1/storage'
export { GLOBAL_MENU_ITEMS } from './option1/topNav'
