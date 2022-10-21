// @ts-nocheck

const Tabs = (id: string, libraries = [], examples = []) =>
  `
<Tabs
  defaultValue="${libraries[0].id}"
  groupId="${id}"
  values={[${libraries.map((x) => `{ label: '${x.name}', value: '${x.id}' }`).toString()}]}>

${examples}

</Tabs>
`.trim()

export default Tabs
