export default {
  title: 'Supabase',
  description: 'Supercharge your database.',
  // src: 'pages',
  // files: 'pages/**/*.mdx',
  // propsParser: false,
  // codeSandbox: false,
  htmlContext: {
    head: {
      links: [
        {
          rel: 'stylesheet',
          href: 'https://codemirror.net/theme/blackboard.css',
        },
      ],
    },
  },
  menu: ['Supabase', 'Realtime', 'Documents'],
  themeConfig: {
    mode: 'dark',
    codemirrorTheme: 'blackboard',
    showPlaygroundEditor: false,
    linesToScrollEditor: 50,
    colors: {
      codeColor: '#8DB6DE',
      codeBg: '#0C1021',
      blockquoteColor: '#8DB6DE',
      blockquoteBg: '#0C1021',
    },
  },
}
