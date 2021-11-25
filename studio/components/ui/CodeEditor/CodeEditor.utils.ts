export const alignEditor = (editor: any) => {
  // Add margin above first line
  editor.changeViewZones((accessor: any) => {
    accessor.addZone({
      afterLineNumber: 0,
      heightInPx: 10,
      domNode: document.createElement('div'),
    })
  })
}

export const getTheme = (isDarkTheme: boolean) => {
  // [TODO] Probably need better theming for light mode
  return {
    base: 'vs-dark', // can also be vs-dark or hc-black
    inherit: true, // can also be false to completely replace the builtin rules
    colors: {
      'editor.background': isDarkTheme ? '#1F1F1F' : '#FFFFFF',
    },
    rules: [
      { background: isDarkTheme ? '1F1F1F' : 'FFFFFF' },
      { token: '', foreground: isDarkTheme ? 'D4D4D4' : '444444' },
      { token: 'string.sql', foreground: '24B47E' },
      { token: 'comment', foreground: '666666' },
      { token: 'predefined.sql', foreground: isDarkTheme ? 'D4D4D4' : '444444' },
      // { token: '', foreground: 'ffcc00' }, // Trying to figure out how to change the border color of the row selected
    ],
  }
}
