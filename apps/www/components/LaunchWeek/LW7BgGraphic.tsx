import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'

export default function LW7BgGraphic() {
  const { scrollYProgress } = useScroll()

  const graphicsScale = useTransform(
    scrollYProgress,
    // Map scrollYProgress from these values:
    [0, 0.5],
    // Into these scale values:
    [1, 1.4]
  )
  const graphicsY = useTransform(
    scrollYProgress,
    // Map scrollYProgress from these values:
    [0, 0.5],
    // Into these values:
    [0, 200]
  )

  return (
    <div className="relative h-[700px] overflow-hidden before:content[' '] before:absolute before:bottom-0 before:h-[400px] before:z-20 before:w-full before:bg-gradient-to-t before:from-[#1C1C1C] before:via-[#1C1C1C40] before:to-transparent">
      <motion.div
        className="absolute bottom-0 w-full h-full"
        style={{
          scale: graphicsScale,
          y: graphicsY,
          willChange: 'transform',
        }}
      >
        <Image
          src="/images/launchweek/seven/lw-7-bg.png"
          loading="eager"
          layout="fill"
          objectFit="cover"
        />
      </motion.div>
    </div>
  )
}
