const navigation = [
  { name: 'Guides', href: '#', icon: null, current: true },
  { name: 'Reference', href: '#', icon: null, current: false },
  { name: 'Examples', href: '#', icon: null, current: false },
  { name: 'API', href: '#', icon: null, current: false },
  { name: 'Forum', href: '#', icon: null, current: false },
]

function classNames(...classes: string[]) {
  return classes.filter(Boolean).join(' ')
}

export default function Sidebar() {
  return (
    <nav className="space-y-1 px-2">
      {navigation.map((item) => (
        <a
          key={item.name}
          href={item.href}
          className={classNames(
            item.current ? 'bg-indigo-800 text-white' : 'text-indigo-100 hover:bg-indigo-600',
            'group flex items-center rounded-md px-2 py-2 text-base font-medium'
          )}
        >
          {item.name}
        </a>
      ))}
    </nav>
  )
}
