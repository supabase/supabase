import { motion } from 'framer-motion'

interface WaveAnimationProps {
  size?: number
  className?: string
}

/**
 * A waving hand animation (👋) that waves from left to right.
 */
export const WaveAnimation = ({ size = 48, className }: WaveAnimationProps) => {
  return (
    <motion.span
      className={className}
      style={{
        display: 'inline-block',
        fontSize: size,
        transformOrigin: '70% 70%',
        cursor: 'default',
      }}
      animate={{
        rotate: [0, 14, -8, 14, -4, 10, 0],
      }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        repeatDelay: 0.5,
        ease: 'easeInOut',
      }}
    >
      👋
    </motion.span>
  )
}

export default WaveAnimation
