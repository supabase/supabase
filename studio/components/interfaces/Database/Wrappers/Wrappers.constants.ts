import { WrapperMeta } from './Wrappers.types'

export const WRAPPERS: WrapperMeta[] = [
  {
    name: 'stripe_wrapper',
    handlerName: 'stripe_fdw_handler',
    validatorName: 'stripe_fdw_validator',
    icon: '/img/icons/stripe-icon.svg',
    extensionName: 'StripeFdw',
    label: 'Stripe',
    docsUrl: 'https://supabase.com/docs/guides/database/wrappers/stripe',
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
    handlerName: 'firebase_fdw_handler',
    validatorName: 'firebase_fdw_validator',
    icon: '/img/icons/firebase-icon.svg',
    extensionName: 'FirebaseFdw',
    label: 'Firebase',
    docsUrl: 'https://supabase.com/docs/guides/database/wrappers/firebase',
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
          },
          {
            name: 'base_url',
            label: 'Base URL',
            defaultValue: 'https://identitytoolkit.googleapis.com/v1/projects',
            editable: true,
            required: true,
          },
          {
            name: 'limit',
            label: 'Limit',
            defaultValue: '10000',
            editable: true,
            required: true,
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
          },
          {
            name: 'base_url',
            label: 'Base URL',
            defaultValue: 'https://firestore.googleapis.com/v1beta1/projects',
            editable: true,
            required: true,
          },
          {
            name: 'limit',
            label: 'Limit',
            defaultValue: '10000',
            editable: true,
            required: true,
          },
        ],
      },
    ],
  },
]
