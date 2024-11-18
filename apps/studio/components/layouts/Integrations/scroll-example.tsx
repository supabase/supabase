import { useScroll, useSpring, motion } from 'framer-motion'

export const ScrollProgressBar = () => {
  const { scrollY, scrollYProgress } = useScroll()
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  })

  return (
    <motion.div
      className="sticky z-50 top-0 left-0 right-0 h-[10px] bg-red-900 origin-left"
      style={{ scaleX }}
    />
  )
}
