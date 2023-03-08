import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useWindowSize } from 'react-use'

export default function LW7BgGraphic() {
  const { scrollYProgress } = useScroll()
  const [isMobile, setIsMobile] = useState(false)
  const { width } = useWindowSize()

  useEffect(() => {
    if (width <= 768) {
      setIsMobile(true)
    } else {
      setIsMobile(false)
    }
  }, [width])

  const graphicsScale = useTransform(
    scrollYProgress,
    // Map scrollYProgress from these values:
    [0, 0.5],
    // Into these scale values:
    [1, isMobile ? 1.1 : 1.2]
  )
  const graphicsY = useTransform(
    scrollYProgress,
    // Map scrollYProgress from these values:
    [0, 0.5],
    // Into these values:
    [0, isMobile ? 70 : 200]
  )

  return (
    <div className="relative h-[300px] md:h-[700px] overflow-hidden before:content[' '] before:absolute before:bottom-0 before:h-[200px] md:before:h-[400px] before:z-20 before:w-full before:bg-gradient-to-t before:from-[#1C1C1C] before:via-[#1C1C1C40] before:to-transparent">
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
          objectPosition="top"
          quality={100}
          unoptimized
          priority
        />
      </motion.div>
    </div>
  )
}
