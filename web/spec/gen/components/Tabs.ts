const Tabs = (libraries = [], examples = []) =>
  `
<Tabs
  defaultValue="js"
  groupId="libraries"
  values={[${libraries.map((x) => `{ label: '${x.name}', value: '${x.id}' }`).toString()}]}>

${examples}

</Tabs>
`.trim()

export default Tabs