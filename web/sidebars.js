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
      label: 'Library',
      collapsed: false,
      items: [
        'library/getting-started',
        'library/user-management',
        'library/get',
        'library/post',
        'library/patch',
        'library/delete',
        'library/subscribe',
        'library/stored-procedures',
      ],
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
      items: [
        'realtime/about',
        'realtime/docker',
        'realtime/aws',
        'realtime/digitalocean',
        'realtime/source',
      ],
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
