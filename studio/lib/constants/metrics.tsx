import { IconActivity, IconArchive, IconDatabase, IconKey, IconHeart } from '@supabase/ui'

export const METRIC_CATEGORIES = {
  API: {
    label: 'All API usage',
    icon: <IconActivity />,
    key: 'api',
  },
  API_DATABASE: {
    label: 'Database API',
    icon: <IconDatabase size={16} />,
    key: 'api_database',
  },
  API_AUTH: {
    label: 'Auth API',
    icon: <IconKey size={16} />,
    key: 'api_auth',
  },
  API_STORAGE: {
    label: 'Storage API',
    icon: <IconArchive size={16} />,
    key: 'api_storage',
  },
  API_REALTIME: {
    label: 'Realtime API',
    icon: '',
    key: 'api_realtime',
  },
  INSTANCE: {
    label: 'Instance health',
    icon: <IconHeart size={16} />,
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
    key: 'disk_io_budget',
    label: 'Daily Disk IO Budget % Remaining',
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
