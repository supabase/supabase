import { useRouter } from 'next/router'
import Image from 'next/image'
import Telemetry from '~/lib/telemetry'
import gaEvents from '~/lib/gaEvents'
import { IconCheck } from 'ui'
import { useBreakpoint } from 'common'
import { useTelemetryProps } from 'common/hooks/useTelemetryProps'

import SectionContainer from '~/components/Layouts/SectionContainer'

import ProductCard from './ProductCard'
import DatabaseVisual from './DatabaseVisual'

const Products = (props: any) => {
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
    <SectionContainer>
      <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-4 lg:gap-6 md:grid-cols-12">
        <ProductCard
          alignLeft
          url={props.products['database'].url}
          icon={props.products['database'].icon}
          title={props.products['database'].name}
          subtitle={props.products['database'].description}
          highlights={
            <ul className="flex flex-col gap-1 text-sm">
              <li>
                <IconCheck className="inline h-4 w-4" /> 100% portable
              </li>
              <li>
                <IconCheck className="inline h-4 w-4" /> Built-in Auth with RLS
              </li>
              <li>
                <IconCheck className="inline h-4 w-4" /> Easy to extend
              </li>
            </ul>
          }
          onClick={() => sendTelemetryEvent(name)}
          image={<DatabaseVisual />}
          className="col-span-6"
        />
        <ProductCard
          url={props.products['authentication'].url}
          icon={props.products['authentication'].icon}
          title={props.products['authentication'].name}
          subtitle={
            <>
              Add user sign ups and logins,
              <br className="inline-block sm:hidden lg:inline-block" /> securing your data with Row
              Level Security.
            </>
          }
          image={
            <div className="absolute inset-0 z-0">
              <Image
                src="/images/index/products/auth.svg"
                alt="Supabase Authentication"
                layout="fill"
                objectFit="cover"
                objectPosition="right"
                className="antialiased"
                quality={100}
              />
            </div>
          }
          className="col-span-6 xl:col-span-3"
          onClick={() => sendTelemetryEvent(name)}
        />
        <ProductCard
          url={props.products['functions'].url}
          icon={props.products['functions'].icon}
          title={props.products['functions'].name}
          subtitle={
            <>
              Easily write custom code
              <br className="inline-block sm:hidden lg:inline-block" /> without deploying or scaling
              servers.
            </>
          }
          onClick={() => sendTelemetryEvent(name)}
          image={
            <div className="absolute inset-0 z-0">
              <Image
                src="/images/index/products/functions.svg"
                alt="Supabase Edge Functions"
                layout="fill"
                objectPosition="50% 50%"
                objectFit="cover"
                className="antialiased"
                quality={100}
              />
            </div>
          }
          className="col-span-6 xl:col-span-3"
        />
        <ProductCard
          url={props.products['storage'].url}
          icon={props.products['storage'].icon}
          title={props.products['storage'].name}
          subtitle={<>Store, organize, and serve large files, from videos to images.</>}
          image={
            <div className="absolute inset-0 z-0">
              <Image
                src="/images/index/products/storage.svg"
                alt="Supabase Storage"
                layout="fill"
                objectPosition="50% 50%"
                objectFit="cover"
                className="antialiased"
                quality={100}
              />
            </div>
          }
          className="col-span-6 xl:col-span-3"
          onClick={() => sendTelemetryEvent(name)}
        />
        <ProductCard
          url={props.products['realtime'].url}
          icon={props.products['realtime'].icon}
          title={props.products['realtime'].name}
          subtitle={
            <>
              Build multiplayer experiences
              <br className="inline-block sm:hidden lg:inline-block" /> with realtime data
              synchronization.
            </>
          }
          image={
            <div className="absolute inset-0 z-0">
              <Image
                src="/images/index/products/realtime.svg"
                alt="Supabase Realtime"
                layout="fill"
                objectPosition="50% 50%"
                objectFit="cover"
                className="antialiased"
                quality={100}
              />
            </div>
          }
          className="col-span-6 xl:col-span-3"
        />
        <ProductCard
          alignLeft
          url={props.products['vector'].url}
          icon={props.products['vector'].icon}
          title={props.products['vector'].name}
          subtitle={props.products['vector'].description}
          highlights={
            <ul className="flex flex-col gap-1 text-sm">
              <li>
                <IconCheck className="inline h-4 w-4" /> OpenAI
              </li>
              <li>
                <IconCheck className="inline h-4 w-4" /> Hugging Face
              </li>
            </ul>
          }
          onClick={() => sendTelemetryEvent(name)}
          image={
            <div className="absolute inset-0 z-0">
              <Image
                src={'/images/index/products/vector.svg'}
                alt="Supabase Vector AI"
                layout="fill"
                objectPosition="50% 50%"
                objectFit="cover"
                quality={95}
              />
            </div>
          }
          className="col-span-6"
        />
      </dl>
    </SectionContainer>
  )
}

export default Products
