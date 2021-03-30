/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

const goTrueClient = require('./sidebar_spec_gotrue')
const postgrestClient = require('./sidebar_spec_postgrest')
const realtimeClient = require('./sidebar_spec_realtime')
const supabaseClient = require('./sidebar_spec_supabase')
// const supabaseCli = require('./sidebar_spec_cli')
const postgres = require('./sidebar_spec_postgres')

module.exports = {
  goTrueClient: [
    {
      type: 'category',
      label: 'Javascript',
      collapsed: false,
      items: goTrueClient.docs,
    },
  ],
  postgrestClient: [
    {
      type: 'category',
      label: 'Javascript',
      collapsed: false,
      items: postgrestClient.docs,
    },
  ],
  realtimeClient: [
    {
      type: 'category',
      label: 'Javascript',
      collapsed: false,
      items: realtimeClient.docs,
    },
  ],
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
    // {
    //   type: 'category',
    //   label: 'CLI',
    //   collapsed: false,
    //   items: supabaseCli.docs,
    // },
  ],
  docs: [
    { type: 'category', label: 'Introduction', items: ['about', 'faq'], collapsed: false },
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'guides/platform',
        'guides/database',
        'guides/auth',
        'guides/storage',
        'guides/client-libraries',
      ],
    },
    {
      type: 'category',
      label: 'See Also',
      collapsed: false,
      items: ['guides/examples', 'pricing', 'support', 'handbook/contributing', 'company/terms'],
    },
  ],
  resources: [
    { type: 'category', label: 'Resources', items: ['resources'], collapsed: false },
    // { type: 'category', label: 'Resources', collapsed: false },
    {
      type: 'category',
      label: 'Learn',
      collapsed: false,
      items: [
        {
          type: 'category',
          label: 'Auth Deep Dive',
          collapsed: false,
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
    {
      type: 'category',
      label: 'Tools',
      collapsed: false,
      items: [
        'gotrue/server/about',
        'gotrue/client/index',
        'postgrest/server/about',
        'postgrest/client/index',
        'realtime/server/about',
        'realtime/client/index',
      ],
    },
  ],
  // realtimeServer: [
  //   {
  //     type: 'category',
  //     label: 'Realtime',
  //     collapsed: false,
  //     items: ['realtime/server/about'],
  //   },
  //   {
  //     type: 'category',
  //     label: 'Self hosting',
  //     collapsed: false,
  //     items: [
  //       'realtime/server/docker',
  //       'realtime/server/aws',
  //       'realtime/server/digitalocean',
  //       'realtime/server/source',
  //     ],
  //   },
  // ],
  // realtimeClient: [
  //   {
  //     type: 'category',
  //     label: 'Realtime',
  //     collapsed: false,
  //     items: ['realtime/client/about'],
  //   },
  // ],
  // postgrestServer: [
  //   {
  //     type: 'category',
  //     label: 'PostgREST',
  //     collapsed: false,
  //     items: ['postgrest/server/about'],
  //   },
  // ],
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
