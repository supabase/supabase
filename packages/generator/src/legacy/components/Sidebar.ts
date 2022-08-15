const Sidebar = (categories) =>
  `
module.exports = {
  docs: [
    ${categories.map((x) => x).join(',\n    ')}
  ],
}
`.trim()

export default Sidebar
