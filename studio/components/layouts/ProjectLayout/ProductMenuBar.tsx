import { FC, ReactNode } from 'react'
import { useFlag } from 'hooks'

interface Props {
  title: string
  children: ReactNode
}

const ProductMenuBar: FC<Props> = ({ title, children }) => {
  const ongoingIncident = useFlag('ongoingIncident')
  const maxHeight = ongoingIncident ? 'calc(100vh - 44px)' : '100vh'

  return (
    <div
      style={{ height: maxHeight, maxHeight }}
      className={[
        'hide-scrollbar flex w-64 flex-col border-r', // Layout
        'bg-sidebar-linkbar-light', // Light mode
        'dark:bg-sidebar-linkbar-dark dark:border-dark ', // Dark mode
      ].join(' ')}
    >
      <div
        className="dark:border-dark flex max-h-12 items-center border-b px-6"
        style={{ minHeight: '3rem' }}
      >
        <h4 className="text-lg">{title}</h4>
      </div>
      <div className="flex-grow overflow-y-auto">{children}</div>
    </div>
  )
}

export default ProductMenuBar
