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

export const getTheme = (isDarkTheme: boolean) => {
  // [TODO] Probably need better theming for light mode
  return {
    base: isDarkTheme ? 'vs-dark' : 'vs', // can also be vs-dark or hc-black
    inherit: true, // can also be false to completely replace the builtin rules
    rules: [
      { background: isDarkTheme ? '1f1f1f' : 'f0f0f0' },
      {
        token: '',
        background: isDarkTheme ? '1f1f1f' : 'f0f0f0',
        foreground: isDarkTheme ? 'd4d4d4' : '444444',
      },
      { token: 'string.sql', foreground: '24b47e' },
      { token: 'comment', foreground: '666666' },
      { token: 'predefined.sql', foreground: isDarkTheme ? 'D4D4D4' : '444444' },
    ],
    colors: { 'editor.background': isDarkTheme ? '#1f1f1f' : '#f0f0f0' },
  }
}
