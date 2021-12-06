// @ts-nocheck
import { IconArchive, IconDatabase, IconHeart, IconKey } from '@supabase/ui'
import { concat, sortBy } from 'lodash'

// Ideally we'd split this into smaller, more scoped and easily readable files
// And shift them under common/constants/xxx.ts

export const IS_PLATFORM = process.env.NEXT_PUBLIC_IS_PLATFORM === 'true'
export const API_URL = IS_PLATFORM ? process.env.NEXT_PUBLIC_API_URL : '/api'
export const PG_META_URL = IS_PLATFORM
  ? process.env.PLATFORM_PG_META_URL
  : process.env.STUDIO_PG_META_URL

export const POSTGRES_SUPER_ADMIN = 'supabase_admin'
export const POSTGRES_AUTH_ADMIN = 'supabase_auth_admin'
export const POSTGRES_STORAGE_ADMIN = 'supabase_storage_admin'
export const POSTGRES_POSTGREST = 'authenticator'
export const POSTGRES_PGBOUNCER = 'pgbouncer'

export const DATE_FORMAT = 'YYYY-MM-DDTHH:mm:ssZ'

export const QUEUES = {
  // All infra tasks
  INFRA: {
    id: 'infra',
    tasks: {
      CREATE: 'create', // initialises a new server
      DELETE: 'delete', // destroys a server
      UPDATE: 'update', // updates the server's config
      REPLACE: 'replace', // replace the server
    },
  },
  DB: {
    id: 'database',
    tasks: {
      CREATE: 'create', // initialises a new server
      DELETE: 'delete', // destroys a server
      UPDATE: 'update', // updates the server's config
      RESTORE: 'restore', // restore a db with a given backup file
    },
  },
  DUMP: {
    id: 'dump',
    tasks: {
      BULK_PREPARE: 'bulk_prepare',
      DUMP: 'dump',
      PREPARE: 'prepare',
    },
  },
  RESTORE: {
    id: 'restore',
    tasks: {
      PREPARE: 'prepare',
      RESTORE: 'restore',
    },
  },
  EVENTS: {
    id: 'events',
    tasks: {
      organization_created: 'organization.created',
      organization_updated: 'organization.updated',
      organization_deleted: 'organization.deleted',
      project_created: 'project.created',
      project_updated: 'project.updated',
      project_deleted: 'project.deleted',
    },
  },
}

// alias regions remain as the starting point for project creation
// they are immediately translated to their respective cloud regions
// and are afterward never referred to
export const REGIONS = {
  WEST_US: 'West US (North California)',
  EAST_US: 'East US (North Virginia)',
  CENTRAL_CANADA: 'Canada (Central)',
  WEST_EU: 'West EU (Ireland)',
  WEST_EU_2: 'West EU (London)',
  // 'North EU': 'North EU',
  CENTRAL_EU: 'Central EU (Frankfurt)',
  SOUTH_ASIA: 'South Asia (Mumbai)',
  SOUTHEAST_ASIA: 'Southeast Asia (Singapore)',
  NORTHEAST_ASIA: 'Northeast Asia (Tokyo)',
  NORTHEAST_ASIA_2: 'Northeast Asia (Seoul)',
  OCEANIA: 'Oceania (Sydney)',
  SOUTH_AMERICA: 'South America (São Paulo)',
  // SOUTH_AFRICA: 'South Africa (Cape Town)',
}

export const REGIONS_DEFAULT = REGIONS.EAST_US

