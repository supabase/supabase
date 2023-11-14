export const alignEditor = (editor: any) => {
  // Add margin above first line
  editor.changeViewZones((accessor: any) => {
    accessor.addZone({
      afterLineNumber: 0,
      heightInPx: 4,
      domNode: document.createElement('div'),
    })
  })
}

export const getTheme = (theme: string) => {
  // [TODO] Probably need better theming for light mode
  return {
    base: theme === 'dark' ? 'vs-dark' : 'vs', // can also be vs-dark or hc-black
    inherit: true, // can also be false to completely replace the builtin rules
    rules: [
      { background: theme === 'dark' ? '1f1f1f' : 'f0f0f0' },
      {
        token: '',
        background: theme === 'dark' ? '1f1f1f' : 'f0f0f0',
        foreground: theme === 'dark' ? 'd4d4d4' : '444444',
      },
      { token: 'string.sql', foreground: '24b47e' },
      { token: 'comment', foreground: '666666' },
      { token: 'predefined.sql', foreground: theme === 'dark' ? 'D4D4D4' : '444444' },
    ],
    colors: { 'editor.background': theme === 'dark' ? '#1f1f1f' : '#f0f0f0' },
  }
}
