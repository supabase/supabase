export default function SidebarCategory(name, items) {
  return `{
      type: 'category',
      label: '${name}',
      items: [${items.join(', ')}],
      collapsed: true,
    }`
}