export const PROVIDERS = {
  // Digital Ocean
  DO: {
    id: 'DO',
    name: 'digitalocean',
    DEFAULT_SSH_KEY: '26347828',
    regions: {
      EAST_US: 'nyc1', // New York City, United States
      // 'North EU': 'ams3', //Amsterdam, the Netherlands
      WEST_US: 'sfo2', // San Francisco, United States
      SOUTHEAST_ASIA: 'sgp1', // Singapore
      WEST_US: 'lon1', // London
      CENTRAL_EU: 'fra1', // Frankfurt
      CENTRAL_CANADA: 'tor1', // Toronto
      SOUTH_ASIA: 'blr1', // Bangalore
    },
    sizes: {
      512: '512mb', // Don't use - https://developers.digitalocean.com/documentation/changelog/api-v2/new-size-slugs-for-droplet-plan-changes/
      's-1vcpu-1gb': {
        id: 's-1vcpu-1gb',
        description: '',
      },
    },
  },
  AWS: {
    id: 'AWS',
    name: 'aws',
    DEFAULT_SSH_KEY: 'supabase-app-instance',
    regions: {
      EAST_US: 'us-east-1', // North Virginia
      // 'North EU': 'eu-north-1', // Stockholm
      WEST_US: 'us-west-1', // North California
      SOUTHEAST_ASIA: 'ap-southeast-1', // Singapore
      NORTHEAST_ASIA: 'ap-northeast-1', // Tokyo
      NORTHEAST_ASIA_2: 'ap-northeast-2', //Seoul
      OCEANIA: 'ap-southeast-2', // Sydney
      WEST_EU: 'eu-west-1', // Ireland
      WEST_EU_2: 'eu-west-2', // London
      CENTRAL_EU: 'eu-central-1', // Frankfurt
      CENTRAL_CANADA: 'ca-central-1', // Central Canada
      SOUTH_ASIA: 'ap-south-1', // Mumbai
      SOUTH_AMERICA: 'sa-east-1', // Sao Paulo
      // SOUTH_AFRICA: 'af-south-1', // Cape Town
    },
    sizes: {
      nano: {
        x86_64: 't3.nano',
        arm64: 't4g.nano',
        description: '512mb RAM',
      },
      micro: {
        x86_64: 't3.micro',
        arm64: 't4g.micro',
        description: '1gb RAM',
      },
      medium: {
        x86_64: 'm5a.large',
        arm64: 'm6g.medium',
        description: '4gb RAM',
      },
    },
  },
}

// @todo ini update for prod
export const AWS_SUPPORTED_AZ = {
  EAST_US: ['us-east-1a', 'us-east-1b', 'us-east-1c', 'us-east-1d', 'us-east-1e', 'us-east-1f'],
  SOUTHEAST_ASIA: ['ap-southeast-1a', 'ap-southeast-1b', 'ap-southeast-1c'],
  WEST_EU: ['eu-west-1a', 'eu-west-1b', 'eu-west-1c'],
}

export const SERVICE_STATUS = {
  INACTIVE: 'INACTIVE',
  ACTIVE_HEALTHY: 'ACTIVE_HEALTHY',
  ACTIVE_UNHEALTHY: 'ACTIVE_UNHEALTHY',
  COMING_UP: 'COMING_UP',
  UNKNOWN: 'UNKNOWN',
  GOING_DOWN: 'GOING_DOWN',
  INIT_FAILED: 'INIT_FAILED',
  REMOVED: 'REMOVED',
}

export const PROJECT_STATUS = {
  INACTIVE: 'INACTIVE',
  ACTIVE_HEALTHY: 'ACTIVE_HEALTHY',
  ACTIVE_UNHEALTHY: 'ACTIVE_UNHEALTHY',
  COMING_UP: 'COMING_UP',
  UNKNOWN: 'UNKNOWN',
  GOING_DOWN: 'GOING_DOWN',
  INIT_FAILED: 'INIT_FAILED',
  REMOVED: 'REMOVED',
  RESTORING: 'RESTORING',
}

// Not used anywhere but referenced in a comment in interfaces.js (L12)
export const APPS = {
  AUTO_API: {
    id: 'AUTO_API',
    name: 'Auto API',
  },
}

export const SIDE_PANEL_KEYS = {
  ROW: 'ROW',
  TABLE: 'TABLE',
  COLUMN: 'COLUMN',
}

export const FILTER_CONDITIONS = {
  EQ: {
    name: 'EQ',
    tooltip: 'Equals to',
  },
  NEQ: {
    name: 'NEQ',
    tooltip: 'Not equals to',
  },
  GT: {
    name: 'GT',
    tooltip: 'Greater than',
  },
  LT: {
    name: 'LT',
    tooltip: 'Less than',
  },
  GTE: {
    name: 'GTE',
    tooltip: 'Greater than or equals to',
  },
  LTE: {
    name: 'LTE',
    tooltip: 'Less than or equals to',
  },
  LIKE: {
    name: 'LIKE',
    tooltip: 'Pattern matching with %',
  },
  ILIKE: {
    name: 'ILIKE',
    tooltip: 'Case sensitive matching',
  },
  IS: {
    name: 'IS',
    tooltip: 'Checks for exact quality',
  },
  IN: {
    name: 'IN',
    tooltip: 'Checks if value in list',
  },
}

// Data types primarily for mapping icon in editor

export const NUMERICAL_TYPES = ['int2', 'int4', 'int8', 'float4', 'float8']
export const JSON_TYPES = ['json', 'jsonb']
export const TEXT_TYPES = ['text', 'varchar']
export const TIMESTAMP_TYPES = ['date', 'time', 'timestamp', 'timetz', 'timestamptz']
export const OTHER_DATA_TYPES = ['uuid', 'bool']
export const POSTGRES_DATA_TYPES = sortBy(
  concat(NUMERICAL_TYPES, JSON_TYPES, TEXT_TYPES, TIMESTAMP_TYPES, OTHER_DATA_TYPES)
)

