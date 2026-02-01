'use client'

import { AnimatePresence, motion, useInView } from 'framer-motion'
import Image from 'next/image'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AnimatedGridBackground } from '../AnimatedGridBackground'

// All available images from Supabase Select event
const allImages = [
  '/images/wrapped/select-2025-021.jpg',
  '/images/wrapped/select-2025-091.jpg',
  '/images/wrapped/select-2025-143.jpg',
  '/images/wrapped/select-2025-163.jpg',
  '/images/wrapped/select-2025-190.jpg',
  '/images/wrapped/select-2025-202.jpg',
  '/images/wrapped/select-2025-216.jpg',
  '/images/wrapped/select-2025-229.jpg',
  '/images/wrapped/select-2025-247.jpg',
  '/images/wrapped/select-2025-250.jpg',
  '/images/wrapped/select-2025-252.jpg',
  '/images/wrapped/select-2025-003.jpg',
  '/images/wrapped/select-2025-099.jpg',
]

// Gallery layout configuration
const gallerySlots = [
  { id: 0, span: 'col-span-1 lg:col-span-2 row-span-1 lg:row-span-2' },
  { id: 1, span: 'col-span-1 lg:col-span-3 row-span-1 lg:row-span-2' },
  { id: 2, span: 'col-span-1 lg:col-span-3 row-span-1 lg:row-span-2' },
  { id: 3, span: 'col-span-1 lg:col-span-2 row-span-1 lg:row-span-2' },
]

function RotatingImage({
  currentImage,
  span,
  imageKey,
  priority = false,
}: {
  currentImage: string
  span: string
  imageKey: number
  priority?: boolean
}) {
  return (
    <div className={`${span} relative`}>
      <AnimatePresence mode="wait">
        <motion.div
          key={imageKey}
          className="absolute inset-0"
          initial={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
          animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
          exit={{ opacity: 0, scale: 0.98, filter: 'blur(4px)' }}
          transition={{ type: 'spring', duration: 0.75, bounce: 0.35 }}
        >
          <Image
            src={currentImage}
            alt="Supabase Select event photo"
            fill
            className="object-cover"
            priority={priority}
            sizes="(max-width: 1600px) 100vw, 20vw"
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export const SupabaseSelect = () => {
  return (
    <>
      <section className="relative max-w-[60rem] h-[240px] md:h-[360px] mx-auto border-x border-b w-[95%] md:w-full">
        {/* Grid background */}
        <AnimatedGridBackground
          cols={5}
          rows={{ mobile: 2, desktop: 3 }}
          tiles={[
            { cell: 0, type: 'stripes' },
            { cell: 2, type: 'dots' },
            { cell: 8, type: 'dots' },
            { cell: 14, type: 'stripes' },
          ]}
          initialDelay={0.35}
        />

        {/* Content */}
        <div className="flex flex-col justify-end h-full px-4 lg:px-8 py-0 relative">
          <h2 className="font-medium tracking-tighter text-6xl md:text-7xl lg:text-[5.6rem] translate-y-2 lg:translate-y-[10px]">
            Supabase Select
          </h2>
        </div>
      </section>

      <div className="relative max-w-[60rem] mx-auto border-x border-b px-4 lg:px-8 py-12 w-[95%] md:w-full">
        <h3 className="text-lg">
          Our first user conference was a blast — Thank you for being part of it.
        </h3>
      </div>

      {/* Grid separator top */}
      <div className="relative max-w-[60rem] h-[100px] mx-auto border-x border-b w-[95%] md:w-full">
        <AnimatedGridBackground
          cols={5}
          rows={1}
          tiles={[
            { cell: 1, type: 'dots' },
            { cell: 4, type: 'stripes' },
          ]}
          initialDelay={0.2}
        />
      </div>

      {/* Bento gallery */}
      <GalleryGrid />
    </>
  )
}

function GalleryGrid() {
  const ref = useRef(null)
  const isInView = useInView(ref, { amount: 0.3 })

  // Track which image index each slot is showing
  const [slotImages, setSlotImages] = useState<number[]>(() => {
    // Initialize with unique random indices
    const indices: number[] = []
    const available = [...Array(allImages.length).keys()]
    for (let i = 0; i < gallerySlots.length; i++) {
      const randomIdx = Math.floor(Math.random() * available.length)
      indices.push(available[randomIdx])
      available.splice(randomIdx, 1)
    }
    return indices
  })

  // Track animation keys for each slot
  const [imageKeys, setImageKeys] = useState<number[]>(() => gallerySlots.map(() => 0))

  // Get available images (not currently shown in any slot)
  const getAvailableImageIndex = useCallback(
    (excludeSlot: number) => {
      const usedIndices = slotImages.filter((_, idx) => idx !== excludeSlot)
      const available = allImages.map((_, idx) => idx).filter((idx) => !usedIndices.includes(idx))

      if (available.length === 0) return slotImages[excludeSlot]
      return available[Math.floor(Math.random() * available.length)]
    },
    [slotImages]
  )

  // Rotate a specific slot's image
  const rotateSlot = useCallback(
    (slotIndex: number) => {
      const newImageIndex = getAvailableImageIndex(slotIndex)
      setSlotImages((prev) => {
        const next = [...prev]
        next[slotIndex] = newImageIndex
        return next
      })
      setImageKeys((prev) => {
        const next = [...prev]
        next[slotIndex] = prev[slotIndex] + 1
        return next
      })
    },
    [getAvailableImageIndex]
  )

  // Set up independent timers for each slot
  useEffect(() => {
    if (!isInView) return

    let isCancelled = false
    const timeouts: NodeJS.Timeout[] = []

    const scheduleRotation = (slotIndex: number) => {
      if (isCancelled) return

      const delay = 3000 + Math.random() * 2000 // 3-5 seconds
      const timeoutId = setTimeout(() => {
        if (isCancelled) return
        rotateSlot(slotIndex)
        scheduleRotation(slotIndex)
      }, delay)
      timeouts.push(timeoutId)
    }

    // Start rotation for each slot with staggered initial delays
    gallerySlots.forEach((_, index) => {
      const initialDelay = Math.random() * 3000 // Stagger start times
      const timeoutId = setTimeout(() => {
        if (isCancelled) return
        scheduleRotation(index)
      }, initialDelay)
      timeouts.push(timeoutId)
    })

    return () => {
      isCancelled = true
      timeouts.forEach(clearTimeout)
    }
  }, [isInView, rotateSlot])

  return (
    <div
      ref={ref}
      className="relative max-w-[60rem] mx-auto border-x border-b p-3 w-[95%] md:w-full"
    >
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 auto-rows-[200px]">
        {gallerySlots.map((slot, index) => (
          <RotatingImage
            key={slot.id}
            currentImage={allImages[slotImages[index]]}
            span={slot.span}
            imageKey={imageKeys[index]}
            priority={index === 0 && isInView}
          />
        ))}
      </div>
    </div>
  )
}
