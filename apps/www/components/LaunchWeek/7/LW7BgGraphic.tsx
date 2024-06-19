import { motion, useScroll, useTransform } from 'framer-motion'
import Image from 'next/image'
import { useBreakpoint } from 'common/hooks/useBreakpoint'
import styles from './lw7-bg-graphic.module.css'

export default function LW7BgGraphic() {
  const { scrollYProgress } = useScroll()
  const isMobile = useBreakpoint(768)

  const graphicsY = useTransform(
    scrollYProgress,
    // Map scrollYProgress from these values:
    [0, 0.5],
    // Into these values:
    [0, isMobile ? 70 : 200]
  )

  return (
    <div
      className={[
        "relative h-[300px] md:h-[700px] overflow-hidden before:content[' '] before:absolute before:bottom-0 before:h-[200px] md:before:h-[600px] before:z-20 before:w-full before:bg-gradient-to-t before:from-[#1C1C1C] before:via-[#1C1C1C40] before:to-transparent",
        styles['gradient-overlay'],
      ].join(' ')}
    >
      <motion.div
        className="absolute bottom-0 w-full h-full"
        style={{
          y: graphicsY,
          willChange: 'transform',
        }}
      >
        <Image
          src="/images/launchweek/seven/lw-7-bg-blur.png"
          loading="eager"
          layout="fill"
          objectFit="cover"
          objectPosition="top"
          quality={100}
          unoptimized
          priority
          alt="Launch Week 7"
        />
      </motion.div>
    </div>
  )
}
