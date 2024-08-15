import { readdir } from 'node:fs/promises'
import { extname, join } from 'node:path'
import {
  GLOBAL_MENU_ITEMS,
  gettingstarted,
  cli,
  auth,
  database,
  api,
  graphql,
  functions,
  realtime,
  storage,
  ai,
  supabase_cli,
  platform,
  resources,
  self_hosting,
  migrate,
} from '../../components/Navigation/NavigationMenu/NavigationMenu.constants'

const DOCS_ROOT_DIR = join(__dirname, '..', '..')
const DEFAULT_DOCS_CONTENT_DIR = join(DOCS_ROOT_DIR, 'content')

const DOCS_CONTENT_DIR = process.env.DOCS_CONTENT_DIR || DEFAULT_DOCS_CONTENT_DIR

const IGNORE_LIST = [
  /**
   * This is linked from the Edge Functions examples page though not from the
   * main nav.
   */
  'guides/functions/examples/github-actions',
  /**
   * Auth helpers are deprecated and hidden but still available for legacy
   * users if they need it.
   */
  'guides/auth/auth-helpers',
  'guides/auth/auth-helpers/nextjs-pages',
  'guides/auth/auth-helpers/nextjs',
  'guides/auth/auth-helpers/remix',
  'guides/auth/auth-helpers/sveltekit',
]

type RefItem = {
  href?: string
  url?: string
  items?: RefItem[]
}

const recGetUrl = (items: readonly RefItem[], acc: string[] = []) =>
  items.reduce((acc, item) => {
    if (item.href || item.url) acc.push(item.href || item.url)
    if (item.items) acc.push(...recGetUrl(item.items, acc))
    return acc
  }, acc)

const main = async () => {
  try {
    const savedFiles = (await readdir(DOCS_CONTENT_DIR, { recursive: true }))
      .filter((file) => extname(file) === '.mdx')
      .map((file) => file.replace(/\.mdx$/, ''))

    const flattenedGlobalMenuItems = GLOBAL_MENU_ITEMS.flat() as RefItem[]
    const pagesToPublish = [
      flattenedGlobalMenuItems,
      gettingstarted.items,
      cli.items,
      auth.items,
      database.items,
      api.items,
      graphql.items,
      functions.items,
      realtime.items,
      storage.items,
      ai.items,
      supabase_cli.items,
      platform.items,
      resources.items,
      self_hosting.items,
      migrate.items,
    ]
      .flatMap((items) => recGetUrl(items))
      // Remove initial slash
      .map((path) => path.substring(1))

    const extraPages = savedFiles.filter(
      (file) => !pagesToPublish.includes(file) && !IGNORE_LIST.includes(file)
    )
    console.log(extraPages)
  } catch (err) {
    console.error(err)
    process.exit(1)
  }
}

main()
