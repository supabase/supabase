import { useRef } from 'react'
import Link from 'next/link'
import {
  MotionValue,
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from 'framer-motion'
import { useBreakpoint } from 'common'
import { Products } from './Sections/ProductsCta'
import { cn } from 'ui'

import { DEFAULT_TRANSITION } from '~/lib/animations'
import { PRODUCT_NAMES, PRODUCT_SHORTNAMES, products as PRODUCTS } from 'shared-data/products'

function MagnifiedProducts({ currentProduct }: { currentProduct: Products | string }) {
  let mouseX = useMotionValue(Infinity)

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="relative mx-auto w-full max-w-md grid grid-cols-3 md:flex items-center justify-center gap-y-8 md:gap-2 px-4"
    >
      {Object.entries(products).map(([key, product], i) => (
        <Product
          mouseX={mouseX}
          product={product}
          isCurrentProduct={product.shortname === currentProduct}
          index={i}
          key={key}
        />
      ))}
    </motion.div>
  )
}

function Product({
  mouseX,
  product,
  index,
  isCurrentProduct,
}: {
  mouseX: MotionValue
  product: any
  index: number
  isCurrentProduct: boolean
}) {
  let ref = useRef<HTMLDivElement>(null)
  const isInView = useInView(ref, { margin: '-25%', once: true })
  const isMobile = useBreakpoint(768)

  let distance = useTransform(mouseX, (val) => {
    let bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }

    return val - bounds.x - bounds.width / 2
  })

  const initialWidth = isMobile ? 50 : 65
  let widthSync = useTransform(distance, [-100, 0, 100], [initialWidth, 80, initialWidth])
  let width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 })

  const xDelta = 91
  const initial = {
    x: isMobile ? 0 : index * -xDelta + 225,
  }
  const animate = {
    x: 0,
    transition: { ...DEFAULT_TRANSITION, delay: 0.5 },
  }

  return (
    <motion.div
      ref={ref}
      className={cn(
        'relative mx-auto md:w-[150px] bg-transparent group',
        isCurrentProduct ? 'z-10' : 'z-0'
      )}
      initial={initial}
      animate={isInView ? animate : initial}
    >
      <Link href={product.url} className="flex w-full flex-col items-center text-center group">
        <motion.div
          style={isMobile ? (undefined as any) : { width, willChange: 'width' }}
          className="relative w-[30px] !min-w-[30px] md:!min-w-[50px] aspect-square will-change-transform bg-background rounded-xl border p-3 text-foreground-lighter group-hover:text-foreground"
        >
          <svg
            width="100%"
            height="100%"
            viewBox="0 0 24 24"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            fillRule="evenodd"
            clipRule="evenodd"
          >
            <path
              d={product.icon}
              stroke="currentColor"
              strokeWidth={1.5}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </motion.div>
        <div className="text-foreground flex justify-center relative opacity-70 md:absolute md:bottom-0 md:opacity-0 group-hover:opacity-100 transition-opacity md:translate-y-8 md:-left-20 md:md:-right-20 font-mono uppercase text-center text-xs mt-2">
          {product.name}
        </div>
      </Link>
    </motion.div>
  )
}

const products = {
  database: {
    shortname: PRODUCT_SHORTNAMES.DATABASE,
    name: PRODUCT_NAMES.DATABASE,
    icon: PRODUCTS.database.icon[24],
    description:
      "Every project is a full Postgres database, the world's most trusted relational database.",
    description_short: '',
    label: '',
    url: '/database',
  },
  authentication: {
    shortname: PRODUCT_SHORTNAMES.AUTHENTICATION,
    name: PRODUCT_NAMES.AUTHENTICATION,
    icon: PRODUCTS.authentication.icon[24],
    description: 'Add user sign ups and logins, securing your data with Row Level Security.',
    description_short: '',
    label: '',
    url: '/auth',
  },
  storage: {
    shortname: PRODUCT_SHORTNAMES.STORAGE,
    name: PRODUCT_NAMES.STORAGE,
    icon: PRODUCTS.storage.icon[24],
    description: 'Store, organize, and serve large files. Any media, including videos and images.',
    description_short: '',
    label: '',
    url: '/storage',
  },
  'edge-functions': {
    shortname: PRODUCT_SHORTNAMES.FUNCTIONS,
    name: PRODUCT_NAMES.FUNCTIONS,
    icon: PRODUCTS.functions.icon[24],
    description: 'Write custom code without deploying or scaling servers.',
    description_short: '',
    label: '',
    url: '/edge-functions',
  },
  realtime: {
    shortname: PRODUCT_SHORTNAMES.REALTIME,
    name: PRODUCT_NAMES.REALTIME,
    icon: PRODUCTS.realtime.icon[24],
    description:
      'Create multiplayer experiences by sharing, broadcasting, and listening to changes from other clients or the Database.',
    description_short: '',
    label: '',
    url: '/realtime',
  },
  vector: {
    shortname: PRODUCT_SHORTNAMES.VECTOR,
    name: PRODUCT_NAMES.VECTOR,
    icon: PRODUCTS.vector.icon[24],
    description: 'Integrate your favorite ML-models to store, index and search vector embeddings.',
    description_short: '',
    label: '',
    url: '/vector',
  },
}

export default MagnifiedProducts