// Keyboard Shortcuts Related
export const SHORTCUT_KEYS = {
  VIEW_ALL_SHORTCUTS: 'VIEW_ALL_SHORTCUTS',
  TOGGLE_FILTER_MENU: 'TOGGLE_FILTER_MENU',
  TOGGLE_SORT_MENU: 'TOGGLE_SORT_MENU',
  CLOSE_SIDE_PANEL: 'CLOSE_SIDE_PANEL',
  EDIT_CELL: 'EDIT_CELL',
  COPY_CELL: 'COPY_CELL',
  PASTE_CELL: 'PASTE_CELL',
  CREATE_ROW: 'CREATE_ROW',
  EDIT_ROW: 'EDIT_ROW',
  DELETE_ROW: 'DELETE_ROW',
  SCROLL_EDGES: 'SCROLL_EDGES',
}

export const GENERAL_SHORTCUTS = [
  {
    key: SHORTCUT_KEYS.VIEW_ALL_SHORTCUTS,
    name: 'View all shortcuts',
    keys: ['Shift+/'],
  },
  {
    key: SHORTCUT_KEYS.CLOSE_SIDE_PANEL,
    name: 'Close side panel',
    keys: ['Esc'],
  },
]

export const generateEditorShortcuts = (clientOS) => {
  let metaKey = '⌘'
  if (clientOS === 'windows') metaKey = 'Ctrl'
  return [
    {
      key: SHORTCUT_KEYS.EDIT_CELL,
      name: 'Edit current cell',
      keys: ['Enter'],
    },
    {
      key: SHORTCUT_KEYS.COPY_CELL,
      name: 'Copy value of current cell',
      keys: [`${metaKey}+C`],
    },
    {
      key: SHORTCUT_KEYS.PASTE_CELL,
      name: 'Paste value into current cell',
      keys: [`${metaKey}+V`],
    },
    {
      key: SHORTCUT_KEYS.CREATE_ROW,
      name: 'Create a new row',
      keys: ['Shift+Enter'],
    },
    {
      key: SHORTCUT_KEYS.SCROLL_EDGES,
      name: 'Scroll to edges of the table',
      keys: [`${metaKey}+↑`, `${metaKey}+→`, `${metaKey}+↓`, `${metaKey}+←`],
    },
  ]
}

export const EDITOR_STATUS = {
  SAVING: 'SAVING',
  READY: 'READY',
}

export const POLICY_MODAL_VIEWS = {
  SELECTION: 'SELECTION',
  TEMPLATES: 'TEMPLATES',
  EDITOR: 'EDITOR',
  REVIEW: 'REVIEW',
}

export const STRIPE_PRODUCT_IDS = {
  PAYG: process?.env?.NEXT_PUBLIC_STRIPE_PAYG_TIER_ID,
  PRO: process?.env?.NEXT_PUBLIC_STRIPE_PRO_TIER_ID,
  FREE: process?.env?.NEXT_PUBLIC_STRIPE_FREE_TIER_ID,
}

export const TIER_NAMES = {
  PAYG: 'Pay as you go',
  PRO: 'Pro',
  FREE: 'Free',
}

export const DEFAULT_PRODUCTS = [
  {
    // Free tier
    price: process?.env?.NEXT_PUBLIC_STRIPE_PRODUCT_FREE_TIER_PRICE_FREE,
  },
]

export const PGBOUNCER_CONFIG = {
  pool_mode: 'transaction',
  default_pool_size: 15,
  ignore_startup_parameters: 'extra_float_digits',
}

export const DEFAULT_ORG_PROJECTS_LIMIT = 3
export const DEFAULT_MINIMUM_PASSWORD_STRENGTH = 4

const METRIC_CATEGORIES_ICON_SIZE = 16

export const METRIC_CATEGORIES = {
  // API: {
  //   label: 'All API usage',
  //   icon: <IconActivity />,
  //   key: 'api',
  // },
  API_DATABASE: {
    label: 'Database API',
    icon: <IconDatabase size={ METRIC_CATEGORIES_ICON_SIZE } />,
key: 'api_database',
  },
API_AUTH: {
  label: 'Auth API',
    icon: <IconKey size={ METRIC_CATEGORIES_ICON_SIZE } />,
  key: 'api_auth',
  },
API_STORAGE: {
  label: 'Storage API',
    icon: <IconArchive size={ METRIC_CATEGORIES_ICON_SIZE } />,
  key: 'api_storage',
  },
// API_REALTIME: {
//   label: 'Realtime API',
//   icon: '',
//   key: 'api_realtime',
// },
INSTANCE: {
  label: 'Instance health',
    icon: <IconHeart size={ METRIC_CATEGORIES_ICON_SIZE } />,
  key: 'instance',
  },
  // POSTGRES: {
  //   label: 'Postgres usage',
  //   icon: '',
  //   key: 'postgres',
  // },
}

