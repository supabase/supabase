'use client'

import { LazyMotion, domAnimation, m } from 'framer-motion'
import { Check } from 'lucide-react'
import { cn } from 'ui'

export type ProductKey = 'database' | 'authentication' | 'storage' | 'functions' | 'realtime' | 'vector'

type ProductConfig = {
  name: string
  icon: string
  description: string
}

const PRODUCTS: Record<ProductKey, ProductConfig> = {
  database: {
    name: 'Database',
    icon: 'M4 3.66646C4 2.7461 4.7461 2 5.66645 2H18.9984C19.9187 2 20.6648 2.7461 20.6648 3.66645V6.99926C20.6648 7.91962 19.9187 8.66572 18.9984 8.66572H5.66646C4.7461 8.66572 4 7.91962 4 6.99926V3.66646Z M5.18625 8.66531H19.5035V15.331H5.18625V8.66531Z M4 17.0007C4 16.0804 4.7461 15.3343 5.66645 15.3343H18.9984C19.9187 15.3343 20.6648 16.0804 20.6648 17.0007V20.3335C20.6648 21.2539 19.9187 22 18.9984 22H5.66646C4.7461 22 4 21.2539 4 20.3335V17.0007Z',
    description: 'Postgres database',
  },
  authentication: {
    name: 'Auth',
    icon: 'M5.03305 15.8071H12.7252M5.03305 15.8071V18.884H12.7252V15.8071M5.03305 15.8071V12.7302H12.7252V15.8071M15.0419 8.15385V5.07692C15.0419 3.37759 13.6643 2 11.965 2C10.2657 2 8.88814 3.37759 8.88814 5.07692V8.15385M5 11.2307L5 18.9231C5 20.6224 6.37757 22 8.07689 22H15.769C17.4683 22 18.8459 20.6224 18.8459 18.9231V11.2307C18.8459 9.53142 17.4683 8.15385 15.769 8.15385L8.07689 8.15385C6.37757 8.15385 5 9.53142 5 11.2307Z',
    description: 'User authentication',
  },
  storage: {
    name: 'Storage',
    icon: 'M20.4997 12.1386V9.15811L14.8463 3.53163H6.43717C5.57423 3.53163 4.87467 4.23119 4.87467 5.09413V9.78087M20.4447 9.13199L14.844 3.53125L14.844 7.56949C14.844 8.43243 15.5436 9.13199 16.4065 9.13199L20.4447 9.13199ZM7.12729 9.78087H4.83398C3.97104 9.78087 3.27148 10.4804 3.27148 11.3434V19.1559C3.27148 20.8818 4.67059 22.2809 6.39648 22.2809H18.8965C20.6224 22.2809 22.0215 20.8818 22.0215 19.1559V13.7011C22.0215 12.8381 21.3219 12.1386 20.459 12.1386H10.8032C10.3933 12.1386 9.99969 11.9774 9.70743 11.6899L8.22312 10.2296C7.93086 9.94202 7.53729 9.78087 7.12729 9.78087Z',
    description: 'File storage',
  },
  functions: {
    name: 'Edge Functions',
    icon: 'M6.6594 21.8201C8.10788 22.5739 9.75418 23 11.5 23C17.299 23 22 18.299 22 12.5C22 10.7494 21.5716 9.09889 20.8139 7.64754M16.4016 3.21191C14.9384 2.43814 13.2704 2 11.5 2C5.70101 2 1 6.70101 1 12.5C1 14.287 1.44643 15.9698 2.23384 17.4428M2.23384 17.4428C1.81058 17.96 1.55664 18.6211 1.55664 19.3416C1.55664 20.9984 2.89979 22.3416 4.55664 22.3416C6.21349 22.3416 7.55664 20.9984 7.55664 19.3416C7.55664 17.6847 6.21349 16.3416 4.55664 16.3416C3.62021 16.3416 2.78399 16.7706 2.23384 17.4428ZM21.5 5.64783C21.5 7.30468 20.1569 8.64783 18.5 8.64783C16.8432 8.64783 15.5 7.30468 15.5 5.64783C15.5 3.99097 16.8432 2.64783 18.5 2.64783C20.1569 2.64783 21.5 3.99097 21.5 5.64783ZM18.25 12.5C18.25 16.2279 15.2279 19.25 11.5 19.25C7.77208 19.25 4.75 16.2279 4.75 12.5C4.75 8.77208 7.77208 5.75 11.5 5.75C15.2279 5.75 18.25 8.77208 18.25 12.5Z',
    description: 'Serverless functions',
  },
  realtime: {
    name: 'Realtime',
    icon: 'M9.15928 1.94531V5.84117M6.24345 5.84117L2.91385 2.40977M6.24345 8.53673H2.4248M16.7998 16.496L21.9988 15.2019C22.7217 15.022 22.8065 14.0285 22.1246 13.7286L9.73411 8.28034C9.08269 7.99391 8.41873 8.65652 8.70383 9.30851L14.0544 21.5445C14.3518 22.2247 15.341 22.1456 15.5266 21.4269L16.7998 16.496Z',
    description: 'Live subscriptions',
  },
  vector: {
    name: 'Vector',
    icon: 'M11.9983 11.4482V21.7337M11.9983 11.4482L21.0732 6.17699M11.9983 11.4482L2.92383 6.17723M2.92383 6.17723V12.4849M2.92383 6.17723V6.1232L8.35978 2.9657M21.0736 12.54V6.1232L15.6376 2.9657M17.7247 18.6107L11.9987 21.9367L6.27265 18.6107',
    description: 'AI embeddings',
  },
}

