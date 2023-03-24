import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useMobileViewport } from '../../../hooks/useMobileViewport'
import styles from './tickets-grid.module.css'

interface Props {
  loadedUsers: any[]
  isLoading: boolean
}

export default function TicketsGrid({ loadedUsers, isLoading }: Props) {
  const STORAGE_URL = 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw7'
  const getOgUrl = (username: string) => `${STORAGE_URL}/tickets/gallery/${username}.png`
  const isMobile = useMobileViewport(768)
  const isTablet = useMobileViewport(1024)

  return (
    <div
      className={[
        'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mx-[-10vw] gap-3 py-12 relative',
        styles['tickets-grid'],
      ].join(' ')}
    >
      {loadedUsers?.map((user, i) => {
        const rowTickets = isMobile ? 2 : isTablet ? 3 : 5
        const divider = Math.floor(i / rowTickets)
        const isOddRow = divider % 2 === 0

        return (
          <Link href={`/launch-week/tickets/${user.username}`} key={`${user.username}-000${i}`}>
            <motion.a
              className="relative w-full rounded-lg overflow-hidden transform scale-100 md:hover:scale-[101%]"
              initial={{ opacity: 0, y: 20, x: isOddRow ? 30 : -30 }}
              animate={{
                opacity: !isTablet && (i === 0 || i === 4) ? 0 : 1,
                y: 0,
                x: isOddRow ? 30 : -30,
                transition: {
                  duration: 0.4,
                  ease: [0.24, 0.25, 0.05, 1],
                  delay: i / 15,
                },
              }}
            >
              <div className="relative inset-0 w-full pt-[50%] transform">
                <Image
                  src={getOgUrl(user.username!)}
                  alt={user.username}
                  layout="fill"
                  objectFit="cover"
                  quality={50}
                  objectPosition="center"
                  placeholder="blur"
                  blurDataURL="/images/blur.png"
                />
              </div>
            </motion.a>
          </Link>
        )
      })}
      {/* TODO: Add PAGE_COUNT length skeleton loaders when loading */}
      {isLoading && <div className="relative rounded-lg bg-slate-100 h-0 w-full pt-[50%]" />}
    </div>
  )
}
