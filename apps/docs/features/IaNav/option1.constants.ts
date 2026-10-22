// The Option 1 navigation. Exports here replace today's navigation of the same name.
export * from '@/components/Navigation/NavigationMenu/NavigationMenu.constants'
export { GLOBAL_MENU_ITEMS } from './option1/topNav'
export {
  runAndManage as platform,
  runAndManage as security,
  runAndManage as telemetry,
} from './option1/runAndManage'