// Light spring animation for show/hide
const springTransition = {
  type: 'spring',
  stiffness: 400,
  damping: 30,
  mass: 0.8,
}

type ProductToggleCardProps = {
  productKey: ProductKey
  selected: boolean
  onToggle: (key: ProductKey) => void
}

export default function ProductToggleCard({ productKey, selected, onToggle }: ProductToggleCardProps) {
  const product = PRODUCTS[productKey]

  return (
    <LazyMotion features={domAnimation}>
      <m.button
        type="button"
        onClick={() => onToggle(productKey)}
        className={cn(
          'relative flex flex-col items-center gap-2 p-4 rounded-lg border transition-colors',
          'hover:border-foreground-muted',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2',
          selected
            ? 'border-brand bg-surface-75 shadow-sm'
            : 'border-border-muted bg-surface-100 hover:bg-surface-200'
        )}
        whileTap={{ scale: 0.98 }}
        transition={springTransition}
      >
        {/* Selection indicator */}
        <m.div
          className={cn(
            'absolute top-2 right-2 w-5 h-5 rounded-full flex items-center justify-center',
            selected ? 'bg-brand' : 'bg-border-strong'
          )}
          initial={false}
          animate={{
            scale: selected ? 1 : 0.8,
            opacity: selected ? 1 : 0.5,
          }}
          transition={springTransition}
        >
          {selected && <Check className="w-3 h-3 text-background" strokeWidth={3} />}
        </m.div>

        {/* Product icon */}
        <div
          className={cn(
            'w-10 h-10 rounded-md flex items-center justify-center transition-colors',
            selected ? 'bg-brand text-brand-200' : 'bg-surface-300 text-foreground-light'
          )}
        >
          <svg
            className="w-5 h-5"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.5"
              stroke="currentColor"
              d={product.icon}
            />
          </svg>
        </div>

        {/* Product name */}
        <div className="flex flex-col items-center gap-0.5">
          <span
            className={cn(
              'text-sm font-medium transition-colors',
              selected ? 'text-foreground' : 'text-foreground-light'
            )}
          >
            {product.name}
          </span>
          <span className="text-xs text-foreground-muted">{product.description}</span>
        </div>
      </m.button>
    </LazyMotion>
  )
}

export { PRODUCTS }
export type { ProductConfig }
