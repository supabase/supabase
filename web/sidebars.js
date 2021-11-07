/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const supabaseClient = require('./sidebar_spec_supabase')
const supabaseCli = require('./sidebar_spec_cli')
const dart = require('./sidebar_spec_dart')

module.exports = {
  supabaseClient: [
    {
      type: 'category',
      label: 'Javascript',
      collapsed: false,
      items: supabaseClient.docs,
    },
    // {
    //   type: 'category',
    //   label: 'Postgres',
    //   collapsed: false,
    //   items: postgres.docs,
    // },
    {
      type: 'category',
      label: 'Dart',
      collapsed: false,
      items: dart.docs,
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
        'guides/with-redwoodjs',
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
        'going-into-prod',
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
      items: ['guides', 'guides/local-development'],
      collapsed: false,
    },
    {
      type: 'category',
      label: 'Database',
      collapsed: false,
      items: [
        'guides/database/introduction',
        'guides/database/tables',
        'guides/database/functions',
        'guides/database/full-text-search',
        // 'guides/database/json',
        // 'guides/database/arrays',
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
        {
          type: 'category',
          label: 'Configuration',
          collapsed: true,
          items: [
            'guides/database/timeouts',
            'guides/database/replication',
            'guides/database/managing-passwords',
            'guides/database/managing-timezones',
          ],
        },
      ],
    },
    {
      type: 'category',
      label: 'Auth',
      collapsed: false,
      items: [
        'guides/auth/intro',
        {
          type: 'category',
          label: 'Authentication',
          collapsed: true,
          items: [
            'guides/auth/auth-apple',
            'guides/auth/auth-bitbucket',
            'guides/auth/auth-discord',
            'guides/auth/auth-facebook',
            'guides/auth/auth-github',
            'guides/auth/auth-gitlab',
            'guides/auth/auth-google',
            'guides/auth/auth-slack',
            'guides/auth/auth-spotify',
            'guides/auth/auth-twitter',
            'guides/auth/auth-twitch',
            'guides/auth/auth-twilio',
            'guides/auth/auth-messagebird',
          ],
        },
        {
          type: 'category',
          label: 'Authorization',
          collapsed: true,
          items: ['guides/auth/row-level-security', 'guides/auth/managing-user-data'],
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
    {
      type: 'category',
      label: 'Self Hosting',
      collapsed: false,
      items: ['guides/hosting/overview', 'guides/hosting/platform', 'guides/hosting/docker'],
    },
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
