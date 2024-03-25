import { useRouter } from 'next/router'
import Image from 'next/image'
import Telemetry from '~/lib/telemetry'
import gaEvents from '~/lib/gaEvents'
import { IconCheck } from 'ui'
import { useTelemetryProps } from 'common/hooks/useTelemetryProps'
import { PRODUCT_SHORTNAMES } from 'shared-data/products'

import SectionContainer from '~/components/Layouts/SectionContainer'
import ProductCard from './ProductCard'
import AuthVisual from './AuthVisual'
import DatabaseVisual from './DatabaseVisual'
import FunctionsVisual from './FunctionsVisual'
import RealtimeVisual from './RealtimeVisual'
import StorageVisual from './StorageVisual'
import VectorVisual from './VectorVisual'

const Products = (props: any) => {
  const router = useRouter()
  const telemetryProps = useTelemetryProps()

  const sendTelemetryEvent = async (product: PRODUCT_SHORTNAMES) => {
    switch (product) {
      case PRODUCT_SHORTNAMES.DATABASE:
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_database'],
          telemetryProps,
          router
        )
      case PRODUCT_SHORTNAMES.AUTHENTICATION:
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_auth'],
          telemetryProps,
          router
        )
      case PRODUCT_SHORTNAMES.STORAGE:
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_storage'],
          telemetryProps,
          router
        )
      case PRODUCT_SHORTNAMES.FUNCTIONS:
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_edgeFunctions'],
          telemetryProps,
          router
        )
      case PRODUCT_SHORTNAMES.REALTIME:
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_realtime'],
          telemetryProps,
          router
        )
      case PRODUCT_SHORTNAMES.VECTOR:
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_vector'],
          telemetryProps,
          router
        )
    }
  }

  return (
    <SectionContainer className="!pt-0 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-4 xl:gap-3 2xl:gap-6 md:grid-cols-12">
      <ProductCard
        className="col-span-6 lg:col-span-12 xl:col-span-6"
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
        onClick={() => sendTelemetryEvent(PRODUCT_SHORTNAMES.DATABASE)}
        image={<DatabaseVisual />}
      />
      <ProductCard
        className="col-span-6 xl:col-span-3"
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
        image={<AuthVisual />}
        onClick={() => sendTelemetryEvent(PRODUCT_SHORTNAMES.AUTHENTICATION)}
      />
      <ProductCard
        className="col-span-6 xl:col-span-3"
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
        onClick={() => sendTelemetryEvent(PRODUCT_SHORTNAMES.FUNCTIONS)}
        image={<FunctionsVisual />}
      />
      <ProductCard
        className="col-span-6 xl:col-span-3"
        url={props.products['storage'].url}
        icon={props.products['storage'].icon}
        title={props.products['storage'].name}
        subtitle={
          <>
            Store, organize, and serve large files,
            <br className="inline-block xl:hidden 2xl:inline-block" /> from videos to images.
          </>
        }
        image={<StorageVisual />}
        onClick={() => sendTelemetryEvent(PRODUCT_SHORTNAMES.STORAGE)}
      />
      <ProductCard
        url={props.products['realtime'].url}
        icon={props.products['realtime'].icon}
        title={props.products['realtime'].name}
        subtitle={
          <>
            Build multiplayer experiences
            <br className="inline-block md:hidden 2xl:inline-block" /> with realtime data
            synchronization.
          </>
        }
        onClick={() => sendTelemetryEvent(PRODUCT_SHORTNAMES.REALTIME)}
        image={<RealtimeVisual />}
        className="col-span-6 xl:col-span-3 hover:!cursor-[url('/images/index/products/realtime-cursor.svg'),_auto]"
      />

      <ProductCard
        alignLeft
        className="col-span-6 lg:col-span-12 xl:col-span-6"
        url={props.products['vector'].url}
        icon={props.products['vector'].icon}
        title={props.products['vector'].name}
        subtitle={
          <>
            Integrate your favorite ML-models to store,
            <br className="inline-block md:hidden" /> index and search vector embeddings.
          </>
        }
        highlights={
          <ul className="flex flex-col gap-1 text-sm">
            <li className="flex items-center gap-2">
              <Image src="/images/logos/openai.svg" alt="OpenAI logo" width="25" height="25" />
              <span>OpenAI</span>
            </li>
            <li className="flex items-center gap-2">
              <Image
                src="/images/logos/hugging-face.svg"
                alt="Hugging Face logo"
                width="25"
                height="25"
              />
              <span>Hugging Face</span>
            </li>
          </ul>
        }
        onClick={() => sendTelemetryEvent(PRODUCT_SHORTNAMES.VECTOR)}
        image={<VectorVisual />}
      />
    </SectionContainer>
  )
}

export default Products
