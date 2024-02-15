import { PropsWithChildren } from 'react'

interface ProductMenuBarProps {
  title: string
}

const ProductMenuBar = ({ title, children }: PropsWithChildren<ProductMenuBarProps>) => {
  return (
    <div
      className={[
        'hide-scrollbar flex w-64 flex-col border-r', // Layout
        'bg-studio',
        'border-default ',
      ].join(' ')}
    >
      <div
        className="border-default flex max-h-12 items-center border-b px-6"
        style={{ minHeight: '3rem' }}
      >
        <h4 className="text-lg">{title}</h4>
      </div>
      <div className="flex-grow overflow-y-auto">{children}</div>
    </div>
  )
}

export default ProductMenuBar
