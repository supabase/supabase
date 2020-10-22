const Tabs = (libraries = [], examples = []) =>
  `
<Tabs
  groupId="libraries"
  values={[${libraries.map((x) => `{ label: '${x.name}', value: '${x.id}' }`).toString()}]}>

${examples}

</Tabs>
`.trim()

export default Tabs