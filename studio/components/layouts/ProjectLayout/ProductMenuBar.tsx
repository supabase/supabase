import { FC, ReactNode } from 'react'
import { Typography } from '@supabase/ui'

interface Props {
  title: string
  children: ReactNode
}

const ProductMenuBar: FC<Props> = ({ title, children }) => {
  return (
    <div
      className={[
        'w-64 h-screen flex flex-col hide-scrollbar border-r', // Layout
        'bg-sidebar-linkbar-light', // Light mode
        'dark:bg-sidebar-linkbar-dark dark:border-dark ', // Dark mode
      ].join(' ')}
    >
      <div
        className="px-6 max-h-12 border-b dark:border-dark flex items-center"
        style={{ minHeight: '3rem' }}
      >
        <Typography.Title level={4}>{title}</Typography.Title>
      </div>
      <div className="overflow-y-auto flex-grow">{children}</div>
    </div>
  )
}

export default ProductMenuBar
