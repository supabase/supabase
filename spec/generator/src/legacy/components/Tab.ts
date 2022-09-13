const Tab = (library: string, exampleText: string) =>
  `
<TabItem value="${library}">

${exampleText}

</TabItem>
`.trim()

export default Tab
