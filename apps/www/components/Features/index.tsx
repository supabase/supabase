import Solutions from 'data/Solutions.json'
<<<<<<< HEAD
import Telemetry from '~/lib/telemetry'
import gaEvents from '~/lib/gaEvents'
import { useTelemetryProps } from 'common/hooks/useTelemetryProps'
import { useRouter } from 'next/router'
import Link from 'next/link'
=======
>>>>>>> 57f0cd67d (chore: improve performance and accessibility)
import Image from 'next/image'
import SectionContainer from '../Layouts/SectionContainer'
import { motion } from 'framer-motion'
import BackedBy from '../BackedBy'
import { useBreakpoint } from 'common'
import FeatureCard from './FeatureCard'

const opacityVariant = {
  default: { opacity: 0 },
  hover: {
    opacity: 1,
    transition: { duration: 0.2 },
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
            <div className="absolute inset-0 z-0">
              <motion.div className="absolute inset-0 z-10" variants={opacityVariant}>
                <Image
                  src="/images/index/database-dark-hover.jpg"
                  alt="Supabase Postgres Database, hover image with glow"
                  layout="fill"
                  objectPosition={isSm ? 'bottom' : '50% 50%'}
                  objectFit={isSm ? 'contain' : 'cover'}
                  quality={95}
                />
              </motion.div>
              <Image
                src="/images/index/database-dark.jpg"
                alt="Supabase Postgres Database"
                layout="fill"
                objectPosition={isSm ? 'bottom' : '50% 50%'}
                objectFit={isSm ? 'contain' : 'cover'}
                quality={95}
              />
            </div>
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
            <div className="absolute inset-0 z-0">
              <motion.div className="absolute inset-0 z-10" variants={opacityVariant}>
                <Image
                  src="/images/index/auth-dark-hover.jpg"
                  alt="Supabase Authentication feature, hover image with glow"
                  layout="fill"
                  objectPosition="50% 50%"
                  objectFit="cover"
                />
              </motion.div>
              <Image
                src="/images/index/auth-dark.jpg"
                layout="fill"
                objectPosition="50% 50%"
                objectFit="cover"
              />
            </div>
          }
          classname="md:col-span-3 lg:!col-span-2"
          onClick={() => sendTelemetryEvent(name)}
        />
        <FeatureCard
          url={Solutions['storage'].url}
          title={Solutions['storage'].name}
          subtitle={
            <>
              Store, organize, and serve large files.
              <br className="inline-block sm:hidden lg:inline-block" /> Any media, including videos
              and images.
            </>
          }
          image={
            <div className="absolute inset-0 z-0">
              <motion.div className="absolute inset-0 z-10" variants={opacityVariant}>
                <Image
                  src="/images/index/storage-dark-hover.jpg"
                  alt="Supabase Storage feature, hover image with glow"
                  layout="fill"
                  objectPosition="50% 50%"
                  objectFit="cover"
                  quality={95}
                />
              </motion.div>
              <Image
                src="/images/index/storage-dark.jpg"
                alt="Supabase Storage feature"
                layout="fill"
                objectPosition="50% 50%"
                objectFit="cover"
              />
            </div>
          }
          classname="md:!col-span-2"
          onClick={() => sendTelemetryEvent(name)}
        />
        <FeatureCard
          url={Solutions['edge-functions'].url}
          title={Solutions['edge-functions'].name}
          subtitle={
            <>
              Write custom code without deploying
              <br className="inline-block sm:hidden lg:inline-block" /> or scaling servers.
            </>
          }
          onClick={() => sendTelemetryEvent(name)}
          image={
            <div className="absolute inset-0 z-0">
              <motion.div className="absolute inset-0 z-10" variants={opacityVariant}>
                <Image
                  src="/images/index/edge-dark-hover.jpg"
                  alt="Supabase Edge Functions feature, hover image with glow"
                  layout="fill"
                  objectPosition={isSm ? 'bottom' : '50% 50%'}
                  objectFit={isSm ? 'contain' : 'cover'}
                  quality={90}
                />
              </motion.div>
              <Image
                src="/images/index/edge-dark.jpg"
                alt="Supabase Edge Functions feature"
                layout="fill"
                objectPosition={isSm ? 'bottom' : '50% 50%'}
                objectFit={isSm ? 'contain' : 'cover'}
                quality={90}
              />
            </div>
          }
          classname="md:!col-span-2"
        />
        <FeatureCard
          url={Solutions['realtime'].url}
          title={Solutions['realtime'].name}
          subtitle={Solutions['realtime'].description}
          image={
            <div className="absolute inset-0 z-0">
              <motion.div className="absolute inset-0 z-10" variants={opacityVariant}>
                <Image
                  src="/images/index/realtime-dark-hover.jpg"
                  alt="Supabase Edge Functions feature, hover image with glow"
                  layout="fill"
                  objectPosition={isSm ? 'bottom' : '50% 50%'}
                  objectFit={isSm ? 'contain' : 'cover'}
                />
              </motion.div>
              <Image
                src="/images/index/realtime-dark.jpg"
                alt="Supabase Edge Functions feature"
                layout="fill"
                objectPosition={isSm ? 'bottom' : '50% 50%'}
                objectFit={isSm ? 'contain' : 'cover'}
                quality={95}
              />
            </div>
          }
          classname="md:!col-span-2"
        />
      </dl>
      <BackedBy className="pt-8" layout="horizontal" />
    </SectionContainer>
  )
}

export default Features
