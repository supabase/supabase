import { PropsWithChildren } from 'react'

interface ProductMenuBarProps {
  title: string
}

const ProductMenuBar = ({ title, children }: PropsWithChildren<ProductMenuBarProps>) => {
  return (
    <div
      className={[
        'hide-scrollbar flex w-64 flex-col border-r', // Layout
        'bg-background',
        'border-default ',
      ].join(' ')}
    >
      <div
        className="dark:border-dark flex max-h-12 items-center border-b px-6"
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
