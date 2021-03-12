const Tabs = (id, libraries = [], examples = []) =>
  `
<Tabs
  defaultValue="js"
  groupId="${id}"
  values={[${libraries.map((x) => `{ label: '${x.name}', value: '${x.id}' }`).toString()}]}>

${examples}

</Tabs>
`.trim()

export default Tabs