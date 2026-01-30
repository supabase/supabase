'use client'

import { LazyMotion, domAnimation, m, AnimatePresence } from 'framer-motion'
import ProductToggleCard, { ProductKey } from '../components/ProductToggleCard'
import CalloutCard from '../components/CalloutCard'

// Light spring animation for content reveal
const contentSpring = {
  type: 'spring',
  stiffness: 300,
  damping: 25,
  mass: 0.8,
}

type Props = {
  selectedProducts: Set<ProductKey>
  onToggleProduct: (key: ProductKey) => void
}

const PRODUCT_ORDER: ProductKey[] = ['database', 'authentication', 'storage', 'realtime', 'functions', 'vector']

export default function StageProductSelection({ selectedProducts, onToggleProduct }: Props) {
  const hasDatabase = selectedProducts.has('database')
  const hasAuth = selectedProducts.has('authentication')
  const hasMultiple = selectedProducts.size >= 2

  return (
    <LazyMotion features={domAnimation}>
      <div className="flex flex-col gap-4">
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
          {PRODUCT_ORDER.map((key) => (
            <ProductToggleCard
              key={key}
              productKey={key}
              selected={selectedProducts.has(key)}
              onToggle={onToggleProduct}
            />
          ))}
        </div>

        <AnimatePresence mode="wait">
          {selectedProducts.size === 0 && (
            <m.div
              key="empty"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={contentSpring}
            >
              <CalloutCard
                title="Select the products you need"
                body="Choose one or more Supabase products to include in your estimate. You can always add or remove products later."
              />
            </m.div>
          )}

          {hasDatabase && !hasAuth && selectedProducts.size === 1 && (
            <m.div
              key="database-only"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={contentSpring}
            >
              <CalloutCard
                title="Database selected"
                body="Most teams also add Auth to handle user sessions and row-level security. Consider adding it for a complete backend."
              />
            </m.div>
          )}

          {hasAuth && !hasDatabase && selectedProducts.size === 1 && (
            <m.div
              key="auth-only"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={contentSpring}
            >
              <CalloutCard
                title="Auth selected"
                body="Supabase Auth works best with Supabase Database for storing user metadata and enabling row-level security policies."
              />
            </m.div>
          )}

          {hasMultiple && (
            <m.div
              key="multiple"
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              transition={contentSpring}
            >
              <CalloutCard
                title={`${selectedProducts.size} products selected`}
                body="All Supabase products are included in your subscription. You only pay for usage beyond included limits."
              />
            </m.div>
          )}
        </AnimatePresence>
      </div>
    </LazyMotion>
  )
}
