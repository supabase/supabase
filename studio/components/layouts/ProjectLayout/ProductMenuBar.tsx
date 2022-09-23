import { FC, ReactNode, useState } from 'react'
import { useFlag } from 'hooks'
import { IconArrowLeft, IconArrowRight } from '@supabase/ui'

interface Props {
  title: string
  children: ReactNode
}

const ProductMenuBar: FC<Props> = ({ title, children }) => {
  const ongoingIncident = useFlag('ongoingIncident')
  const maxHeight = ongoingIncident ? 'calc(100vh - 44px)' : '100vh'
  const [isOpen, setIsOpen] = useState(true)

  return (
    <div
      style={{ height: maxHeight, maxHeight }}
      className={[
        'hide-scrollbar flex w-64 flex-col border-r transition-all ease-out duration-500', // Layout
        'bg-sidebar-linkbar-light', // Light mode
        'dark:bg-sidebar-linkbar-dark dark:border-dark ', // Dark mode
        `${!isOpen ? 'w-16' : ''}`,
      ].join(' ')}
    >
      <div
        className="dark:border-dark flex max-h-12 items-center border-b px-6 justify-between"
        style={{ minHeight: '3rem' }}
      >
        <h4 className={`text-lg ${!isOpen ? 'hidden' : ''}`}>{title}</h4>
        {isOpen ? (
          <IconArrowLeft
            class="cursor-pointer"
            size={18}
            strokeWidth={2}
            onClick={() => setIsOpen(!isOpen)}
          />
        ) : (
          <IconArrowRight
            class="cursor-pointer"
            size={18}
            strokeWidth={2}
            onClick={() => setIsOpen(!isOpen)}
          />
        )}
      </div>
      <div className={`flex-grow overflow-y-auto ${!isOpen ? 'hidden' : ''}`}>{children}</div>
    </div>
  )
}

export default ProductMenuBar
