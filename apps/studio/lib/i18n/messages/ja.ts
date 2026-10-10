import type { MessageKey } from './en'

/**
 * Japanese translations. A key missing here falls back to English, so the catalog can grow
 * a screen at a time.
 */
export const ja: Partial<Record<MessageKey, string>> = {
  'account.preferences.title': '環境設定',
  'account.preferences.description.platform':
    'アカウントのプロフィール、連携先、ダッシュボードの使い勝手を管理します。',
  'account.preferences.description.selfHosted':
    'このブラウザと端末での、ダッシュボードの見た目や動作を管理します。',

  'account.preferences.language.title': '言語',
  'account.preferences.language.description':
    'ダッシュボードで使う言語を選びます。まだ翻訳されていない部分は英語で表示されます。',
  'account.preferences.language.label': '表示言語',

  'account.preferences.timezone.title': 'タイムゾーン',
  'account.preferences.timezone.description':
    'ログなどダッシュボードの各画面で、日付と時刻の表示方法を選びます。',
  'account.preferences.timezone.label': '表示タイムゾーン',
  'account.preferences.timezone.descriptionAuto':
    'ブラウザの設定から自動で検出しました（{timezone}）。',
  'account.preferences.timezone.descriptionManual':
    '「自動検出」を選ぶと、ブラウザのタイムゾーンに戻ります。',
  'account.preferences.timezone.autoDetect': '自動検出',
  'account.preferences.timezone.autoDetectWithZone': '自動検出（{timezone}）',
  'account.preferences.timezone.searchPlaceholder': 'タイムゾーンを検索…',
  'account.preferences.timezone.empty': 'タイムゾーンが見つかりません',
}
