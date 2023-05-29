import { useRef } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { MotionValue, motion, useMotionValue, useSpring, useTransform } from 'framer-motion'
import { useBreakpoint } from 'common'

function MagnifiedProducts() {
  let mouseX = useMotionValue(Infinity)

  return (
    <motion.div
      onMouseMove={(e) => mouseX.set(e.pageX)}
      onMouseLeave={() => mouseX.set(Infinity)}
      className="mx-auto w-full max-w-md grid grid-cols-3 md:flex items-center justify-center gap-y-8 md:gap-4 px-4"
    >
      {Object.entries(products).map(([key, product]) => (
        <AppIcon mouseX={mouseX} product={product} key={key} />
      ))}
    </motion.div>
  )
}

function AppIcon({ mouseX, product }: { mouseX: MotionValue; product: any }) {
  let ref = useRef<HTMLDivElement>(null)
  const isMobile = useBreakpoint(768)

  let distance = useTransform(mouseX, (val) => {
    let bounds = ref.current?.getBoundingClientRect() ?? { x: 0, width: 0 }

    return val - bounds.x - bounds.width / 2
  })

  let widthSync = useTransform(distance, [-150, 0, 150], [75, 130, 75])
  let width = useSpring(widthSync, { mass: 0.1, stiffness: 150, damping: 12 })

  return (
    <motion.div ref={ref} className="relative mx-auto w-[150px] bg-transparent group">
      <Link href={product.url}>
        <a className="flex w-full flex-col items-center text-center">
          <motion.div
            style={isMobile ? (undefined as any) : { width }}
            className="relative w-[50px] aspect-square will-change-transform"
          >
            <Image src={product.icon} layout="fill" objectFit="contain" />
          </motion.div>
          <div className="text-brand-900 flex justify-center relative opacity-70 md:absolute md:bottom-0 md:opacity-0 group-hover:opacity-100 transition-opacity md:translate-y-8 md:-left-20 md:md:-right-20 font-mono uppercase text-center text-xs mt-2">
            <span>{product.name}</span>
          </div>
        </a>
      </Link>
    </motion.div>
  )
}

const products = {
  database: {
    name: 'Database',
    icon: '/images/product/database/database-v2.png',
    description:
      "Every project is a full Postgres database, the world's most trusted relational database.",
    description_short: '',
    label: '',
    url: '/database',
  },
  authentication: {
    name: 'Authentication',
    icon: '/images/product/auth/auth-v2.png',
    description: 'Add user sign ups and logins, securing your data with Row Level Security.',
    description_short: '',
    label: '',
    url: '/auth',
  },
  storage: {
    name: 'Storage',
    icon: '/images/product/storage/storage-v2.png',
    description: 'Store, organize, and serve large files. Any media, including videos and images.',
    description_short: '',
    label: '',
    url: '/storage',
  },
  'edge-functions': {
    name: 'Edge Functions',
    icon: '/images/product/functions/functions-v2.png',
    description: 'Write custom code without deploying or scaling servers.',
    description_short: '',
    label: '',
    url: '/edge-functions',
  },
  realtime: {
    name: 'Realtime',
    icon: '/images/product/realtime/realtime-v2.png',
    description:
      'Create multiplayer experiences by sharing, broadcasting, and listening to changes from other clients or the Database.',
    description_short: '',
    label: '',
    url: '/realtime',
  },
  vector: {
    name: 'Vector',
    icon: '/images/product/vector/vector-v2.png',
    description: 'Integrate your favorite ML-models to store, index and search vector embeddings.',
    description_short: '',
    label: '',
    url: '/vector',
  },
}

export default MagnifiedProducts
