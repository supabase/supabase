export default function SidebarCategory(name: string, items: string[]) {
  return `{
      type: 'category',
      label: '${name}',
      items: [${items.join(', ')}],
      collapsed: true,
    }`
}
