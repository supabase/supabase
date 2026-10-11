export const faviconTargets = [
  ['production', 'apps/studio/public/favicon'],
  ['staging', 'apps/studio/public/favicon/staging'],
  ...['www', 'ui-library', 'design-system'].map((app) => [
    'production',
    `apps/${app}/public/favicon`,
  ]),
  ...['docs', 'learn', 'kb'].map((app) => ['docs', `apps/${app}/public/favicon`]),
]
