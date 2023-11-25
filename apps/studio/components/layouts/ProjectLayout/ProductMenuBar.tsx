import { ArrowLeft, ArrowRight } from 'lucide-react'
import { PropsWithChildren, useState } from 'react'

interface ProductMenuBarProps {
  title: string
}

const ProductMenuBar = ({ title, children }: PropsWithChildren<ProductMenuBarProps>) => {
  const [open, setOpen] = useState(true)
  return (
    <div
      className={[
        'hide-scrollbar flex flex-col border-r', // Layout
        'bg-background',
        'border-default ease-in-out duration-300',
        open ? 'w-64' : 'w-10',
      ].join(' ')}
    >
      <div
        className={[
          'border-default flex max-h-12 items-center border-b justify-between ',
          open ? 'px-6' : 'px-3',
        ].join(' ')}
        style={{ minHeight: '3rem' }}
      >
        <h4 className={['text-lg ', open ? 'block' : 'hidden'].join(' ')}>{title}</h4>
        <span className="cursor-pointer text-foreground-lighter" onClick={() => setOpen(!open)}>
          {open ? (
            <ArrowLeft size={16} strokeWidth={1.5} />
          ) : (
            <ArrowRight size={16} strokeWidth={1.5} />
          )}
        </span>
      </div>
      <div
        className={['flex-grow overflow-y-auto ', open ? 'block' : 'hidden'].join(' ')}
        style={{ maxHeight: 'calc(100vh - 96px)' }}
      >
        {children}
      </div>
    </div>
  )
}

export default ProductMenuBar
