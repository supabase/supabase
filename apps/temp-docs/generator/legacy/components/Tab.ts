const Tab = (library: string, exampleText: string) =>
  `
<TabPanel id="${library}" label="${library}">

${exampleText}

</TabPanel>
`.trim()

export default Tab