export const METRICS = [
  {
    key: 'cpu_usage',
    label: 'CPU % usage',
    provider: 'infra-monitoring',
    category: METRIC_CATEGORIES.INSTANCE,
  },
  {
    key: 'ram_usage',
    label: 'Memory % usage',
    provider: 'infra-monitoring',
    category: METRIC_CATEGORIES.INSTANCE,
  },
  {
    key: 'total_realtime_egress',
    label: 'Realtime Connection Egress',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API,
  },
  {
    key: 'total_realtime_get_requests',
    label: 'Realtime Connection Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_REALTIME,
  },
  {
    key: 'total_realtime_ingress',
    label: 'Realtime Connection Ingress',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_REALTIME,
  },
  // {
  //   key: 'total_realtime_post_requests',
  //   label: 'total_realtime_post_requests',
  //   provider: 'daily-stats',
  //   category: METRIC_CATEGORIES.API_REALTIME,
  // },
  {
    key: 'total_realtime_requests',
    label: 'Connection Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_REALTIME,
  },

  /**
   * API
   */
  {
    key: 'total_rest_ingress',
    label: 'API Ingress',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_DATABASE,
  },
  {
    key: 'total_rest_egress',
    label: 'API Egress',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_DATABASE,
  },
  {
    key: 'total_rest_requests',
    label: 'API Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_DATABASE,
  },
  {
    key: 'total_rest_get_requests',
    label: 'API GET Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_DATABASE,
  },
  {
    key: 'total_rest_post_requests',
    label: 'API POST Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_DATABASE,
  },
  {
    key: 'total_rest_patch_requests',
    label: 'API PATCH Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_DATABASE,
  },
  {
    key: 'total_rest_delete_requests',
    label: 'API DELETE Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_DATABASE,
  },
  {
    key: 'total_rest_options_requests',
    label: 'API OPTIONS Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_DATABASE,
  },

  /**
   * Auth
   */

  // {
  //   key: 'total_auth_users',
  //   label: 'Total Auth Users',
  //   provider: 'daily-stats',
  //   category: METRIC_CATEGORIES.API_AUTH,
  // },
  {
    key: 'total_auth_ingress',
    label: 'Auth Ingress',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_AUTH,
  },
  {
    key: 'total_auth_egress',
    label: 'Auth Egress',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_AUTH,
  },
  {
    key: 'total_auth_requests',
    label: 'Auth Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_AUTH,
  },
  {
    key: 'total_auth_get_requests',
    label: 'Auth GET Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_AUTH,
  },
  {
    key: 'total_auth_post_requests',
    label: 'Auth POST Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_AUTH,
  },
  {
    key: 'total_auth_patch_requests',
    label: 'Auth PATCH requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_AUTH,
  },
  {
    key: 'total_auth_options_requests',
    label: 'Auth OPTIONS requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_AUTH,
  },

  /**
   * Storage
   */
  {
    key: 'total_storage_ingress',
    label: 'Storage Ingress',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_STORAGE,
  },
  {
    key: 'total_storage_egress',
    label: 'Storage Egress',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_STORAGE,
  },
  {
    key: 'total_storage_requests',
    label: 'Storage Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_STORAGE,
  },
  {
    key: 'total_storage_get_requests',
    label: 'Storage GET Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_STORAGE,
  },
  {
    key: 'total_storage_post_requests',
    label: 'Storage POST Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_STORAGE,
  },
  {
    key: 'total_storage_delete_requests',
    label: 'Storage DELETE Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_STORAGE,
  },
  {
    key: 'total_storage_options_requests',
    label: 'Storage OPTIONS Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_STORAGE,
  },
  {
    key: 'total_auth_delete_requests',
    label: 'Auth DELETE Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_AUTH,
  },

  {
    key: 'total_egress',
    label: 'All Egress',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API,
  },
  // {
  //   key: 'total_auth_emails',
  //   name: 'total_auth_emails',
  //   provider: 'daily-stats',
  //   category: METRIC_CATEGORIES.API,
  // },
  // {
  //   key: 'total_auth_texts',
  //   name: 'total_auth_texts',
  //   provider: 'daily-stats',
  //   category: METRIC_CATEGORIES.API,
  // },

  {
    key: 'total_get_requests',
    label: 'All GET Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API,
  },
  // {
  //   key: 'total_db_size_bytes',
  //   name: 'total_db_size_bytes',
  //   provider: 'daily-stats',
  //   category: METRIC_CATEGORIES.API,
  // },
  // {
  //   key: 'total_storage_size_bytes',
  //   name: 'total_storage_size_bytes',
  //   provider: 'daily-stats',
  //   category: METRIC_CATEGORIES.API,
  // },
  // {
  //   key: 'total_realtime_delete_requests',
  //   label: 'total_realtime_delete_requests',
  //   provider: 'daily-stats',
  //   category: METRIC_CATEGORIES.API_REALTIME,
  // },
  {
    key: 'total_storage_patch_requests',
    label: 'Storage PATCH Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API_STORAGE,
  },
  {
    key: 'total_requests',
    label: 'All Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API,
  },
  // {
  //   key: 'total_realtime_options_requests',
  //   label: 'total_realtime_options_requests',
  //   provider: 'daily-stats',
  //   category: METRIC_CATEGORIES.API_REALTIME,
  // },

  {
    key: 'total_patch_requests',
    label: 'All PATCH Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API,
  },
  {
    key: 'total_post_requests',
    label: 'All POST Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API,
  },

  {
    key: 'total_ingress',
    label: 'All Ingress',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API,
  },
  // {
  //   key: 'total_realtime_patch_requests',
  //   label: 'total_realtime_patch_requests',
  //   provider: 'daily-stats',
  //   category: METRIC_CATEGORIES.API_REALTIME,
  // },
  {
    key: 'total_delete_requests',
    label: 'All DELETE Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API,
  },
  {
    key: 'total_options_requests',
    label: 'All OPTIONS Requests',
    provider: 'daily-stats',
    category: METRIC_CATEGORIES.API,
  },
  // {
  //   key: 'total_db_egress_bytes',
  //   name: 'total_db_egress_bytes',
  //   provider: 'daily-stats',
  //   category: METRIC_CATEGORIES.API,
  // },
]

