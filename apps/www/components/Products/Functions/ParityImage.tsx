'use client'

import { motion } from 'framer-motion'
import Image from 'next/image'
import { cn } from 'ui'

const SYNC_WIDTH = 48

function SyncLines({ isHovered }: { isHovered: boolean }) {
  const shimmerTransition = (delay: number) =>
    isHovered
      ? { duration: 0.7, repeat: Infinity, ease: 'linear' as const, repeatDelay: 1.8, delay }
      : { duration: 0.4, ease: 'easeOut' as const }

  const tipMask = 'linear-gradient(to right, transparent, black 28%, black 72%, transparent)'

  return (
    <div
      className="flex flex-col gap-1.5 items-center justify-center"
      style={{ width: SYNC_WIDTH, transform: 'skewX(-12deg)' }}
    >
      {/* → green shimmer */}
      <div
        className="relative w-full h-px bg-border overflow-hidden"
        style={{ maskImage: tipMask, WebkitMaskImage: tipMask }}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to right, transparent 0%, #3ecf8e 50%, transparent 100%)',
          }}
          animate={isHovered ? { x: ['-100%', '100%'] } : { x: '-100%' }}
          transition={shimmerTransition(0)}
        />
      </div>
      {/* ← purple shimmer */}
      <div
        className="relative w-full h-px bg-border overflow-hidden"
        style={{ maskImage: tipMask, WebkitMaskImage: tipMask }}
      >
        <motion.div
          className="absolute inset-0"
          style={{
            background: 'linear-gradient(to left, transparent 0%, #bda4ff 50%, transparent 100%)',
          }}
          animate={isHovered ? { x: ['100%', '-100%'] } : { x: '100%' }}
          transition={shimmerTransition(1.0)}
        />
      </div>
    </div>
  )
}

const ParityImage = ({ isHovered = false }: { isHovered?: boolean }) => (
  <div className="relative w-full h-full flex items-center justify-center text-sm">
    <Image
      src="/images/product/functions/lines-gradient-light.svg"
      alt=""
      fill
      sizes="100%"
      aria-hidden
      draggable={false}
      className="object-cover absolute z-0 inset-0 dark:hidden block"
    />
    <Image
      src="/images/product/functions/lines-gradient-dark.svg"
      alt=""
      fill
      sizes="100%"
      aria-hidden
      draggable={false}
      className="object-cover absolute z-0 inset-0 hidden dark:block"
    />
    <div className="relative z-10 p-4 font-mono bg-surface-200 rounded-2xl justify-center items-center gap-3 flex">
      {/* Animated dashed border */}
      <svg
        className={cn(
          'absolute inset-0 w-full h-full pointer-events-none overflow-visible transition-colors duration-200 text-border'
        )}
      >
        <motion.rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          rx="16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeDasharray="6 4"
          animate={{ strokeDashoffset: isHovered ? [0, -10] : 0 }}
          transition={
            isHovered
              ? { duration: 0.4, repeat: Infinity, ease: 'linear' }
              : { duration: 0.4, ease: 'easeOut' }
          }
        />
      </svg>

      {/* Dev badge — green border + shadow on hover */}
      <div
        className="py-2 px-4 bg-alternative-200 rounded-lg flex-col justify-center items-center transition-all duration-300"
        style={
          isHovered
            ? {
                border: '1px solid #3ecf8e',
                boxShadow: '0 0 12px 0 #3ecf8e40',
              }
            : {
                border: '1px solid hsl(var(--border-default))',
                boxShadow: 'none',
              }
        }
      >
        <div className="text-foreground uppercase tracking-wide">Dev</div>
      </div>

      <SyncLines isHovered={isHovered} />

      {/* Prod badge — purple border + shadow on hover */}
      <div
        className="py-2 px-4 bg-alternative-200 rounded-lg flex-col justify-center items-center transition-all duration-300"
        style={
          isHovered
            ? {
                border: '1px solid #bda4ff',
                boxShadow: '0 0 12px 0 #bda4ff40',
              }
            : {
                border: '1px solid hsl(var(--border-default))',
                boxShadow: 'none',
              }
        }
      >
        <div className="text-foreground uppercase tracking-wide">Prod</div>
      </div>
    </div>
  </div>
)

export default ParityImage
