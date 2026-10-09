export const faviconTargets = [
  ['production', 'apps/studio/public/favicon'],
  ['staging', 'apps/studio/public/favicon/staging'],
  ...['studio', 'www', 'docs', 'learn', 'ui-library', 'design-system', 'kb', 'lite-studio'].map(
    (app) => ['local', `apps/${app}/public/favicon/local`]
  ),
  ...['www', 'ui-library', 'design-system'].map((app) => [
    'production',
    `apps/${app}/public/favicon`,
  ]),
  ...['docs', 'learn', 'kb'].map((app) => ['docs', `apps/${app}/public/favicon`]),
]