export const TIME_PERIODS_BILLING = [
  {
    key: 'currentBillingCycle',
    label: 'Current billing cycle',
    interval: '1d',
  },
  {
    key: 'previousBillingCycle',
    label: 'Previous billing cycle',
    interval: '1d',
  },
]

export const TIME_PERIODS_REPORTS = [
  {
    key: '7d',
    label: 'Last 7 days',
    interval: '1d',
  },
  {
    key: '30d',
    label: 'Last 30 days',
    interval: '1d',
  },
  // {
  //   key: '60d',
  //   label: 'Last 60 days',
  //   interval: '1d',
  // },
  // {
  //   key: '120d',
  //   label: 'Last 120 days',
  //   interval: '1d',
  // },
  {
    key: 'startMonth',
    label: 'This month',
    interval: '1d',
  },
]

export const TIME_PERIODS_INFRA = [
  {
    key: '1h',
    label: 'Last hour',
    interval: '1m',
  },
  {
    key: '3h',
    label: 'Last 3 hours',
    interval: '5m',
  },
  {
    key: '1d',
    label: 'Last 24 hours',
    interval: '30m',
  },
]

export const NEW_REPORT_SKELETON = {
  name: 'new report',
  description: '',
  type: 'report',
  visibility: 'project',
  content: {
    schema_version: 1,
    period_start: {
      time_period: '7d',
      date: '',
    },
    period_end: {
      time_period: 'today',
      date: '',
    },
    interval: '1d',
    layout: [],
  },
}

export const PASSWORD_STRENGTH = {
  0: 'This password is not acceptable.',
  1: 'This password is not secure enough.',
  2: 'This password is not secure enough.',
  3: 'Not bad, but your password must be harder to guess.',
  4: 'This password is strong.',
}

export const PASSWORD_STRENGTH_COLOR = {
  0: 'bg-red-500',
  1: 'bg-red-400',
  2: 'bg-yellow-500',
  3: 'bg-yellow-500',
  4: 'bg-green-500',
}

export const PASSWORD_STRENGTH_PERCENTAGE = {
  0: '10%',
  1: '30%',
  2: '50%',
  3: '80%',
  4: '100%',
}

export const LOG_TYPE_LABEL_MAPPING: { [k: string]: string } = {
  rest: 'Edge - PostgREST',
  realtime: 'Edge - Realtime',
  auth: 'Edge - Auth',
  storage: 'Edge - Storage',
  database: 'Database',
}