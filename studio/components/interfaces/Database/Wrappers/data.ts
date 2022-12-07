import { Wrapper } from './types'

export const wrappers: Wrapper[] = [
  {
    name: 'stripe_wrapper',
    icon: '/img/icons/stripe-icon.svg',
    extensionName: 'StripeFdw',
    label: 'Stripe',
    server: {
      name: 'stripe_server',
      options: [
        {
          name: 'api_key_id',
          label: 'Stripe Secret Key',
          required: true,
          encrypted: true,
        },
        {
          name: 'api_url',
          label: 'Stripe API URL',
          defaultValue: 'https://api.stripe.com/v1',
          required: false,
          encrypted: false,
        },
      ],
    },
    tables: [
      {
        label: 'Balance',
        availableColumns: [
          {
            name: 'amount',
            type: 'bigint',
          },
          {
            name: 'currency',
            type: 'text',
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
    ],
  },
  {
    name: 'firebase_wrapper',
    icon: '/img/icons/firebase-icon.svg',
    extensionName: 'FirebaseFdw',
    label: 'Firebase',
    server: {
      name: 'firebase_server',
      options: [
        {
          name: 'project_id',
          label: 'Project ID',
          required: true,
          encrypted: false,
        },
        {
          name: 'sa_key_id',
          label: 'Service Account Key',
          required: true,
          encrypted: true,
        },
      ],
    },
    tables: [
      {
        label: 'Users',
        availableColumns: [
          {
            name: 'local_id',
            type: 'text',
          },
          {
            name: 'email',
            type: 'text',
          },
          {
            name: 'fields',
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
        ],
      },
      {
        label: 'Firestore Collection',
        availableColumns: [
          {
            name: 'name',
            type: 'text',
          },
          {
            name: 'fields',
            type: 'jsonb',
          },
          {
            name: 'create_time',
            type: 'timestamp',
          },
          {
            name: 'update_time',
            type: 'timestamp',
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
        ],
      },
    ],
  },
]
