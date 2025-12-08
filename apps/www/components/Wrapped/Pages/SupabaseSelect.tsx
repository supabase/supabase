'use client'

import Image from 'next/image'
import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence, useInView } from 'framer-motion'
import { AnimatedGridBackground } from '../AnimatedGridBackground'

// All available images from Supabase Select event
const allImages = [
  '/images/wrapped/rachelzphotographyllc-21.jpeg',
  '/images/wrapped/rachelzphotographyllc-91.jpeg',
  '/images/wrapped/rachelzphotographyllc1-143.JPG',
  '/images/wrapped/rachelzphotographyllc1-163.jpg',
  '/images/wrapped/rachelzphotographyllc1-190.jpg',
  '/images/wrapped/rachelzphotographyllc1-202.jpg',
  '/images/wrapped/rachelzphotographyllc1-216.JPG',
  '/images/wrapped/rachelzphotographyllc1-229.JPG',
  '/images/wrapped/rachelzphotographyllc1-247.JPG',
  '/images/wrapped/rachelzphotographyllc1-250.JPG',
  '/images/wrapped/rachelzphotographyllc1-252.JPG',
  '/images/wrapped/rachelzphotographyllc1-3.jpg',
  '/images/wrapped/rachelzphotographyllc1-99.jpg',
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
}: {
  currentImage: string
  span: string
  imageKey: number
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
          />
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

export const SupabaseSelect = () => {
  return (
    <>
      <section className="relative max-w-[60rem] h-[240px] md:h-[360px] mx-auto border-x">
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

      <div className="relative max-w-[60rem] mx-auto border-x border-b px-4 lg:px-8 py-12">
        <h3 className="text-lg">
          Our first user conference was a blast — Thank you for being part of it.
        </h3>
      </div>

      {/* Grid separator top */}
      <div className="relative max-w-[60rem] h-[100px] mx-auto border-x border-b">
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
  const [preloaded, setPreloaded] = useState(false)

  // Preload all images when section comes into view
  useEffect(() => {
    if (!isInView || preloaded) return

    allImages.forEach((src) => {
      const img = new window.Image()
      img.src = src
    })
    setPreloaded(true)
  }, [isInView, preloaded])

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

    const timeouts: NodeJS.Timeout[] = []

    const scheduleRotation = (slotIndex: number) => {
      const delay = 5000 + Math.random() * 5000 // 5-10 seconds
      const timeoutId = setTimeout(() => {
        rotateSlot(slotIndex)
        scheduleRotation(slotIndex)
      }, delay)
      timeouts.push(timeoutId)
    }

    // Start rotation for each slot with staggered initial delays
    gallerySlots.forEach((_, index) => {
      const initialDelay = Math.random() * 3000 // Stagger start times
      const timeoutId = setTimeout(() => {
        scheduleRotation(index)
      }, initialDelay)
      timeouts.push(timeoutId)
    })

    return () => {
      timeouts.forEach(clearTimeout)
    }
  }, [isInView, rotateSlot])

  return (
    <div ref={ref} className="relative max-w-[60rem] mx-auto border-x border-b p-3">
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-2 auto-rows-[200px]">
        {gallerySlots.map((slot, index) => (
          <RotatingImage
            key={slot.id}
            currentImage={allImages[slotImages[index]]}
            span={slot.span}
            imageKey={imageKeys[index]}
          />
        ))}
      </div>
    </div>
  )
}
