type params = { name: string; description: string; tabs: string }

const Example = ({ name, description = '', tabs = '' }: params) =>
  `
### ${name}

${description}

${tabs}
`.trim()

export default Example
