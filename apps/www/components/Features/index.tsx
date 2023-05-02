import Solutions from 'data/Solutions.json'
import Telemetry from '~/lib/telemetry'
import gaEvents from '~/lib/gaEvents'
import { useTelemetryProps } from 'common/hooks/useTelemetryProps'
import { useRouter } from 'next/router'
import Image from 'next/image'
import SectionContainer from '../Layouts/SectionContainer'
import { motion } from 'framer-motion'
import BackedBy from '../BackedBy'
import { useBreakpoint, useTheme } from 'common'
import FeatureCard from './FeatureCard'

const opacityVariant = {
  default: { opacity: 1, filter: 'grayscale(1)', transition: { duration: 0.1 } },
  hover: {
    opacity: 1,
    filter: 'grayscale(0)',
    transition: { duration: 0.15 },
  },
}

const Features = () => {
  const router = useRouter()
  const telemetryProps = useTelemetryProps()

  const sendTelemetryEvent = async (product: any) => {
    switch (product) {
      case 'Database':
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_database'],
          telemetryProps,
          router
        )
      case 'Authentication':
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_auth'],
          telemetryProps,
          router
        )
      case 'Storage':
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_storage'],
          telemetryProps,
          router
        )
      case 'Edge Functions':
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_edgeFunctions'],
          telemetryProps,
          router
        )
      case 'Realtime':
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_realtime'],
          telemetryProps,
          router
        )
    }
  }
  const isSm = useBreakpoint(640)
  const { isDarkMode } = useTheme()

  return (
    <SectionContainer className="space-y-8 max-w-7xl mt-24 lg:mt-0 !pt-0">
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-4 lg:gap-6 md:grid-cols-6">
        <FeatureCard
          url={Solutions['database'].url}
          title={Solutions['database'].name}
          subtitle={
            <>
              Every project is a full Postgres database,
              <br className="inline-block sm:hidden lg:inline-block" /> the world's most trusted
              relational database.
            </>
          }
          onClick={() => sendTelemetryEvent(name)}
          image={
            <motion.div className="absolute inset-0 z-0" variants={opacityVariant}>
              <Image
                src={
                  isDarkMode
                    ? '/images/index/database-dark.jpg'
                    : '/images/index/database-light.jpg'
                }
                alt="Supabase Postgres Database, hover image with glow"
                layout="fill"
                objectPosition={isSm ? 'bottom' : '50% 50%'}
                objectFit={isSm ? 'contain' : 'cover'}
                quality={100}
              />
            </motion.div>
          }
          classname="col-span-full md:col-span-3"
        />
        <FeatureCard
          url={Solutions['authentication'].url}
          title={Solutions['authentication'].name}
          subtitle={
            <>
              Add user sign ups and logins,
              <br className="inline-block sm:hidden lg:inline-block" /> securing your data with Row
              Level Security.
            </>
          }
          image={
            <motion.div className="absolute inset-0 z-0" variants={opacityVariant}>
              <Image
                src={isDarkMode ? '/images/index/auth-dark.jpg' : '/images/index/auth-light.jpg'}
                alt="Supabase Authentication feature, hover image with glow"
                layout="fill"
                objectPosition="50% 50%"
                objectFit="cover"
              />
            </motion.div>
          }
          classname="md:col-span-3 lg:!col-span-2"
          onClick={() => sendTelemetryEvent(name)}
        />
        <FeatureCard
          url={Solutions['storage'].url}
          title={Solutions['storage'].name}
          subtitle={
            <>
              Store, organize, and serve large files,
              <br className="inline-block sm:hidden lg:inline-block" /> from videos to images.
            </>
          }
          image={
            <motion.div className="absolute inset-0 z-0" variants={opacityVariant}>
              <Image
                src={
                  isDarkMode ? '/images/index/storage-dark.jpg' : '/images/index/storage-light.jpg'
                }
                alt="Supabase Storage feature, hover image with glow"
                layout="fill"
                objectPosition="50% 50%"
                objectFit="cover"
                quality={95}
              />
            </motion.div>
          }
          classname="md:!col-span-2 md:h-[350px] lg:h-[390px]"
          onClick={() => sendTelemetryEvent(name)}
        />
        <FeatureCard
          url={Solutions['edge-functions'].url}
          title={Solutions['edge-functions'].name}
          subtitle={
            <>
              Easily write custom code
              <br className="inline-block sm:hidden lg:inline-block" /> without deploying or scaling
              servers.
            </>
          }
          onClick={() => sendTelemetryEvent(name)}
          image={
            <motion.div className="absolute inset-0 z-0" variants={opacityVariant}>
              <Image
                src={isDarkMode ? '/images/index/edge-dark.jpg' : '/images/index/edge-light.jpg'}
                alt="Supabase Edge Functions feature, hover image with glow"
                layout="fill"
                objectPosition={isSm ? 'bottom' : '50% 50%'}
                objectFit={isSm ? 'contain' : 'cover'}
                quality={90}
              />
            </motion.div>
          }
          classname="md:!col-span-2 md:h-[350px] lg:h-[390px]"
        />
        <FeatureCard
          url={Solutions['realtime'].url}
          title={Solutions['realtime'].name}
          subtitle={
            <>
              Build multiplayer experiences
              <br className="inline-block sm:hidden lg:inline-block" /> with realtime data
              synchronization.
            </>
          }
          image={
            <motion.div className="absolute inset-0 z-0" variants={opacityVariant}>
              <Image
                src={
                  isDarkMode
                    ? '/images/index/realtime-dark.jpg'
                    : '/images/index/realtime-light.jpg'
                }
                alt="Supabase Edge Functions feature, hover image with glow"
                layout="fill"
                objectPosition="50% 50%"
                objectFit="cover"
                quality={95}
              />
            </motion.div>
          }
          classname="md:!col-span-2 md:h-[350px] lg:h-[390px]"
        />
      </dl>
      <BackedBy className="pt-8" layout="horizontal" />
    </SectionContainer>
  )
}

export default Features
