'use client'

import { motion, useMotionValue, useSpring } from 'framer-motion'
import { memo, useRef, useState } from 'react'

import { cn } from '../../lib/utils'

interface AiIconAnimationProps {
  size?: number
  loading?: boolean
  className?: string
  allowHoverEffect?: boolean
}

const AiIconAnimationComponent = ({
  size = 24,
  loading = false,
  className,
  allowHoverEffect = false,
}: AiIconAnimationProps) => {
  const strokeWidth = Math.max(1.5, size / 46) // Ensure minimum stroke width of 1.5
  const containerRef = useRef<HTMLDivElement>(null)
  const [isHovering, setIsHovering] = useState(false)

  const x = useMotionValue(0)
  const y = useMotionValue(0)

  const springX = useSpring(x, { stiffness: 300, damping: 30 })
  const springY = useSpring(y, { stiffness: 300, damping: 30 })

  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!allowHoverEffect) return
    if (!containerRef.current) return

    const rect = containerRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2

    const mouseX = event.clientX - centerX
    const mouseY = event.clientY - centerY

    x.set(mouseX / 5)
    y.set(mouseY / 5)
  }

  const outerVariants = {
    rest: { rotate: 0 },
    loading: { rotate: 360 },
    hover: { rotate: 10 },
  }

  const innerVariants = {
    rest: { scale: 1, x: 0, y: 0 },
    loading: { scale: [1, 1.1, 1], x: 0, y: 0 },
    hover: { scale: 1.1 },
  }

  return (
    <div
      className={cn('text-brand-600 flex justify-center items-center relative', className)}
      style={{ width: size, height: size, position: 'relative' }}
    >
      <div
        ref={containerRef}
        className="absolute flex items-center justify-center"
        style={{
          width: size * 2,
          height: size * 2,
          left: -size / 2,
          top: -size / 2,
        }}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setIsHovering(true)}
        onMouseLeave={() => {
          setIsHovering(false)
          x.set(0)
          y.set(0)
        }}
      />

      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 46 46"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <motion.path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M23 1.78677L44.2132 23L23 44.2132L1.7868 23L23 1.78677ZM23 0.372559L23.7071 1.07967L44.9203 22.2929L45.6274 23L44.9203 23.7071L23.7071 44.9203L23 45.6274L22.2929 44.9203L1.07969 23.7071L0.372583 23L1.07969 22.2929L22.2929 1.07967L23 0.372559Z"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          animate={loading ? 'loading' : isHovering ? 'hover' : 'rest'}
          variants={outerVariants}
          transition={{
            duration: 2,
            repeat: loading ? Infinity : 0,
            ease: 'circInOut',
            type: 'spring',
            stiffness: 60,
            damping: 10,
          }}
        />
        <motion.path
          fillRule="evenodd"
          clipRule="evenodd"
          d="M30 23C30 26.866 26.866 30 23 30C19.134 30 16 26.866 16 23C16 19.134 19.134 16 23 16C26.866 16 30 19.134 30 23ZM31 23C31 27.4183 27.4183 31 23 31C18.5817 31 15 27.4183 15 23C15 18.5817 18.5817 15 23 15C27.4183 15 31 18.5817 31 23Z"
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          variants={innerVariants}
          animate={isHovering ? 'hover' : loading ? 'loading' : 'rest'}
          style={{ x: springX, y: springY }}
          transition={{
            duration: 2,
            repeat: loading ? Infinity : 0,
            ease: 'easeInOut',
          }}
        />
      </motion.svg>
    </div>
  )
}

export const AiIconAnimation = memo(AiIconAnimationComponent)
