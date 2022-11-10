module.exports = {
  name: 'Stripe Docs Blue',
  type: 'dark',
  colors: {
    'editor.background': '#232323',
    'editor.foreground': '#fafafa',
    'activityBar.background': 'var(--colors-scale2)',
    'sideBar.background': 'yellow',
    'editorGroupHeader.tabsBackground': 'var(--colors-scale2)',
    'sideBarSectionHeader.background': 'var(--colors-scale2)',
    'tab.activeBackground': 'var(--colors-scale3)',
    'tab.inactiveBackground': 'var(--colors-scale2)',
    'tab.border': 'var(--colors-scale2)',
    'input.background': '#ffffff1a',
    'panel.background': '#1A2652',
    'panel.border': '#1A2652',
    'editorWidget.background': '#0d0f2b',
    'editorWidget.foreground': '#ffffff4d',
    'editorWidget.border': 'var(--colors-scale5)',
    'list.hoverBackground': '#ffffff1a',
    'list.activeSelectionBackground': '#ffffff1a',
    'list.inactiveSelectionBackground': '#ffffff1a',
    'editor.hoverHighlightBackground': '#ffffff1a',
    'editor.selectionHighlightBackground': '#ffffff1a',
    'activityBarBadge.background': 'yellow',
    'sideBarTitle.foreground': 'var(--colors-scale2)',
    'statusBar.background': 'var(--colors-scale2)',
  },
  tokenColors: [
    {
      name: 'Comment',
      scope: ['comment', 'punctuation.definition.comment'],
      settings: {
        foreground: '#a3acb9',
        fontStyle: '',
      },
    },
    {
      name: 'Variables',
      scope: ['source', 'variable', 'variable.other.object', 'string constant.other.placeholder'],
      settings: {
        foreground: '#f5fbff',
      },
    },
    {
      name: 'Colors',
      scope: ['variable.other.constant', 'constant.other.color'],
      settings: {
        foreground: '#ffffff',
        fontStyle: 'bold',
      },
    },
    {
      name: 'Invalid',
      scope: ['invalid', 'invalid.illegal'],
      settings: {
        foreground: '#FF5370',
      },
    },
    {
      name: 'Keyword, Storage',
      scope: ['keyword', 'storage.type', 'storage.modifier'],
      settings: {
        foreground: '#98C1FE',
        fontStyle: 'bold',
      },
    },

    {
      name: 'Function',
      scope: ['entity.name.function'],
      settings: {
        foreground: '#7fd3ed',
        fontStyle: 'bold',
      },
    },

    {
      name: 'Tag',
      scope: ['entity.name.tag', 'meta.tag.sgml', 'markup.deleted.git_gutter'],
      settings: {
        foreground: '#98C1FE',
        fontStyle: 'bold',
      },
    },

    {
      name: 'Parameter, Property',
      scope: [
        'variable.parameter',
        'variable.other.object.property',
        'variable.other.property',
        'keyword.other.unit',
        'keyword.other',
      ],
      settings: {
        foreground: '#F2AFE3',
      },
    },
    {
      name: 'Number, Constant, Function Argument, Tag Attribute, Embedded',
      scope: [
        'constant.numeric',
        'constant.language',
        'support.constant',
        'constant.character',
        'constant.escape',
      ],
      settings: {
        foreground: '#f8b886',
      },
    },
    {
      name: 'String, Symbols, Inherited Class, Markup Heading',
      scope: [
        'string',
        'constant.other.symbol',
        'constant.other.key',
        'entity.other.inherited-class',
        'markup.heading',
        'markup.inserted.git_gutter',
        'meta.group.braces.curly constant.other.object.key.js string.unquoted.label.js',
      ],
      settings: {
        foreground: '#85d99e',
      },
    },
    {
      name: 'Entity Types',
      scope: ['support.type'],
      settings: {
        foreground: '#B2CCD6',
      },
    },
    {
      name: 'CSS Class and Support',
      scope: [
        'source.css support.type.property-name',
        'source.sass support.type.property-name',
        'source.scss support.type.property-name',
        'source.less support.type.property-name',
        'source.stylus support.type.property-name',
        'source.postcss support.type.property-name',
      ],
      settings: {
        foreground: '#B2CCD6',
      },
    },
    {
      name: 'Language methods',
      scope: ['variable.language'],
      settings: {
        fontStyle: 'italic',
        foreground: '#FF5370',
      },
    },

    {
      name: 'Attributes',
      scope: ['entity.other.attribute-name'],
      settings: {
        foreground: '#98C1FE',
        fontStyle: 'italic',
      },
    },
    {
      name: 'Inserted',
      scope: ['markup.inserted'],
      settings: {
        foreground: '#C3E88D',
      },
    },
    {
      name: 'Deleted',
      scope: ['markup.deleted'],
      settings: {
        foreground: '#FF5370',
      },
    },
    {
      name: 'Changed',
      scope: ['markup.changed'],
      settings: {
        foreground: '#C792EA',
      },
    },
    {
      name: 'Regular Expressions',
      scope: ['string.regexp'],
      settings: {
        foreground: '#89DDFF',
      },
    },
    {
      name: 'Escape Characters',
      scope: ['constant.character.escape'],
      settings: {
        foreground: '#89DDFF',
      },
    },
    {
      name: 'URL',
      scope: ['*url*', '*link*', '*uri*'],
      settings: {
        fontStyle: 'underline',
      },
    },
    {
      name: 'ES7 Bind Operator',
      scope: ['source.js constant.other.object.key.js string.unquoted.label.js'],
      settings: {
        fontStyle: 'italic',
        foreground: '#FF5370',
      },
    },

    {
      name: 'Markdown - Plain',
      scope: ['text.html', 'punctuation.definition.list_item'],
      settings: {
        foreground: '#f5fbff',
      },
    },
    {
      name: 'Markdown - Markup Raw Inline',
      scope: ['text.html.markdown markup.inline.raw.markdown'],
      settings: {
        foreground: '#C792EA',
      },
    },
    {
      name: 'Markdown - Markup Raw Inline Punctuation',
      scope: ['text.html.markdown markup.inline.raw.markdown punctuation.definition.raw.markdown'],
      settings: {
        foreground: '#65737E',
      },
    },
    {
      name: 'Markdown - Heading',
      scope: [
        'markdown.heading',
        'markup.heading | markup.heading entity.name',
        'markup.heading.markdown punctuation.definition.heading.markdown',
      ],
      settings: {
        foreground: '#C3E88D',
      },
    },
    {
      name: 'Markup - Italic',
      scope: ['markup.italic'],
      settings: {
        fontStyle: 'italic',
        foreground: '#f07178',
      },
    },
    {
      name: 'Markup - Bold',
      scope: ['markup.bold', 'markup.bold string'],
      settings: {
        fontStyle: 'bold',
        foreground: '#f07178',
      },
    },
    {
      name: 'Markup - Bold-Italic',
      scope: [
        'markup.bold markup.italic',
        'markup.italic markup.bold',
        'markup.quote markup.bold',
        'markup.bold markup.italic string',
        'markup.italic markup.bold string',
        'markup.quote markup.bold string',
      ],
      settings: {
        fontStyle: 'bold',
        foreground: '#f07178',
      },
    },
    {
      name: 'Markup - Underline',
      scope: ['markup.underline'],
      settings: {
        fontStyle: 'underline',
        foreground: '#F78C6C',
      },
    },
    {
      name: 'Markdown - Blockquote',
      scope: ['markup.quote punctuation.definition.blockquote.markdown'],
      settings: {
        foreground: '#65737E',
      },
    },
    {
      name: 'Markup - Quote',
      scope: ['markup.quote'],
      settings: {
        fontStyle: 'italic',
      },
    },

    {
      name: 'Markdown - Link Description',
      scope: ['string.other.link.description.title.markdown'],
      settings: {
        foreground: '#C792EA',
      },
    },
    {
      name: 'Markdown - Link Anchor',
      scope: ['constant.other.reference.link.markdown'],
      settings: {
        foreground: '#FFCB6B',
      },
    },
    {
      name: 'Markup - Raw Block',
      scope: ['markup.raw.block'],
      settings: {
        foreground: '#C792EA',
      },
    },
    {
      name: 'Markdown - Raw Block Fenced',
      scope: ['markup.raw.block.fenced.markdown'],
      settings: {
        foreground: '#00000050',
      },
    },
    {
      name: 'Markdown - Fenced Bode Block',
      scope: ['punctuation.definition.fenced.markdown'],
      settings: {
        foreground: '#00000050',
      },
    },
    {
      name: 'Markdown - Fenced Bode Block Variable',
      scope: [
        'markup.raw.block.fenced.markdown',
        'variable.language.fenced.markdown',
        'punctuation.section.class.end',
      ],
      settings: {
        foreground: '#EEFFFF',
      },
    },
    {
      name: 'Markdown - Fenced Language',
      scope: ['variable.language.fenced.markdown'],
      settings: {
        foreground: '#65737E',
      },
    },
    {
      name: 'Markdown - Separator',
      scope: ['meta.separator'],
      settings: {
        fontStyle: 'bold',
        foreground: '#65737E',
      },
    },
    {
      name: 'Markup - Table',
      scope: ['markup.table'],
      settings: {
        foreground: '#EEFFFF',
      },
    },
  ],
}
