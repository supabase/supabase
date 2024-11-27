import { BASE_PATH } from 'lib/constants'
import type { WrapperMeta } from './Wrappers.types'

export const WRAPPER_HANDLERS = {
  STRIPE: 'stripe_fdw_handler',
  FIREBASE: 'firebase_fdw_handler',
  S3: 's3_fdw_handler',
  CLICK_HOUSE: 'click_house_fdw_handler',
  BIG_QUERY: 'big_query_fdw_handler',
  AIRTABLE: 'airtable_fdw_handler',
  LOGFLARE: 'logflare_fdw_handler',
  AUTH0: 'auth0_fdw_handler',
  COGNITO: 'cognito_fdw_handler',
  MSSQL: 'mssql_fdw_handler',
  REDIS: 'redis_fdw_handler',
  PADDLE: 'wasm_fdw_handler',
  SNOWFLAKE: 'wasm_fdw_handler',
  CAL: 'wasm_fdw_handler',
}

export const WRAPPERS: WrapperMeta[] = [
  {
    name: 'stripe_wrapper',
    handlerName: WRAPPER_HANDLERS.STRIPE,
    validatorName: 'stripe_fdw_validator',
    icon: `${BASE_PATH}/img/icons/stripe-icon.svg`,
    description: 'Payment processing and subscription management',
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
          secureEntry: true,
          urlHelper: 'https://stripe.com/docs/keys',
        },
        {
          name: 'api_url',
          label: 'Stripe API URL',
          defaultValue: 'https://api.stripe.com/v1',
          required: false,
          encrypted: false,
          secureEntry: false,
        },
      ],
    },
    tables: [
      {
        label: 'Accounts',
        description: 'List of accounts on your Stripe account',
        availableColumns: [
          {
            name: 'id',
            type: 'text',
          },
          {
            name: 'business_type',
            type: 'text',
          },
          {
            name: 'country',
            type: 'text',
          },
          {
            name: 'email',
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
            defaultValue: 'accounts',
            editable: false,
            required: true,
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
        label: 'Checkout Sessions',
        description:
          "Customer's session as they pay for one-time purchases or subscriptions through Checkout or Payment Links",
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
            name: 'payment_intent',
            type: 'text',
          },
          {
            name: 'subscription',
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
            defaultValue: 'checkout/sessions',
            editable: false,
            required: true,
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
      {
        label: 'Disputes',
        description: 'When a customer questions your charge with their card issuer',
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
            name: 'charge',
            type: 'text',
          },
          {
            name: 'payment_intent',
            type: 'text',
          },
          {
            name: 'reason',
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
            defaultValue: 'disputes',
            editable: false,
            required: true,
            type: 'text',
          },
        ],
      },
      {
        label: 'Events',
        description:
          "Stripe's way of letting you know when something interesting happens in your account",
        availableColumns: [
          {
            name: 'id',
            type: 'text',
          },
          {
            name: 'type',
            type: 'text',
          },
          {
            name: 'api_version',
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
            defaultValue: 'events',
            editable: false,
            required: true,
            type: 'text',
          },
        ],
      },
      {
        label: 'Files',
        description: "Files that are hosted on Stripe's servers",
        availableColumns: [
          {
            name: 'id',
            type: 'text',
          },
          {
            name: 'filename',
            type: 'text',
          },
          {
            name: 'purpose',
            type: 'text',
          },
          {
            name: 'title',
            type: 'text',
          },
          {
            name: 'size',
            type: 'bigint',
          },
          {
            name: 'type',
            type: 'text',
          },
          {
            name: 'url',
            type: 'text',
          },
          {
            name: 'created',
            type: 'timestamp',
          },
          {
            name: 'expires_at',
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
            defaultValue: 'files',
            editable: false,
            required: true,
            type: 'text',
          },
        ],
      },
      {
        label: 'File Links',
        description: 'For sharing contents of a File object with non-Stripe users',
        availableColumns: [
          {
            name: 'id',
            type: 'text',
          },
          {
            name: 'file',
            type: 'text',
          },
          {
            name: 'url',
            type: 'text',
          },
          {
            name: 'created',
            type: 'timestamp',
          },
          {
            name: 'expired',
            type: 'bool',
          },
          {
            name: 'expires_at',
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
            defaultValue: 'file_links',
            editable: false,
            required: true,
            type: 'text',
          },
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
        label: 'Mandates',
        description:
          'Records of the permission a customer has given you to debit their payment method',
        availableColumns: [
          {
            name: 'id',
            type: 'text',
          },
          {
            name: 'payment_method',
            type: 'text',
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
            name: 'attrs',
            type: 'jsonb',
          },
        ],
        options: [
          {
            name: 'object',
            defaultValue: 'mandates',
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
        label: 'Payouts',
        description:
          'Created when you receive funds from Stripe, or when you initiate a payout to either a bank account or debit card',
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
            name: 'arrival_date',
            type: 'timestamp',
          },
          {
            name: 'description',
            type: 'text',
          },
          {
            name: 'statement_descriptor',
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
            defaultValue: 'payouts',
            editable: false,
            required: true,
            type: 'text',
          },
        ],
      },
      {
        label: 'Prices',
        description:
          'A Price object is needed for all your products to facilitate multiple currencies and pricing options',
        availableColumns: [
          {
            name: 'id',
            type: 'text',
          },
          {
            name: 'active',
            type: 'bool',
          },
          {
            name: 'currency',
            type: 'text',
          },
          {
            name: 'product',
            type: 'text',
          },
          {
            name: 'unit_amount',
            type: 'bigint',
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
            defaultValue: 'prices',
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
      {
        label: 'Refunds',
        description:
          'Allows you to refund a charge that has previously been created but not yet refunded',
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
            name: 'charge',
            type: 'text',
          },
          {
            name: 'payment_intent',
            type: 'text',
          },
          {
            name: 'reason',
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
            defaultValue: 'refunds',
            editable: false,
            required: true,
            type: 'text',
          },
        ],
      },
      {
        label: 'Setup Attempts',
        description: 'Attempted confirmations of a SetupIntent, either successful or unsuccessful',
        availableColumns: [
          {
            name: 'id',
            type: 'text',
          },
          {
            name: 'application',
            type: 'text',
          },
          {
            name: 'customer',
            type: 'text',
          },
          {
            name: 'on_behalf_of',
            type: 'text',
          },
          {
            name: 'payment_method',
            type: 'text',
          },
          {
            name: 'setup_intent',
            type: 'text',
          },
          {
            name: 'status',
            type: 'text',
          },
          {
            name: 'usage',
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
            defaultValue: 'setup_attempts',
            editable: false,
            required: true,
            type: 'text',
          },
        ],
      },
      {
        label: 'Setup Intents',
        description:
          "Guides you through the process of setting up and saving a customer's payment credentials for future payments",
        availableColumns: [
          {
            name: 'id',
            type: 'text',
          },
          {
            name: 'client_secret',
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
            name: 'payment_method',
            type: 'text',
          },
          {
            name: 'status',
            type: 'text',
          },
          {
            name: 'usage',
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
            defaultValue: 'setup_intents',
            editable: false,
            required: true,
            type: 'text',
          },
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
      {
        label: 'Tokens',
        description:
          'Tokenization is the process Stripe uses to collect sensitive card or bank account details in a secure manner',
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
            defaultValue: 'tokens',
            editable: false,
            required: true,
            type: 'text',
          },
        ],
      },
      {
        label: 'Top-ups',
        description: 'To top up your Stripe balance',
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
            defaultValue: 'topups',
            editable: false,
            required: true,
            type: 'text',
          },
        ],
      },
      {
        label: 'Transfers',
        description: 'When moving funds between Stripe accounts as part of Connect',
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
            name: 'destination',
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
            defaultValue: 'transfers',
            editable: false,
            required: true,
            type: 'text',
          },
        ],
      },
    ],
  },
  {
    name: 'firebase_wrapper',
    handlerName: WRAPPER_HANDLERS.FIREBASE,
    validatorName: 'firebase_fdw_validator',
    icon: `${BASE_PATH}/img/icons/firebase-icon.svg`,
    description: 'Backend-as-a-Service with real-time database',
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
          secureEntry: false,
        },
        {
          name: 'sa_key_id',
          label: 'Service Account Key',
          required: true,
          encrypted: true,
          secureEntry: true,
          isTextArea: true,
          urlHelper: 'https://firebase.google.com/docs/admin/setup#initialize-sdk',
        },
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
    description: 'Cloud object storage service',
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
          secureEntry: true,
        },
        {
          name: 'vault_secret_access_key',
          label: 'Access Key Secret',
          required: true,
          encrypted: true,
          secureEntry: true,
        },
        {
          name: 'aws_region',
          label: 'AWS Region',
          required: true,
          encrypted: false,
          secureEntry: false,
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
    description: 'Column-oriented analytics database',
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
          secureEntry: true,
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
    description: 'Serverless data warehouse and analytics',
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
          secureEntry: true,
        },
        {
          name: 'project_id',
          label: 'Project ID',
          required: true,
          encrypted: false,
          secureEntry: false,
        },
        {
          name: 'dataset_id',
          label: 'Dataset ID',
          required: true,
          encrypted: false,
          secureEntry: false,
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
    description: 'No-code database and spreadsheet platform',
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
          secureEntry: true,
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
    description: 'Log management and analytics service',
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
          secureEntry: true,
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
  {
    name: 'auth0_wrapper',
    handlerName: WRAPPER_HANDLERS.AUTH0,
    validatorName: 'auth0_fdw_validator',
    icon: `${BASE_PATH}/img/icons/auth0-icon.svg`,
    description: 'Identity and access management platform',
    extensionName: 'Auth0Fdw',
    label: 'Auth0',
    docsUrl: 'https://supabase.com/docs/guides/database/extensions/wrappers/auth0',
    minimumExtensionVersion: '0.3.0',
    server: {
      options: [
        {
          name: 'api_key_id',
          label: 'Auth0 API key or PAT',
          required: true,
          encrypted: true,
          secureEntry: true,
        },
        {
          name: 'url',
          label: 'Auth0 API URL',
          defaultValue: 'https://dev-<tenant-id>.us.auth0.com/api/v2/users',
          required: false,
          encrypted: false,
          secureEntry: false,
        },
      ],
    },
    tables: [
      {
        label: 'Users',
        description: 'Auth0 Users',
        availableColumns: [
          {
            name: 'user_id',
            type: 'text',
          },
          {
            name: 'email',
            type: 'text',
          },
          {
            name: 'email_verified',
            type: 'boolean',
          },
          {
            name: 'username',
            type: 'text',
          },
          {
            name: 'phone_number',
            type: 'text',
          },
          {
            name: 'phone_verified',
            type: 'boolean',
          },
          {
            name: 'created_at',
            type: 'jsonb',
          },
          {
            name: 'updated_at',
            type: 'jsonb',
          },
          {
            name: 'identities',
            type: 'jsonb',
          },
          {
            name: 'app_metadata',
            type: 'jsonb',
          },
          {
            name: 'user_metadata',
            type: 'jsonb',
          },
          {
            name: 'picture',
            type: 'text',
          },
          {
            name: 'name',
            type: 'text',
          },
          {
            name: 'nickname',
            type: 'text',
          },
          {
            name: 'multifactor',
            type: 'jsonb',
          },
          {
            name: 'last_ip',
            type: 'text',
          },
          {
            name: 'last_login',
            type: 'jsonb',
          },
          {
            name: 'logins_count',
            type: 'integer',
          },
          {
            name: 'blocked',
            type: 'boolean',
          },
          {
            name: 'given_name',
            type: 'text',
          },
          {
            name: 'family_name',
            type: 'text',
          },
        ],
        options: [
          {
            name: 'object',
            defaultValue: 'users',
            editable: false,
            required: true,
            type: 'text',
          },
        ],
      },
    ],
  },
  {
    name: 'cognito_wrapper',
    handlerName: WRAPPER_HANDLERS.COGNITO,
    validatorName: 'cognito_fdw_validator',
    icon: `${BASE_PATH}/img/icons/cognito-icon.svg`,
    description: 'AWS user authentication and authorization',
    extensionName: 'CognitoFdw',
    label: 'Cognito',
    docsUrl: 'https://supabase.com/docs/guides/database/extensions/wrappers/cognito',
    minimumExtensionVersion: '0.3.0',
    server: {
      options: [
        {
          name: 'aws_access_key_id',
          label: 'AWS Access Key ID',
          required: true,
          encrypted: false,
          secureEntry: false,
        },
        {
          name: 'api_key_id',
          label: 'AWS Secret Key',
          required: true,
          encrypted: true,
          secureEntry: true,
        },
        {
          name: 'region',
          label: 'Region',
          required: true,
          encrypted: false,
          secureEntry: false,
        },
        {
          name: 'user_pool_id',
          label: 'User Pool ID',
          required: true,
          encrypted: false,
          secureEntry: false,
        },
      ],
    },
    tables: [
      {
        label: 'Users',
        description: 'Cognito Users',
        availableColumns: [
          {
            name: 'email',
            type: 'text',
          },
          {
            name: 'created_at',
            type: 'text',
          },
          {
            name: 'email_verified',
            type: 'boolean',
          },
          {
            name: 'identities',
            type: 'jsonb',
          },
          {
            name: 'username',
            type: 'text',
          },
          {
            name: 'status',
            type: 'text',
          },
        ],
        options: [
          {
            name: 'object',
            defaultValue: 'users',
            editable: false,
            required: true,
            type: 'text',
          },
        ],
      },
    ],
  },
  {
    name: 'mssql_wrapper',
    handlerName: WRAPPER_HANDLERS.MSSQL,
    validatorName: 'mssql_fdw_validator',
    icon: `${BASE_PATH}/img/icons/mssql-icon.svg`,
    description: 'Microsoft SQL Server database',
    extensionName: 'mssqlFdw',
    label: 'Microsoft SQL Server',
    docsUrl: 'https://supabase.com/docs/guides/database/extensions/wrappers/mssql',
    minimumExtensionVersion: '0.3.0',
    server: {
      options: [
        {
          name: 'conn_string_id',
          label: 'Connection String',
          required: true,
          encrypted: true,
          secureEntry: true,
        },
      ],
    },
    tables: [
      {
        label: 'Microsoft SQL Server Table',
        description: 'Map to an Microsoft SQL Server Table',
        options: [
          {
            name: 'table',
            label: 'MSSQL Table',
            editable: true,
            required: true,
            type: 'text',
          },
        ],
      },
    ],
  },
  {
    name: 'redis_wrapper',
    handlerName: WRAPPER_HANDLERS.REDIS,
    validatorName: 'redis_fdw_validator',
    icon: `${BASE_PATH}/img/icons/redis-icon.svg`,
    description: 'In-memory data structure store',
    extensionName: 'redisFdw',
    label: 'Redis',
    docsUrl: 'https://supabase.com/docs/guides/database/extensions/wrappers/redis',
    minimumExtensionVersion: '0.3.0',
    server: {
      options: [
        {
          name: 'conn_url_id',
          label: 'Connection URL',
          required: true,
          encrypted: true,
          secureEntry: true,
        },
      ],
    },
    tables: [
      {
        label: 'Redis Table',
        description: 'Map to an Redis Table',
        options: [
          {
            name: 'src_type',
            label: 'Source Type',
            editable: true,
            required: true,
            type: 'select',
            defaultValue: 'list',
            options: [
              {
                label: 'list',
                value: 'list',
              },
              {
                label: 'set',
                value: 'set',
              },
              {
                label: 'hash',
                value: 'hash',
              },
              {
                label: 'zset',
                value: 'zset',
              },
              {
                label: 'stream',
                value: 'stream',
              },
              {
                label: 'multi_list',
                value: 'multi_list',
              },
              {
                label: 'multi_set',
                value: 'multi_set',
              },
              {
                label: 'multi_hash',
                value: 'multi_hash',
              },
              {
                label: 'multi_zset',
                value: 'multi_zset',
              },
            ],
          },
          {
            name: 'src_key',
            label: 'Source Key',
            editable: true,
            required: false,
            type: 'text',
          },
        ],
      },
    ],
  },
  {
    name: 'paddle_wrapper',
    handlerName: WRAPPER_HANDLERS.PADDLE,
    validatorName: 'wasm_fdw_validator',
    icon: `${BASE_PATH}/img/icons/paddle-icon.svg`,
    description: 'Subscription billing and payments platform',
    extensionName: 'paddleFdw',
    label: 'Paddle',
    docsUrl: 'https://supabase.com/docs/guides/database/extensions/wrappers/paddle',
    minimumExtensionVersion: '0.4.0',
    server: {
      options: [
        {
          name: 'fdw_package_url',
          label: 'FDW Package URL',
          required: true,
          encrypted: false,
          secureEntry: false,
          defaultValue:
            'https://github.com/supabase/wrappers/releases/download/wasm_paddle_fdw_v0.1.1/paddle_fdw.wasm',
          hidden: true,
        },
        {
          name: 'fdw_package_name',
          label: 'FDW Package Name',
          required: true,
          encrypted: false,
          secureEntry: false,
          defaultValue: 'supabase:paddle-fdw',
          hidden: true,
        },
        {
          name: 'fdw_package_version',
          label: 'FDW Package Version',
          required: true,
          encrypted: false,
          secureEntry: false,
          defaultValue: '0.1.1',
          hidden: true,
        },
        {
          name: 'fdw_package_checksum',
          label: 'FDW Package Checksum',
          required: true,
          encrypted: false,
          secureEntry: false,
          defaultValue: 'c5ac70bb2eef33693787b7d4efce9a83cde8d4fa40889d2037403a51263ba657',
          hidden: true,
        },
        {
          name: 'api_url',
          label: 'Paddle API URL',
          defaultValue: 'https://api.paddle.com',
          required: true,
          encrypted: false,
          secureEntry: false,
        },
        {
          name: 'api_key_id',
          label: 'Paddle API Key',
          required: true,
          encrypted: true,
          secureEntry: true,
        },
      ],
    },
    tables: [
      {
        label: 'Paddle Object',
        description: 'Map to an Paddle Object',
        options: [
          {
            name: 'object',
            label: 'Object',
            editable: true,
            required: true,
            type: 'select',
            defaultValue: 'products',
            options: [
              { label: 'Products', value: 'products' },
              { label: 'Prices', value: 'prices' },
              { label: 'Discounts', value: 'discounts' },
              { label: 'Customers', value: 'customers' },
              { label: 'Transactions', value: 'transactions' },
              { label: 'Reports', value: 'reports' },
              { label: 'Notification Settings', value: 'notification-settings' },
              { label: 'notifications', value: 'notifications' },
            ],
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
    name: 'snowflake_wrapper',
    handlerName: WRAPPER_HANDLERS.SNOWFLAKE,
    validatorName: 'wasm_fdw_validator',
    icon: `${BASE_PATH}/img/icons/snowflake-icon.svg`,
    description: 'Cloud data warehouse platform',
    extensionName: 'snowflakeFdw',
    label: 'Snowflake',
    docsUrl: 'https://supabase.com/docs/guides/database/extensions/wrappers/snowflake',
    minimumExtensionVersion: '0.4.0',
    server: {
      options: [
        {
          name: 'fdw_package_url',
          label: 'FDW Package URL',
          required: true,
          encrypted: false,
          secureEntry: false,
          defaultValue:
            'https://github.com/supabase/wrappers/releases/download/wasm_snowflake_fdw_v0.1.1/snowflake_fdw.wasm',
          hidden: true,
        },
        {
          name: 'fdw_package_name',
          label: 'FDW Package Name',
          required: true,
          encrypted: false,
          secureEntry: false,
          defaultValue: 'supabase:snowflake-fdw',
          hidden: true,
        },
        {
          name: 'fdw_package_version',
          label: 'FDW Package Version',
          required: true,
          encrypted: false,
          secureEntry: false,
          defaultValue: '0.1.1',
          hidden: true,
        },
        {
          name: 'fdw_package_checksum',
          label: 'FDW Package Checksum',
          required: true,
          encrypted: false,
          secureEntry: false,
          defaultValue: '7aaafc7edc1726bc93ddc04452d41bda9e1a264a1df2ea9bf1b00b267543b860',
          hidden: true,
        },
        {
          name: 'account_identifier',
          label: 'Account Identifier',
          required: true,
          encrypted: false,
          secureEntry: false,
        },
        {
          name: 'user',
          label: 'User',
          required: true,
          encrypted: false,
          secureEntry: false,
        },
        {
          name: 'public_key_fingerprint',
          label: 'Public Key Fingerprint',
          required: true,
          encrypted: false,
          secureEntry: false,
        },
        {
          name: 'private_key_id',
          label: 'Private Key',
          required: true,
          encrypted: true,
          secureEntry: true,
        },
      ],
    },
    tables: [
      {
        label: 'Snowflake Table',
        description: 'Map to an Snowflake Table',
        options: [
          {
            name: 'table',
            label: 'Table',
            editable: true,
            required: true,
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
    name: 'cal_wrapper',
    description: 'Cal.com is a scheduling platform',
    handlerName: WRAPPER_HANDLERS.CAL,
    validatorName: 'wasm_fdw_validator',
    icon: `${BASE_PATH}/img/icons/cal-com-icon.svg`,
    extensionName: 'calFdw',
    label: 'Cal.com',
    docsUrl: 'https://supabase.com/docs/guides/database/extensions/wrappers/cal',
    minimumExtensionVersion: '0.4.0',
    server: {
      options: [
        {
          name: 'fdw_package_url',
          label: 'FDW Package URL',
          required: true,
          encrypted: false,
          secureEntry: false,
          defaultValue:
            'https://github.com/supabase/wrappers/releases/download/wasm_cal_fdw_v0.1.0/cal_fdw.wasm',
          hidden: true,
        },
        {
          name: 'fdw_package_name',
          label: 'FDW Package Name',
          required: true,
          encrypted: false,
          secureEntry: false,
          defaultValue: 'supabase:cal-fdw',
          hidden: true,
        },
        {
          name: 'fdw_package_version',
          label: 'FDW Package Version',
          required: true,
          encrypted: false,
          secureEntry: false,
          defaultValue: '0.1.0',
          hidden: true,
        },
        {
          name: 'fdw_package_checksum',
          label: 'FDW Package Checksum',
          required: true,
          encrypted: false,
          secureEntry: false,
          defaultValue: 'bca8a82d6c5f8da0aa58011940c4ddb40bb2c909c02dd89b488289c4fff890c1',
          hidden: true,
        },
        {
          name: 'api_url',
          label: 'API URL',
          required: false,
          encrypted: false,
          secureEntry: false,
          defaultValue: 'https://api.cal.com/v2',
        },
        {
          name: 'api_key_id',
          label: 'API Key ID',
          required: true,
          encrypted: true,
          secureEntry: true,
        },
      ],
    },
    tables: [
      {
        label: 'My Profile',
        description: 'Shows your Cal profile',
        availableColumns: [
          {
            name: 'id',
            type: 'bigint',
          },
          {
            name: 'username',
            type: 'text',
          },
          {
            name: 'email',
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
            defaultValue: 'my_profile',
            editable: false,
            required: true,
            type: 'text',
          },
        ],
      },
      {
        label: 'Event Types',
        description: 'Shows your Event Types',
        availableColumns: [
          {
            name: 'attrs',
            type: 'jsonb',
          },
        ],
        options: [
          {
            name: 'object',
            defaultValue: 'event-types',
            editable: false,
            required: true,
            type: 'text',
          },
        ],
      },
      {
        label: 'Bookings',
        description: 'Shows your Bookings',
        availableColumns: [
          {
            name: 'attrs',
            type: 'jsonb',
          },
        ],
        options: [
          {
            name: 'object',
            defaultValue: 'bookings',
            editable: false,
            required: true,
            type: 'text',
          },
        ],
      },
      {
        label: 'Calendars',
        description: 'Shows your Calendars',
        availableColumns: [
          {
            name: 'attrs',
            type: 'jsonb',
          },
        ],
        options: [
          {
            name: 'object',
            defaultValue: 'calendars',
            editable: false,
            required: true,
            type: 'text',
          },
        ],
      },
      {
        label: 'Schedules',
        description: 'Shows your Schedules',
        availableColumns: [
          {
            name: 'id',
            type: 'bigint',
          },
          {
            name: 'name',
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
            defaultValue: 'schedules',
            editable: false,
            required: true,
            type: 'text',
          },
        ],
      },
      {
        label: 'Conferencing',
        description: 'Shows conferencing',
        availableColumns: [
          {
            name: 'id',
            type: 'bigint',
          },
          {
            name: 'attrs',
            type: 'jsonb',
          },
        ],
        options: [
          {
            name: 'object',
            defaultValue: 'conferencing',
            editable: false,
            required: true,
            type: 'text',
          },
        ],
      },
    ],
  },
]
