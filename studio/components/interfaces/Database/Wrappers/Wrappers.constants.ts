import { BASE_PATH } from 'lib/constants'
import { WrapperMeta } from './Wrappers.types'

export const WRAPPER_HANDLERS = {
  STRIPE: 'stripe_fdw_handler',
  FIREBASE: 'firebase_fdw_handler',
  S3: 's3_fdw_handler',
  CLICK_HOUSE: 'click_house_fdw_handler',
  BIG_QUERY: 'big_query_fdw_handler',
  AIRTABLE: 'airtable_fdw_handler',
  LOGFLARE: 'logflare_fdw_handler',
}

export const WRAPPERS: WrapperMeta[] = [
  {
    name: 'stripe_wrapper',
    handlerName: WRAPPER_HANDLERS.STRIPE,
    validatorName: 'stripe_fdw_validator',
    icon: `${BASE_PATH}/img/icons/stripe-icon.svg`,
    extensionName: 'StripeFdw',
    label: 'Stripe',
    docsUrl: 'https://supabase.com/docs/guides/database/extensions/wrappers/stripe',
    server: {
      options: [
        {
          name: 'api_key_id',
          label: 'Stripe Secret Key',
          required: true,
          encrypted: true,
          hidden: true,
          urlHelper: 'https://stripe.com/docs/keys',
        },
        {
          name: 'api_url',
          label: 'Stripe API URL',
          defaultValue: 'https://api.stripe.com/v1',
          required: false,
          encrypted: false,
          hidden: false,
        },
      ],
    },
    tables: [
      {
        label: 'Balance',
        description: 'The balance currently on your Stripe account',
        availableColumns: [
          {
            name: 'balance_type',
            type: 'text',
          },
          {
            name: 'amount',
            type: 'bigint',
          },
          {
            name: 'currency',
            type: 'text',
          },
          {
            name: 'attrs',
            type: 'jsonb',
          },
        ],
        options: [
          {
            name: 'object',
            defaultValue: 'balance',
            editable: false,
            required: true,
            type: 'text',
          },
        ],
      },
      {
        label: 'Balance Transactions',
        description: 'Transactions that have contributed to the balance on your Stripe account',
        availableColumns: [
          {
            name: 'id',
            type: 'text',
          },
          {
            name: 'amount',
            type: 'bigint',
          },
          {
            name: 'currency',
            type: 'text',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'fee',
            type: 'bigint',
          },
          {
            name: 'net',
            type: 'bigint',
          },
          {
            name: 'status',
            type: 'text',
          },
          {
            name: 'type',
            type: 'text',
          },
          {
            name: 'created',
            type: 'timestamp',
          },
          {
            name: 'attrs',
            type: 'jsonb',
          },
        ],
        options: [
          {
            name: 'object',
            defaultValue: 'balance_transactions',
            editable: false,
            required: true,
            type: 'text',
          },
        ],
      },
      {
        label: 'Charges',
        description: 'Charges made on your Stripe account',
        availableColumns: [
          {
            name: 'id',
            type: 'text',
          },
          {
            name: 'amount',
            type: 'bigint',
          },
          {
            name: 'currency',
            type: 'text',
          },
          {
            name: 'customer',
            type: 'text',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'invoice',
            type: 'text',
          },
          {
            name: 'payment_intent',
            type: 'text',
          },
          {
            name: 'status',
            type: 'text',
          },
          {
            name: 'created',
            type: 'timestamp',
          },
          {
            name: 'attrs',
            type: 'jsonb',
          },
        ],
        options: [
          {
            name: 'object',
            defaultValue: 'charges',
            editable: false,
            required: true,
            type: 'text',
          },
        ],
      },
      {
        label: 'Customers',
        description: 'Customers on your Stripe account',
        availableColumns: [
          {
            name: 'id',
            type: 'text',
          },
          {
            name: 'email',
            type: 'text',
          },
          {
            name: 'name',
            type: 'text',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'created',
            type: 'timestamp',
          },
          {
            name: 'attrs',
            type: 'jsonb',
          },
        ],
        options: [
          {
            name: 'object',
            defaultValue: 'customers',
            editable: false,
            required: true,
            type: 'text',
          },
          // {
          //   name: 'rowid_column',
          //   label: 'Row ID Column',
          //   defaultValue: 'id',
          //   editable: true,
          //   required: true,
          // },
        ],
      },
      {
        label: 'Invoices',
        description: 'Invoices on your Stripe account',
        availableColumns: [
          {
            name: 'id',
            type: 'text',
          },
          {
            name: 'customer',
            type: 'text',
          },
          {
            name: 'subscription',
            type: 'text',
          },
          {
            name: 'status',
            type: 'text',
          },
          {
            name: 'total',
            type: 'bigint',
          },
          {
            name: 'currency',
            type: 'text',
          },
          {
            name: 'period_start',
            type: 'timestamp',
          },
          {
            name: 'period_end',
            type: 'timestamp',
          },
          {
            name: 'attrs',
            type: 'jsonb',
          },
        ],
        options: [
          {
            name: 'object',
            defaultValue: 'invoices',
            editable: false,
            required: true,
            type: 'text',
          },
        ],
      },
      {
        label: 'Payment Intents',
        description: 'Payment Intents on your Stripe account',
        availableColumns: [
          {
            name: 'id',
            type: 'text',
          },
          {
            name: 'customer',
            type: 'text',
          },
          {
            name: 'amount',
            type: 'bigint',
          },
          {
            name: 'currency',
            type: 'text',
          },
          {
            name: 'payment_method',
            type: 'text',
          },
          {
            name: 'created',
            type: 'timestamp',
          },
          {
            name: 'attrs',
            type: 'jsonb',
          },
        ],
        options: [
          {
            name: 'object',
            defaultValue: 'payment_intents',
            editable: false,
            required: true,
            type: 'text',
          },
        ],
      },
      {
        label: 'Products',
        description: 'Products on your Stripe account',
        availableColumns: [
          {
            name: 'id',
            type: 'text',
          },
          {
            name: 'name',
            type: 'text',
          },
          {
            name: 'active',
            type: 'bool',
          },
          {
            name: 'default_price',
            type: 'text',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'created',
            type: 'timestamp',
          },
          {
            name: 'updated',
            type: 'timestamp',
          },
          {
            name: 'attrs',
            type: 'jsonb',
          },
        ],
        options: [
          {
            name: 'object',
            defaultValue: 'products',
            editable: false,
            required: true,
            type: 'text',
          },
          // {
          //   name: 'rowid_column',
          //   label: 'Row ID Column',
          //   defaultValue: 'id',
          //   editable: true,
          //   required: true,
          // },
        ],
      },
      {
        label: 'Subscriptions',
        description: 'Subscriptions on your Stripe account',
        availableColumns: [
          {
            name: 'id',
            type: 'text',
          },
          {
            name: 'customer',
            type: 'text',
          },
          {
            name: 'currency',
            type: 'text',
          },
          {
            name: 'current_period_start',
            type: 'timestamp',
          },
          {
            name: 'current_period_end',
            type: 'timestamp',
          },
          {
            name: 'attrs',
            type: 'jsonb',
          },
        ],
        options: [
          {
            name: 'object',
            defaultValue: 'subscriptions',
            editable: false,
            required: true,
            type: 'text',
          },
          // {
          //   name: 'rowid_column',
          //   label: 'Row ID Column',
          //   defaultValue: 'id',
          //   editable: true,
          //   required: true,
          // },
        ],
      },
    ],
  },
  {
    name: 'firebase_wrapper',
    handlerName: WRAPPER_HANDLERS.FIREBASE,
    validatorName: 'firebase_fdw_validator',
    icon: `${BASE_PATH}/img/icons/firebase-icon.svg`,
    extensionName: 'FirebaseFdw',
    label: 'Firebase',
    docsUrl: 'https://supabase.com/docs/guides/database/extensions/wrappers/firebase',
    server: {
      options: [
        {
          name: 'project_id',
          label: 'Project ID',
          required: true,
          encrypted: false,
          hidden: false,
        },
        {
          name: 'sa_key_id',
          label: 'Service Account Key',
          required: true,
          encrypted: true,
          hidden: true,
          isTextArea: true,
          urlHelper: 'https://firebase.google.com/docs/admin/setup#initialize-sdk',
        },
        // NOTE(alaister): this is a valid option, but it may confuse the basic use case
        // so I'm omitting it for now. We can add back once we make it's use clearer.
        // {
        //   name: 'access_token',
        //   label: 'OAuth2 token to access Firebase',
        //   required: false,
        //   encrypted: false,
        //   hidden: false,
        // },
      ],
    },
    tables: [
      {
        label: 'Users',
        description: 'Shows your Firebase users',
        availableColumns: [
          {
            name: 'uid',
            type: 'text',
          },
          {
            name: 'email',
            type: 'text',
          },
          {
            name: 'created_at',
            type: 'timestamp',
          },
          {
            name: 'attrs',
            type: 'jsonb',
          },
        ],
        options: [
          {
            name: 'object',
            defaultValue: 'auth/users',
            editable: false,
            required: true,
            type: 'text',
          },
          {
            name: 'base_url',
            label: 'Base URL',
            defaultValue: 'https://identitytoolkit.googleapis.com/v1/projects',
            editable: true,
            required: true,
            type: 'text',
          },
          {
            name: 'limit',
            label: 'Limit',
            defaultValue: '10000',
            editable: true,
            required: true,
            type: 'text',
          },
        ],
      },
      {
        label: 'Firestore Collection',
        description: 'Map to a Firestore collection',
        availableColumns: [
          {
            name: 'name',
            type: 'text',
          },
          {
            name: 'created_at',
            type: 'timestamp',
          },
          {
            name: 'updated_at',
            type: 'timestamp',
          },
          {
            name: 'attrs',
            type: 'jsonb',
          },
        ],
        options: [
          {
            name: 'object',
            label: 'Object',
            placeholder: 'firestore/[collection_id]',
            editable: true,
            required: true,
            type: 'text',
          },
          {
            name: 'base_url',
            label: 'Base URL',
            defaultValue: 'https://firestore.googleapis.com/v1beta1/projects',
            editable: true,
            required: true,
            type: 'text',
          },
          {
            name: 'limit',
            label: 'Limit',
            defaultValue: '10000',
            editable: true,
            required: true,
            type: 'text',
          },
        ],
      },
    ],
  },
  {
    name: 's3_wrapper',
    handlerName: WRAPPER_HANDLERS.S3,
    validatorName: 's3_fdw_validator',
    icon: `${BASE_PATH}/img/icons/s3-icon.svg`,
    extensionName: 'S3Fdw',
    label: 'S3',
    docsUrl: 'https://supabase.com/docs/guides/database/extensions/wrappers/s3',
    server: {
      options: [
        {
          name: 'vault_access_key_id',
          label: 'Access Key ID',
          required: true,
          encrypted: true,
          hidden: true,
        },
        {
          name: 'vault_secret_access_key',
          label: 'Access Key Secret',
          required: true,
          encrypted: true,
          hidden: true,
        },
        {
          name: 'aws_region',
          label: 'AWS Region',
          required: true,
          encrypted: false,
          hidden: false,
          defaultValue: 'us-east-1',
        },
      ],
    },
    tables: [
      {
        label: 'S3 File',
        description: 'Map to a file in S3 (CSV or JSON only)',
        options: [
          {
            name: 'uri',
            label: 'URI',
            editable: true,
            required: true,
            placeholder: 's3://bucket/s3_table.csv',
            type: 'text',
          },
          {
            name: 'format',
            label: 'Format',
            editable: true,
            required: true,
            type: 'select',
            defaultValue: 'csv',
            options: [
              { label: 'CSV', value: 'csv' },
              { label: 'JSONL (JSON Lines)', value: 'jsonl' },
            ],
          },
          {
            name: 'has_header',
            label: 'Has Header',
            editable: true,
            required: true,
            type: 'select',
            defaultValue: 'true',
            options: [
              { label: 'True', value: 'true' },
              { label: 'False', value: 'false' },
            ],
          },
          {
            name: 'compress',
            label: 'Compression',
            editable: true,
            required: false,
            type: 'select',
            options: [{ label: 'GZIP', value: 'gzip' }],
          },
        ],
      },
    ],
  },
  {
    name: 'clickhouse_wrapper',
    handlerName: WRAPPER_HANDLERS.CLICK_HOUSE,
    validatorName: 'click_house_fdw_validator',
    icon: `${BASE_PATH}/img/icons/clickhouse-icon.svg`,
    extensionName: 'ClickHouseFdw',
    label: 'ClickHouse',
    docsUrl: 'https://supabase.com/docs/guides/database/extensions/wrappers/clickhouse',
    server: {
      options: [
        {
          name: 'conn_string_id',
          label: 'ClickHouse Connection String',
          required: true,
          encrypted: true,
          hidden: true,
        },
      ],
    },
    tables: [
      {
        label: 'ClickHouse Table',
        description: 'Map to a ClickHouse Table',
        options: [
          {
            name: 'table',
            label: 'ClickHouse Table Name',
            editable: true,
            required: true,
            placeholder: 'my_clickhouse_table',
            type: 'text',
          },
          {
            name: 'rowid_column',
            label: 'Row ID Column',
            defaultValue: 'id',
            editable: true,
            required: true,
            type: 'text',
          },
        ],
      },
    ],
  },
  {
    name: 'bigquery_wrapper',
    handlerName: WRAPPER_HANDLERS.BIG_QUERY,
    validatorName: 'big_query_fdw_validator',
    icon: `${BASE_PATH}/img/icons/bigquery-icon.svg`,
    extensionName: 'BigQueryFdw',
    label: 'BigQuery',
    docsUrl: 'https://supabase.com/docs/guides/database/extensions/wrappers/bigquery',
    server: {
      options: [
        {
          name: 'sa_key_id',
          label: 'Service Account Key',
          required: true,
          encrypted: true,
          hidden: true,
        },
        {
          name: 'project_id',
          label: 'Project ID',
          required: true,
          encrypted: false,
          hidden: false,
        },
        {
          name: 'dataset_id',
          label: 'Dataset ID',
          required: true,
          encrypted: false,
          hidden: false,
        },
      ],
    },
    tables: [
      {
        label: 'BigQuery Table',
        description: 'Map to a BigQuery Table',
        options: [
          {
            name: 'table',
            label: 'BigQuery Table Name',
            editable: true,
            required: true,
            placeholder: 'my_bigquery_table',
            type: 'text',
          },
          {
            name: 'location',
            label: 'Location',
            defaultValue: 'US',
            editable: true,
            required: false,
            type: 'text',
          },
          {
            name: 'timeout',
            label: 'Timeout (ms)',
            defaultValue: '30000',
            editable: true,
            required: false,
            type: 'text',
          },
          {
            name: 'rowid_column',
            label: 'Row ID Column',
            defaultValue: 'id',
            editable: true,
            required: false,
            type: 'text',
          },
        ],
      },
    ],
  },
  {
    name: 'airtable_wrapper',
    handlerName: WRAPPER_HANDLERS.AIRTABLE,
    validatorName: 'airtable_fdw_validator',
    icon: `${BASE_PATH}/img/icons/airtable-icon.svg`,
    extensionName: 'airtableFdw',
    label: 'Airtable',
    docsUrl: 'https://supabase.com/docs/guides/database/extensions/wrappers/airtable',
    server: {
      options: [
        {
          name: 'api_key_id',
          label: 'API Key ID',
          required: true,
          encrypted: true,
          hidden: true,
        },
      ],
    },
    tables: [
      {
        label: 'Airtable Table',
        description: 'Map to an Airtable Table',
        options: [
          {
            name: 'base_id',
            label: 'Base ID',
            editable: true,
            required: true,
            type: 'text',
          },
          {
            name: 'table_id',
            label: 'Table ID',
            editable: true,
            required: true,
            type: 'text',
          },
        ],
      },
    ],
  },
  {
    name: 'logflare_wrapper',
    handlerName: WRAPPER_HANDLERS.LOGFLARE,
    validatorName: 'logflare_fdw_validator',
    icon: `${BASE_PATH}/img/icons/logflare-icon.svg`,
    extensionName: 'logflareFdw',
    label: 'Logflare',
    docsUrl: 'https://supabase.com/docs/guides/database/extensions/wrappers/logflare',
    server: {
      options: [
        {
          name: 'api_key_id',
          label: 'API Key ID',
          required: true,
          encrypted: true,
          hidden: true,
        },
      ],
    },
    tables: [
      {
        label: 'Logflare Table',
        description: 'Map to a Logflare Table',
        options: [
          {
            name: 'endpoint',
            label: 'Endpoint',
            editable: true,
            required: true,
            type: 'text',
          },
        ],
      },
    ],
  },
]
