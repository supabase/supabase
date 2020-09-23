type params = { name: string; tabs: string }

const Example = ({ name, tabs = '' }: params) =>
  `
### ${name}

${tabs}
`.trim()

export default Example
