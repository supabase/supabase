/**
 * Copyright (c) 2017-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */

module.exports = {
  docs: [
    { type: 'category', label: 'Introduction', items: ['about', 'faq'], collapsed: false },
    {
      type: 'category',
      label: 'Client library',
      collapsed: false,
      items: ['library/getting-started'],
    },
    {
      type: 'category',
      label: 'Auth',
      collapsed: false,
      items: ['library/user-management'],
    },
    {
      type: 'category',
      label: 'Database',
      collapsed: false,
      items: [
        'library/get',
        'library/post',
        'library/patch',
        'library/delete',
        'library/stored-procedures',
      ],
    },
    {
      type: 'category',
      label: 'PostgREST',
      collapsed: false,
      items: ['postgrest/about'],
    },
    {
      type: 'category',
      label: 'Realtime',
      collapsed: false,
      items: ['library/subscribe'],
    },
    {
      type: 'category',
      label: 'See Also',
      collapsed: false,
      items: ['guides/examples', 'pricing', 'support', 'handbook/contributing'],
    },
    // Handbook: ['handbook/introduction', 'handbook/contributing'],
  ],
  realtime: [
    {
      type: 'category',
      label: 'Realtime',
      collapsed: false,
      items: ['realtime/about'],
    },
    {
      type: 'category',
      label: 'Self hosting',
      collapsed: false,
      items: ['realtime/docker', 'realtime/aws', 'realtime/digitalocean', 'realtime/source'],
    },
  ],
  postgres: [
    {
      type: 'category',
      label: 'Postgres',
      collapsed: false,
      items: ['postgres/about'],
    },
  ],
}
