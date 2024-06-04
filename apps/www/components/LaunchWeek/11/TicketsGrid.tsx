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
  const STORAGE_URL = 'https://obuldanrptloktxcffvn.supabase.co/storage/v1/object/public/images/lwx'
  const getTicketImageUrl = (username: string, isGold: boolean) =>
    `${STORAGE_URL}/tickets/${isGold ? 'platinum' : 'regular'}/${username}.png`
  const isMobile = useBreakpoint(1024)
  const isTablet = useBreakpoint(1280)
  const horizontalOffset = isMobile ? 8 : 20

  return (
    <div
      className={['grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3 py-12 relative'].join(' ')}
    >
      {loadedUsers?.map((user, i) => {
        const rowTickets = isMobile ? 2 : isTablet ? 3 : 4
        const divider = Math.floor(i / rowTickets)
        const isOddRow = divider % 2 === 0
        // Delay should be no more than pageCount for new loaded users
        const recalculatedDelay = i >= pageCount * 2 ? (i - pageCount * (offset - 1)) / 15 : i / 15
        const imgUrl =
          getTicketImageUrl(user.username!, !!user.golden) ??
          '/images/launchweek/lwx/tickets/placeholder.png'

        return (
          <Link
            href={`/launch-week/tickets/${user.username}`}
            key={`${user.username}-000${i}`}
            onClick={() => window.scrollTo(0, 0)}
            legacyBehavior
            passHref
          >
            <motion.a
              className="relative w-full p-[1px] rounded-lg sm:rounded-xl overflow-hidden hover:cursor-pointer bg-gradient-to-b from-[#58585860] to-[#ffffff10]"
              initial={{
                opacity: 0,
                y: 20,
                x: isOddRow ? horizontalOffset : -horizontalOffset,
              }}
              animate={{
                opacity: 1,
                y: 0,
                x: isOddRow ? horizontalOffset : -horizontalOffset,
                transition: {
                  duration: 0.4,
                  ease: [0.24, 0.25, 0.05, 1],
                  delay: recalculatedDelay,
                },
              }}
            >
              <div className="relative inset-0 w-full pt-[50%] bg-[#2f2e2e] overflow-hidden rounded-lg sm:rounded-xl">
                <Image
                  src={imgUrl}
                  alt={user.username ?? ''}
                  fill
                  sizes="100%"
                  className="object-cover object-center"
                  placeholder="blur"
                  blurDataURL="/images/launchweek/lwx/tickets/placeholder.png"
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
            <div className="absolute inset-0 rounded-lg sm:rounded-xl bg-gradient-to-b from-[#1c1c1c] to-[#121212] p-[1px] overflow-hidden">
              <div className="absolute inset-[1px] rounded-lg sm:rounded-xl bg-gradient-to-b from-[#1c1c1c] to-[#121212]" />
            </div>
          </motion.div>
        ))}
    </div>
  )
}
