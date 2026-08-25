// Light values clear 4.5:1 on white, taken from the docs shiki palette
const PALETTES = {
  dark: {
    foreground: '#ddd',
    keyword: '#569cd6',
    code: '#66d9ef',
    accent: '#bf79db',
    entity: '#3ECF8E',
    comment: '#999',
    muted: '#75715e',
    title: 'gray',
    lineNumber: '#828282',
  },
  light: {
    foreground: '#444',
    keyword: '#5f2fc4',
    code: '#0e7490',
    accent: '#a21caf',
    entity: '#15593b',
    comment: '#6a6a6a',
    muted: '#6a6a6a',
    title: '#6a6a6a',
    lineNumber: '#6a6a6a',
  },
} as const

export const getCodeBlockPalette = (isDarkMode: boolean) =>
  isDarkMode ? PALETTES.dark : PALETTES.light

export const monokaiCustomTheme = (isDarkMode: boolean) => {
  const c = getCodeBlockPalette(isDarkMode)

  return {
    hljs: {
      display: 'block',
      overflowX: 'auto',
      color: c.foreground,
    },
    'hljs-tag': {
      color: c.keyword,
    },
    'hljs-keyword': {
      color: c.keyword,
      fontWeight: 'normal',
    },
    'hljs-selector-tag': {
      color: c.keyword,
      fontWeight: 'normal',
    },
    'hljs-literal': {
      color: c.keyword,
      fontWeight: 'normal',
    },
    'hljs-strong': {
      color: c.keyword,
    },
    'hljs-name': {
      color: c.keyword,
    },
    'hljs-code': {
      color: c.code,
    },
    'hljs-class .hljs-title': {
      color: c.title,
    },
    'hljs-attribute': {
      color: c.accent,
    },
    'hljs-symbol': {
      color: c.accent,
    },
    'hljs-regexp': {
      color: c.accent,
    },
    'hljs-link': {
      color: c.accent,
    },
    'hljs-string': {
      color: `hsl(var(--brand-link))`,
    },
    'hljs-bullet': {
      color: c.entity,
    },
    'hljs-subst': {
      color: c.entity,
    },
    'hljs-title': {
      color: c.entity,
      fontWeight: 'normal',
    },
    'hljs-section': {
      color: c.entity,
      fontWeight: 'normal',
    },
    'hljs-emphasis': {
      color: c.entity,
    },
    'hljs-type': {
      color: c.entity,
      fontWeight: 'normal',
    },
    'hljs-built_in': {
      color: c.entity,
    },
    'hljs-builtin-name': {
      color: c.entity,
    },
    'hljs-selector-attr': {
      color: c.entity,
    },
    'hljs-selector-pseudo': {
      color: c.entity,
    },
    'hljs-addition': {
      color: c.entity,
    },
    'hljs-variable': {
      color: c.entity,
    },
    'hljs-template-tag': {
      color: c.entity,
    },
    'hljs-template-variable': {
      color: c.entity,
    },
    'hljs-comment': {
      color: c.comment,
    },
    'hljs-quote': {
      color: c.muted,
    },
    'hljs-deletion': {
      color: c.muted,
    },
    'hljs-meta': {
      color: c.muted,
    },
    'hljs-doctag': {
      fontWeight: 'normal',
    },
    'hljs-selector-id': {
      fontWeight: 'normal',
    },
  }
}
