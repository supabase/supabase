import { motion } from 'framer-motion'
import Image from 'next/image'
import Link from 'next/link'
import { useBreakpoint } from 'common/hooks/useBreakpoint'
import { UserData } from '../hooks/use-conf-data'

interface Props {
  loadedUsers: UserData[]
  isLoading: boolean
  pageCount: number
  offset: number
}

export default function TicketsGrid({ loadedUsers, isLoading, pageCount, offset }: Props) {
  const STORAGE_URL = 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lw7'
  const BUCKET_FOLDER_VERSION = 'v3'
  const getOgUrl = (username: string, isGold: boolean) =>
    `${STORAGE_URL}/tickets/gallery/${
      isGold ? 'golden' : 'regular'
    }/${BUCKET_FOLDER_VERSION}/${username}.png`
  const isMobile = useBreakpoint(768)
  const isTablet = useBreakpoint(1024)

  return (
    <div
      className={[
        'grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 mx-[-10vw] gap-3 py-12 relative',
      ].join(' ')}
    >
      {loadedUsers?.map((user, i) => {
        const rowTickets = isMobile ? 2 : isTablet ? 3 : 5
        const divider = Math.floor(i / rowTickets)
        const isOddRow = divider % 2 === 0
        // Delay should be no more than pageCount for new loaded users
        const recalculatedDelay = i >= pageCount * 2 ? (i - pageCount * (offset - 1)) / 15 : i / 15

        return (
          <Link
            href={`/launch-week/7/tickets/${user.username}`}
            key={`${user.username}-000${i}`}
            onClick={() => window.scrollTo(0, 0)}
            legacyBehavior
            passHref
          >
            <motion.a
              className="relative w-full p-[1px] rounded-lg sm:rounded-xl overflow-hidden hover:cursor-pointer bg-gradient-to-b from-[#ffffff60] to-[#ffffff10]"
              initial={{ opacity: 0, y: 20, x: isOddRow ? 30 : -30 }}
              animate={{
                opacity: !isTablet && (i === 0 || i === 4) ? 0 : 1,
                y: 0,
                x: isOddRow ? 30 : -30,
                transition: {
                  duration: 0.4,
                  ease: [0.24, 0.25, 0.05, 1],
                  delay: recalculatedDelay,
                },
              }}
            >
              <div className="relative inset-0 w-full pt-[50%] bg-[#2f2e2e] overflow-hidden rounded-lg sm:rounded-xl">
                <Image
                  src={getOgUrl(user.username!, !!user.golden)}
                  alt={user.username ?? ''}
                  layout="fill"
                  objectFit="cover"
                  objectPosition="center"
                  placeholder="blur"
                  blurDataURL="/images/blur.png"
                />
              </div>
            </motion.a>
          </Link>
        )
      })}
      {isLoading &&
        Array.from({ length: pageCount }, (_, i) => (
          <motion.div
            className="relative rounded-lg sm:rounded-xl overflow-hidden h-0 w-full pt-[50%]"
            initial={{ opacity: 0, y: 20 }}
            animate={{
              opacity: 1,
              y: 0,
              transition: {
                duration: 0.4,
                ease: [0.24, 0.25, 0.05, 1],
                delay: i / 15,
              },
            }}
          >
            <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-b from-[#ffffff60] to-[#ffffff10] p-[1px] overflow-hidden">
              <div className="absolute inset-[1px] rounded-lg sm:rounded-xl bg-gradient-to-b from-[#3d3c3c] to-[#2f2e2e]" />
            </div>
          </motion.div>
        ))}
    </div>
  )
}
