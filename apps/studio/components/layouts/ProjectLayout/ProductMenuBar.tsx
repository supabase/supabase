import { PropsWithChildren } from 'react'

interface ProductMenuBarProps {
  title: string
  expanded?: boolean
}

const ProductMenuBar = ({ title, expanded = true, children }: PropsWithChildren<ProductMenuBarProps>) => {
  const isExpanded = expanded ? 'w-64' : 'w-0';
  return (
    <div
      className={[
        isExpanded,
        'hide-scrollbar flex md:w-64 flex-col border-r', // Layout
        'bg-background',
        'border-default ',
      ].join(' ')}
    >
      <div
        className="border-default flex max-h-12 items-center border-b px-6"
        style={{ minHeight: '3rem' }}
      >
        <h4 className="text-lg">{title}</h4>
      </div>
      <div className="flex-grow overflow-y-auto" style={{ maxHeight: 'calc(100vh - 96px)' }}>
        {children}
      </div>
    </div>
  )
}

export default ProductMenuBar
