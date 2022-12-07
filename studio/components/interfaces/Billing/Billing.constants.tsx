import { IconArchive, IconCode, IconDatabase, IconKey } from 'ui'

export const CANCELLATION_REASONS = [
  'Pricing',
  "My project isn't getting traction",
  'Poor customer service',
  'Missing feature',
  "I didn't see the value",
  "Supabase didn't meet my needs",
  'Dashboard is too complicated',
  'Postgres is too complicated',
  'Problem not solved',
  'Bug issues',
  'I decided to use something else',
  'My work has finished/discontinued',
  'I’m migrating to/starting a new project',
  'None of the above',
]

export const USAGE_BASED_PRODUCTS = [
  {
    title: 'Database',
    icon: <IconDatabase className="dark:text-scale-100" size={16} strokeWidth={2} />,
    features: [
      {
        key: 'db_size',
        attribute: 'total_db_size_bytes',
        title: 'Database space',
        units: 'bytes',
        costPerUnit: 0.125,
      },
      {
        key: 'db_egress',
        attribute: 'total_egress_modified',
        title: 'Database egress',
        units: 'bytes',
        costPerUnit: 0.09,
      },
    ],
  },
  {
    title: 'Auth',
    icon: <IconKey className="dark:text-scale-100" size={16} strokeWidth={2} />,
    features: [
      {
        key: 'monthly_active_users',
        attribute: 'total_auth_billing_period_mau',
        title: 'Monthly Active Users',
        units: 'absolute',
        costPerUnit: 0.00325,
      },
    ],
  },
  {
    title: 'Storage',
    icon: <IconArchive className="dark:text-scale-100" size={16} strokeWidth={2} />,
    features: [
      {
        key: 'storage_size',
        attribute: 'total_storage_size_bytes',
        title: 'Storage space',
        units: 'bytes',
        costPerUnit: 0.021,
      },
      {
        key: 'storage_egress',
        attribute: 'total_storage_egress',
        title: 'Storage egress',
        units: 'bytes',
        costPerUnit: 0.09,
      },
    ],
  },
  {
    title: 'Functions',
    icon: <IconCode className="dark:text-scale-100" size={16} strokeWidth={2} />,
    features: [
      {
        key: 'func_count',
        attribute: 'total_func_count',
        title: 'Function Count',
        units: 'absolute',
        costPerUnit: 0.1,
      },

      {
        key: 'func_invocations',
        attribute: 'total_func_invocations',
        title: 'Function Invocations',
        units: 'absolute',
        costPerUnit: 0.000002,
      },
    ],
  },
]
