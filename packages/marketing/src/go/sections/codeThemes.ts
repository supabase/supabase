import type { ThemeRegistration } from 'shiki'

export const supabaseDark: ThemeRegistration = {
  name: 'supabase-dark',
  type: 'dark',
  colors: {
    'editor.background': '#00000000',
    'editor.foreground': '#ffffff',
  },
  tokenColors: [
    {
      scope: ['keyword', 'storage', 'storage.type', 'storage.modifier'],
      settings: { foreground: '#bda4ff' },
    },
    {
      scope: [
        'entity.name.function',
        'support.function',
        'entity.name.tag',
        'support.class.component',
      ],
      settings: { foreground: '#3ecf8e' },
    },
    {
      scope: ['constant', 'variable.other.constant', 'support.constant'],
      settings: { foreground: '#3ecf8e' },
    },
    {
      scope: [
        'variable.other.property',
        'support.type.property-name',
        'meta.object-literal.key',
        'entity.other.attribute-name',
      ],
      settings: { foreground: '#3ecf8e' },
    },
    {
      scope: ['string', 'string.quoted'],
      settings: { foreground: '#ffcda1' },
    },
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#7e7e7e' },
    },
    { scope: ['variable.parameter'], settings: { foreground: '#ffffff' } },
    { scope: ['punctuation'], settings: { foreground: '#ffffff' } },
    { scope: ['constant.numeric'], settings: { foreground: '#ededed' } },
    { scope: ['markup.underline.link'], settings: { foreground: '#ffffff' } },
    { scope: ['markup.inserted'], settings: { foreground: '#3ecf8e' } },
    { scope: ['markup.deleted'], settings: { foreground: '#F06A50' } },
  ],
}

export const supabaseLight: ThemeRegistration = {
  name: 'supabase-light',
  type: 'light',
  colors: {
    'editor.background': '#00000000',
    'editor.foreground': '#525252',
  },
  tokenColors: [
    {
      scope: ['keyword', 'storage', 'storage.type', 'storage.modifier'],
      settings: { foreground: '#6b35dc' },
    },
    {
      scope: [
        'entity.name.function',
        'support.function',
        'entity.name.tag',
        'support.class.component',
      ],
      settings: { foreground: '#15593b' },
    },
    {
      scope: ['constant', 'variable.other.constant', 'support.constant'],
      settings: { foreground: '#15593b' },
    },
    {
      scope: [
        'variable.other.property',
        'support.type.property-name',
        'meta.object-literal.key',
        'entity.other.attribute-name',
      ],
      settings: { foreground: '#15593b' },
    },
    {
      scope: ['string', 'string.quoted'],
      settings: { foreground: '#f1a10d' },
    },
    {
      scope: ['comment', 'punctuation.definition.comment'],
      settings: { foreground: '#7e7e7e' },
    },
    { scope: ['variable.parameter'], settings: { foreground: '#525252' } },
    { scope: ['punctuation'], settings: { foreground: '#a0a0a0' } },
    { scope: ['constant.numeric'], settings: { foreground: '#525252' } },
    { scope: ['markup.underline.link'], settings: { foreground: '#525252' } },
  ],
}
