# Studio translations (proof of concept)

A small translation layer for Studio. English is the source of truth, and anything not translated
yet is shown in English.

## How it works

- People pick a language under Account → Preferences → Language. The choice is stored in
  `localStorage` (`supabase-ui-locale`), and kept when signing out. The document stays in English
  while most of Studio is untranslated.
- `LocaleProvider` (mounted alongside `TimezoneProvider` in `routes/__root.tsx`) holds the
  language. `useTranslation()` returns `{ t, locale, setLocale }`,
  and `t('some.key', { name })` looks the key up in the current language, then in English.
- Without a provider (isolated component tests, stories) `useTranslation()` renders English, so
  a component can adopt `t()` without every test that renders it needing a wrapper.
- Keys are typed. `messages/en.ts` declares every key, and `messages/ja.ts` can only use keys
  that exist there.
- Messages can contain `{placeholders}`. Tests check that a translation uses the same
  placeholders as the English text.

- `TranslatedText` marks a phrase with the resolved message language, including English fallback.
  For translated attributes such as placeholders or accessible labels, use `resolveMessage()` and
  apply its `text` and `lang` to the same element. Keep untranslated content outside translated
  regions, and mark native language names with their own language.

## Add a string

1. Add the key and the English text to `messages/en.ts`.
2. Render `<TranslatedText messageKey="your.key" />` where the text is shown.
3. Add translations to the other catalogs. Until then, English is shown.

## Add a language

1. Add the code to `LOCALES` and a label (written in that language) to `LOCALE_LABELS` in
   `locales.ts`.
2. Create `messages/<code>.ts` and register it in `translate.ts`.
3. Include the new catalog in `messages/messages.test.ts` so its keys and placeholders are
   checked against English. Add the catalog to the `translate.test.ts` fixtures and cover
   translated lookup and English fallback. If either `locales.test.ts` or
   `LocaleProvider.test.tsx` treats the new locale as unsupported, update those cases.

## Not covered yet

- Plurals and number or date formats. A message-format library can replace `interpolate()` without
  changing how components call `t()`.
- Docs, the marketing site, and everything outside Studio.
- Most Studio screens. Only the Preferences page header, Language, and Timezone are translated so far.
- Choosing a library. This layer deliberately adds no i18n library so that choice stays open
  and reuses `zod` and the existing storage adapter and query cache.
