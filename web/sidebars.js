/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const supabaseClient = require('./sidebar_spec_supabase')
const supabaseCli = require('./sidebar_spec_cli')
const postgres = require('./sidebar_spec_postgres')

module.exports = {
  supabaseClient: [
    {
      type: 'category',
      label: 'Javascript',
      collapsed: false,
      items: supabaseClient.docs,
    },
    {
      type: 'category',
      label: 'Postgres',
      collapsed: false,
      items: postgres.docs,
    },
    {
      type: 'category',
      label: 'CLI',
      collapsed: false,
      items: supabaseCli.docs,
    },
  ],
  docs: [
    {
      type: 'category',
      label: 'Overview',
      items: [
        'about',
        'architecture',
        'guides/database',
        'guides/auth',
        'guides/storage',
        'guides/api',
        'guides/examples',
      ],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Tutorials',
      collapsed: false,
      items: [
        'guides/with-angular',
        'guides/with-flutter',
        'guides/with-nextjs',
        'guides/with-react',
        'guides/with-svelte',
        'guides/with-vue-3',
      ],
    },
    {
      type: 'category',
      label: 'See Also',
      collapsed: false,
      items: [
        'faq',
        'handbook/contributing',
        'handbook/supasquad',
        'company/terms',
        'company/privacy',
        'company/aup',
      ],
    },
  ],
  guides: [
    {
      type: 'category',
      label: 'Guides',
      items: ['guides', 'guides/platform', 'guides/local-development', 'guides/self-hosting'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Database',
      collapsed: false,
      items: [
        'guides/database/tables',
        'guides/database/full-text-search',
        {
          type: 'category',
          label: 'Connecting to Postgres',
          collapsed: true,
          items: [
            'guides/database/connecting/connecting-to-postgres',
            'guides/database/connecting/direct-connections',
            'guides/database/connecting/connection-pooling',
          ],
        },
        // 'guides/database/arrays',
        // 'guides/database/json',
        // 'guides/database/managing-passwords',
        // 'guides/database/sql-to-api',
        {
          type: 'category',
          label: 'Extensions',
          collapsed: true,
          items: [
            'guides/database/extensions',
            // 'guides/database/extensions/pgtap',
            'guides/database/extensions/plv8',
            'guides/database/extensions/http',
            'guides/database/extensions/uuid-ossp',
          ],
        },
        'guides/database/resource-management',
      ],
    },
    {
      type: 'category',
      label: 'Auth',
      collapsed: false,
      items: [
        'guides/auth/managing-user-data',
        {
          type: 'category',
          label: 'External Providers',
          collapsed: true,
          items: [
            'guides/auth/auth-apple',
            'guides/auth/auth-bitbucket',
            'guides/auth/auth-discord',
            'guides/auth/auth-facebook',
            'guides/auth/auth-github',
            'guides/auth/auth-gitlab',
            'guides/auth/auth-google',
            'guides/auth/auth-twitter',
            'guides/auth/auth-twitch',
            'guides/auth/auth-twilio',
          ],
        },
        {
          type: 'category',
          label: 'Deep Dive',
          collapsed: true,
          items: [
            'learn/auth-deep-dive/auth-deep-dive-jwts',
            'learn/auth-deep-dive/auth-row-level-security',
            'learn/auth-deep-dive/auth-policies',
            'learn/auth-deep-dive/auth-gotrue',
            'learn/auth-deep-dive/auth-google-oauth',
          ],
        },
      ],
    },
    // {
    //   type: 'category',
    //   label: 'Storage',
    //   collapsed: false,
    //   items: ['guides/storage/storage-sample'],
    // },
  ],
  postgresServer: [
    {
      type: 'category',
      label: 'Postgres',
      collapsed: false,
      items: ['postgres/server/about'],
    },
    {
      type: 'category',
      label: 'Self hosting',
      collapsed: false,
      items: ['postgres/server/docker', 'postgres/server/aws', 'postgres/server/digitalocean'],
    },
  ],
  postgresApi: [
    {
      type: 'category',
      label: 'Postgres API',
      collapsed: false,
      items: ['postgres/api/about'],
    },
  ],
}
