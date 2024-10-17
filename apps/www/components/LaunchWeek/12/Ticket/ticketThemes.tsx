export const themes = {
  regular: {
    OG_BACKGROUND: '#121212',
    TICKET_BORDER: '#242424',
    TICKET_FOREGROUND: '#FAFAFA',
    TICKET_FOREGROUND_LIGHT: '#B4B4B4',
    TICKET_BACKGROUND: '#1F1F1F',
    TICKET_BACKGROUND_CODE: '#171717',
    CODE_HIGHLIGHT_BACKGROUND: '#292929',
    CODE_HIGHLIGHT_BORDER: '',
    CODE_LINE_NUMBER: '#4D4D4D',
    CODE_THEME: {
      hljs: {
        color: '#fff', // corresponds to --ray-foreground
      },
      'hljs-keyword': {
        color: '#bda4ff', // corresponds to --ray-token-keyword
      },
      'hljs-number': {
        color: '#ffffff', // corresponds to --ray-token-constant
      },
      'hljs-string': {
        color: '#ffcda1', // corresponds to --ray-token-string
        fontWeight: 'bold',
      },
      'hljs-comment': {
        color: 'purple', // corresponds to --ray-token-comment
      },
      'hljs-params': {
        color: '#ffffff', // corresponds to --ray-token-parameter
      },
      'hljs-function': {
        color: '3ecf8e', // corresponds to --ray-token-function
      },
      'hljs-variable': {
        color: '#ffcda1', // corresponds to --ray-token-string-expression
      },
      'hljs-punctuation': {
        color: '#ffffff', // corresponds to --ray-token-punctuation
      },
      'hljs-link': {
        color: '#ffffff', // corresponds to --ray-token-link
      },
      'hljs-literal': {
        color: '#ffffff', // corresponds to --ray-token-number
      },
      'hljs-attr': {
        color: '#3ecf8e', // corresponds to --ray-token-property
      },
    },
  },
  platinum: {
    OG_BACKGROUND: '#121212',
    TICKET_BORDER: '#242424',
    TICKET_FOREGROUND: '#FAFAFA',
    TICKET_FOREGROUND_LIGHT: '#888888',
    TICKET_BACKGROUND: '#212427',
    TICKET_BACKGROUND_CODE: '#24292D',
    CODE_HIGHLIGHT_BACKGROUND: '#272B2E',
    CODE_HIGHLIGHT_BORDER: '',
    CODE_LINE_NUMBER: '#4D4D4D',
    CODE_THEME: {
      hljs: {
        color: '#abb2bf', // General text color
      },
      'hljs-keyword': {
        color: '#c678dd', // Keywords like "await"
      },
      'hljs-string': {
        color: '#98c379', // Strings
        fontWeight: 'bold',
      },
      'hljs-title': {
        color: '#e06c75', // Titles (like function names)
      },
      'hljs-variable': {
        color: '#e06c75', // Variables
      },
      'hljs-attr': {
        color: '#d19a66', // Attributes
      },
      'hljs-number': {
        color: '#d19a66', // Numbers
      },
      'hljs-comment': {
        color: '#5c6370', // Comments
      },
      'hljs-function': {
        color: '#61afef', // Function names
      },
      'hljs-params': {
        color: '#abb2bf', // Parameters
      },
      'hljs-punctuation': {
        color: '#abb2bf', // Punctuation
      },
      'hljs-meta': {
        color: '#abb2bf', // Meta
      },
      'hljs-literal': {
        color: '#56b6c2', // Literal values
      },
      'hljs-link': {
        color: '#61afef', // Links
      },
    },
  },
  secret: {
    OG_BACKGROUND: '#0F2BE6',
    TICKET_BORDER: '#3059F2',
    TICKET_FOREGROUND: '#EDEDED',
    TICKET_FOREGROUND_LIGHT: '#EDEDED',
    TICKET_BACKGROUND: '#0F2BE6',
    TICKET_BACKGROUND_CODE: '#0000B4',
    CODE_HIGHLIGHT_BACKGROUND: '#3059F2',
    CODE_HIGHLIGHT_BORDER: '#73B2FA',
    CODE_LINE_NUMBER: '#5F7BF6',
    CODE_THEME: {
      hljs: {
        color: '#fff', // General text color
      },
      'hljs-keyword': {
        color: '#fff', // Keywords like "await"
      },
      'hljs-string': {
        color: 'white', // Strings
        fontWeight: 'bold',
      },
      'hljs-title': {
        color: '#e06c75', // Titles (like function names)
      },
      'hljs-variable': {
        color: '#e06c75', // Variables
      },
      'hljs-attr': {
        color: '#fff', // Attributes
      },
      'hljs-number': {
        color: '#d19a66', // Numbers
      },
      'hljs-comment': {
        color: '#5c6370', // Comments
      },
      'hljs-function': {
        color: '#61afef', // Function names
      },
      'hljs-params': {
        color: '#abb2bf', // Parameters
      },
      'hljs-punctuation': {
        color: '#abb2bf', // Punctuation
      },
      'hljs-meta': {
        color: '#abb2bf', // Meta
      },
      'hljs-literal': {
        color: '#56b6c2', // Literal values
      },
      'hljs-link': {
        color: '#61afef', // Links
      },
    },
  },
}
