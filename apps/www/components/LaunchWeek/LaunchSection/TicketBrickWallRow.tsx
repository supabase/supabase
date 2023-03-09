import { useRef, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { motion, useScroll, useTransform } from 'framer-motion'
import { UserData } from '../Ticket/hooks/use-conf-data'

interface Props {
  users: UserData[]
  reverse?: boolean
  speed?: number
}

export function TicketBrickWallRow({ users, reverse, speed = 50000 }: Props) {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start end', 'end start'],
  })
  const STORAGE_URL = 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw7'
  const getOgUrl = (username: string, isGold: boolean) =>
    isGold
      ? `${STORAGE_URL}/tickets/golden/${username}.png`
      : `${STORAGE_URL}/tickets/${username}.png`

  const x = useTransform(scrollYProgress, [0, 1], reverse ? [-300, 0] : [0, -300])

  console.log(users)

  return (
    <div ref={ref} className="relative h-[250px] w-full m-0 overflow-hidden py-2.5">
      <div className="absolute flex h-fit w-fit">
        <motion.div className="flex gap-5 will-change-transform" style={{ x }}>
          {users.map((user, i) => (
            <div
              key={user.username}
              className="relative w-[450px] rounded-2xl overflow-hidden transform scale-100 hover:scale-[102%] transition-transform"
            >
              <Link href={`/launch-week/tickets/${user.username}`}>
                <div className="relative inset-0 w-full pt-[50%] transform scale-[120%]">
                  <span className="absolute inset-0 flex items-center justify-center text-white">
                    {user.username}
                  </span>
                  <Image
                    src={getOgUrl(user.username!, !!user.golden)}
                    alt={user.username}
                    layout="fill"
                    objectFit="cover"
                    objectPosition="top 50% right 5px"
                    placeholder="blur"
                    blurDataURL="/images/blur.png"
                  />
                </div>
              </Link>
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  )
}
