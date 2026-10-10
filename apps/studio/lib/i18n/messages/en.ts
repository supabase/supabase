/**
 * English is the source of truth. Every translation key is declared here, and the other
 * catalogs can only use keys that exist here, so add the English text first.
 *
 * Messages may contain `{placeholders}`, which `translate()` fills in from its params.
 */
export const en = {
  'account.preferences.title': 'Preferences',
  'account.preferences.description.platform':
    'Manage your account profile, connections, and dashboard experience.',
  'account.preferences.description.selfHosted':
    'Manage how the dashboard looks and behaves on this browser and device.',

  'account.preferences.language.title': 'Language',
  'account.preferences.language.description':
    'Choose the language used in the dashboard. Anything that is not translated yet is shown in English.',
  'account.preferences.language.label': 'Display language',

  'account.preferences.timezone.title': 'Timezone',
  'account.preferences.timezone.description':
    'Choose how dates and times in logs and other dashboard surfaces are displayed.',
  'account.preferences.timezone.label': 'Display timezone',
  'account.preferences.timezone.descriptionAuto': 'Auto detected from your browser ({timezone}).',
  'account.preferences.timezone.descriptionManual':
    'Pick "Auto detect" to follow your browser timezone again.',
  'account.preferences.timezone.autoDetect': 'Auto detect',
  'account.preferences.timezone.autoDetectWithZone': 'Auto detect ({timezone})',
  'account.preferences.timezone.searchPlaceholder': 'Search timezone...',
  'account.preferences.timezone.empty': 'No timezones found',
} as const satisfies Record<string, string>

export type MessageKey = keyof typeof en
