import { useTelemetryProps } from 'common/hooks/useTelemetryProps'
import { useRouter } from 'next/router'
import { Check } from 'lucide-react'

import AuthVisual from './AuthVisual'
import DataAPIsVisual from './DataAPIsVisual'
import DatabaseVisual from './DatabaseVisual'
import FunctionsVisual from './FunctionsVisual'
import ProductCard from './ProductCard'
import RealtimeVisual from './RealtimeVisual'
import StorageVisual from './StorageVisual'
import VectorVisual from './VectorVisual'
import SectionContainer from '~/components/Layouts/SectionContainer'

import { PRODUCT_SHORTNAMES } from 'shared-data/products'
import gaEvents from '~/lib/gaEvents'
import Telemetry from '~/lib/telemetry'

import type { SolutionsType } from '~/data/Solutions'

interface Props {
  products: SolutionsType
}

const Products: React.FC<Props> = (props) => {
  const router = useRouter()
  const telemetryProps = useTelemetryProps()

  const sendTelemetryEvent = async (product: PRODUCT_SHORTNAMES | 'data-api') => {
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
      case 'data-api':
        return await Telemetry.sendEvent(
          gaEvents['www_hp_subhero_products_data-api'],
          telemetryProps,
          router
        )
    }
  }

  return (
    <SectionContainer className="!pt-0 grid grid-cols-1 gap-4 sm:grid-cols-2 md:gap-4 xl:gap-3 2xl:gap-6 md:grid-cols-12">
      <ProductCard
        isDatabase
        className="col-span-6 md:col-span-12 xl:col-span-6"
        alignLeft
        url={props.products['database'].url}
        icon={props.products['database'].icon}
        title={`Postgres ${props.products['database'].name}`}
        subtitle={props.products['database'].description}
        highlights={
          <ul className="flex flex-col gap-1 text-sm">
            <li>
              <Check className="inline h-4 w-4" /> 100% portable
            </li>
            <li>
              <Check className="inline h-4 w-4" /> Built-in Auth with RLS
            </li>
            <li>
              <Check className="inline h-4 w-4" /> Easy to extend
            </li>
          </ul>
        }
        onClick={() => sendTelemetryEvent(PRODUCT_SHORTNAMES.DATABASE)}
        image={<DatabaseVisual className="hidden sm:block" />}
      />
      <ProductCard
        className="col-span-6 xl:col-span-3"
        alignLeft
        url={props.products['authentication'].url}
        icon={props.products['authentication'].icon}
        title={props.products['authentication'].name}
        subtitle={
          <>
            <strong>Add user sign ups and logins</strong>,
            <br className="hidden lg:inline-block" /> securing your data with Row Level Security.
          </>
        }
        image={<AuthVisual className="hidden sm:block" />}
        onClick={() => sendTelemetryEvent(PRODUCT_SHORTNAMES.AUTHENTICATION)}
      />
      <ProductCard
        className="col-span-6 xl:col-span-3"
        alignLeft
        url={props.products['functions'].url}
        icon={props.products['functions'].icon}
        title={props.products['functions'].name}
        subtitle={
          <>
            Easily write custom code
            <br className="hidden sm:inline-block" />{' '}
            <strong>without deploying or scaling servers.</strong>
          </>
        }
        onClick={() => sendTelemetryEvent(PRODUCT_SHORTNAMES.FUNCTIONS)}
        image={<FunctionsVisual className="hidden sm:block" />}
      />
      <ProductCard
        className="col-span-6 xl:col-span-3"
        alignLeft
        url={props.products['storage'].url}
        icon={props.products['storage'].icon}
        title={props.products['storage'].name}
        subtitle={
          <>
            <strong>Store, organize, and serve</strong>
            <br className="hidden sm:inline-block xl:hidden 2xl:inline-block" /> large files, from
            videos to images.
          </>
        }
        image={<StorageVisual className="hidden sm:block" />}
        onClick={() => sendTelemetryEvent(PRODUCT_SHORTNAMES.STORAGE)}
      />
      <ProductCard
        alignLeft
        url={props.products['realtime'].url}
        icon={props.products['realtime'].icon}
        title={props.products['realtime'].name}
        subtitle={
          <>
            <strong>Build multiplayer experiences</strong>
            <br className="hidden sm:inline-block" /> with real-time data synchronization.
          </>
        }
        onClick={() => sendTelemetryEvent(PRODUCT_SHORTNAMES.REALTIME)}
        image={<RealtimeVisual className="hidden sm:block" />}
        className="
          col-span-6 pointer-events-none xl:col-span-3
          hover:!cursor-[url('/images/index/products/realtime-cursor-light.svg'),_auto]
          dark:hover:!cursor-[url('/images/index/products/realtime-cursor-dark.svg'),_auto]
        "
      />
      <ProductCard
        alignLeft
        className="col-span-6 xl:col-span-3"
        url={props.products['vector'].url}
        icon={props.products['vector'].icon}
        title={props.products['vector'].name}
        subtitle={
          <>
            Integrate your favorite ML-models to <br className="hidden sm:inline-block md:hidden" />
            <strong>store, index and search vector embeddings</strong>.
          </>
        }
        highlights={
          <ul className="flex flex-col gap-1 text-sm">
            <li className="flex items-center gap-2">
              <svg
                role="img"
                width="24"
                height="25"
                viewBox="0 0 24 25"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>OpenAI logo</title>
                <path
                  d="M19.7082 11.2701C20.1166 10.0449 19.9764 8.70392 19.3242 7.58845C18.3429 5.88172 16.3679 5.00397 14.4418 5.41237C13.5823 4.44928 12.351 3.90069 11.0588 3.90679C9.08995 3.90679 7.34055 5.17464 6.73101 7.04595C5.46315 7.30806 4.37206 8.10047 3.73204 9.22203C2.74458 10.9288 2.97011 13.0744 4.29282 14.5373C3.88443 15.7625 4.02462 17.1035 4.67684 18.2128C5.65821 19.9257 7.63314 20.8034 9.5654 20.395C10.4188 21.3581 11.65 21.9128 12.9423 21.9067C14.9111 21.9067 16.6605 20.6388 17.2701 18.7675C18.5379 18.5054 19.629 17.713 20.2629 16.5914C21.2565 14.8847 21.031 12.7391 19.7082 11.2762V11.2701ZM18.3063 8.17971C18.6964 8.8624 18.8427 9.6609 18.7086 10.435C18.6842 10.4167 18.6354 10.3924 18.605 10.3741L15.0208 8.30162C14.838 8.19799 14.6124 8.19799 14.4296 8.30162L10.2298 10.7276V8.94774L13.6981 6.94233C15.3134 6.00972 17.3737 6.56441 18.3063 8.17971ZM10.2298 11.8797L11.9975 10.8556L13.7652 11.8797V13.9216L11.9975 14.9457L10.2298 13.9216V11.8797ZM11.0527 5.08321C11.8451 5.08321 12.607 5.35751 13.2166 5.86343C13.1922 5.87562 13.1434 5.9061 13.1069 5.92439L9.52273 7.99075C9.33987 8.09437 9.23015 8.28943 9.23015 8.50277V13.3548L7.68799 12.4648V8.454C7.68799 6.58879 9.19357 5.08321 11.0588 5.07712L11.0527 5.08321ZM4.75608 9.81329C5.15228 9.1306 5.76792 8.60639 6.51157 8.33209V12.5928C6.51157 12.8062 6.62129 12.9951 6.80415 13.1048L10.9978 15.5247L9.44958 16.4208L5.98736 14.4215C4.37816 13.4889 3.82347 11.4286 4.75608 9.81329ZM5.70087 17.6338C5.30467 16.9572 5.16447 16.1526 5.29857 15.3784C5.32296 15.3967 5.37172 15.4211 5.4022 15.4394L8.98633 17.5119C9.16919 17.6155 9.39472 17.6155 9.57759 17.5119L13.7713 15.0859V16.8657L10.3029 18.8651C8.68765 19.7916 6.62738 19.243 5.69478 17.6338H5.70087ZM12.9484 20.7303C12.1621 20.7303 11.394 20.456 10.7906 19.95C10.815 19.9379 10.8698 19.9074 10.9003 19.8891L14.4844 17.8227C14.6673 17.7191 14.7831 17.524 14.777 17.3107V12.4648L16.3192 13.3548V17.3595C16.3192 19.2247 14.8075 20.7364 12.9484 20.7364V20.7303ZM19.2511 16.0002C18.8549 16.6829 18.2331 17.2071 17.4956 17.4753V13.2146C17.4956 13.0012 17.3859 12.8062 17.203 12.7025L13.0032 10.2765L14.5454 9.38661L18.0137 11.3859C19.629 12.3185 20.1776 14.3788 19.245 15.9941L19.2511 16.0002Z"
                  fill="currentColor"
                />
              </svg>

              <span>OpenAI</span>
            </li>
            <li className="flex items-center gap-2">
              <svg
                width="24"
                height="25"
                viewBox="0 0 24 25"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <title>Hugging Face logo</title>
                <path
                  d="M14.5063 9.99415C14.6241 10.0358 14.7118 10.1627 14.7951 10.2834C14.9078 10.4466 15.0127 10.5984 15.1736 10.5128C15.7037 10.2309 15.905 9.57264 15.6231 9.04248C15.3412 8.51234 14.6829 8.31108 14.1527 8.59297C13.6226 8.87486 13.4213 9.53316 13.7032 10.0633C13.7778 10.2036 13.9432 10.1374 14.1179 10.0675C14.2548 10.0127 14.3974 9.95571 14.5063 9.99415Z"
                  fill="currentColor"
                />
                <path
                  d="M9.09514 10.2834C9.17851 10.1627 9.26617 10.0358 9.38402 9.99415C9.49288 9.95571 9.63547 10.0127 9.77241 10.0675C9.94706 10.1374 10.1125 10.2036 10.1871 10.0633C10.469 9.53316 10.2677 8.87486 9.73755 8.59297C9.20739 8.31108 8.54909 8.51234 8.2672 9.04248C7.98531 9.57264 8.18657 10.2309 8.71673 10.5128C8.87762 10.5984 8.98246 10.4466 9.09514 10.2834Z"
                  fill="currentColor"
                />
                <path
                  d="M17.161 11.018C17.5512 11.018 17.8676 10.7016 17.8676 10.3113C17.8676 9.92101 17.5512 9.60461 17.161 9.60461C16.7706 9.60461 16.4543 9.92101 16.4543 10.3113C16.4543 10.7016 16.7706 11.018 17.161 11.018Z"
                  fill="currentColor"
                />
                <path
                  d="M7.75666 10.3113C7.75666 10.7016 7.44026 11.018 7.04997 11.018C6.65967 11.018 6.34329 10.7016 6.34329 10.3113C6.34329 9.92101 6.65967 9.60461 7.04997 9.60461C7.44026 9.60461 7.75666 9.92101 7.75666 10.3113Z"
                  fill="currentColor"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M10.2643 11.867C10.7827 12.123 11.3674 12.4118 11.9967 12.4118C12.6281 12.4118 13.2188 12.1198 13.7412 11.8612C13.8755 11.7946 14.0128 11.7271 14.1376 11.6754C14.2558 11.6264 14.4041 11.5735 14.555 11.5634C14.723 11.5521 14.9473 11.5939 15.1049 11.7968C15.2359 11.9654 15.2584 12.172 15.2584 12.3283C15.2584 12.9001 15.062 13.7136 14.5621 14.3945C14.0482 15.0944 13.2161 15.6471 11.9967 15.6471C10.7774 15.6471 9.94528 15.0944 9.43142 14.3945C8.93144 13.7136 8.73514 12.9001 8.73514 12.3283C8.73514 12.1765 8.75633 11.981 8.87358 11.8169C9.01568 11.618 9.22619 11.5584 9.40046 11.5617C9.5519 11.5646 9.69847 11.613 9.81184 11.6576C9.93225 11.7049 10.0627 11.7677 10.1901 11.8304L10.2643 11.867ZM9.6146 12.5191C9.65304 12.9157 9.80861 13.4387 10.1325 13.8798C10.259 14.052 10.4113 14.2126 10.5946 14.3489C10.8301 14.0628 11.1482 13.8473 11.5124 13.7389C11.5993 13.713 11.6889 13.8627 11.7805 14.0159C11.869 14.1637 11.9594 14.3149 12.0514 14.3149C12.1494 14.3149 12.2457 14.1659 12.3397 14.0204C12.4379 13.8684 12.5336 13.7204 12.6261 13.75C12.6531 13.7586 12.6799 13.7678 12.7063 13.7776C13.0007 13.8867 13.2605 14.0671 13.4646 14.2979C13.619 14.1732 13.7499 14.031 13.861 13.8798C14.1849 13.4386 14.3404 12.9156 14.3789 12.5191C14.3062 12.5523 14.2234 12.5929 14.1271 12.6406L14.0759 12.666C13.5846 12.9098 12.8353 13.2816 11.9967 13.2816C11.1555 13.2816 10.4002 12.9061 9.90763 12.6612L9.90682 12.6608C9.87181 12.6434 9.83812 12.6266 9.80583 12.6107C9.73404 12.5754 9.67084 12.5448 9.6146 12.5191ZM14.3845 12.2678C14.3845 12.2678 14.3845 12.2678 14.3846 12.2681L14.3848 12.2693C14.3846 12.2683 14.3845 12.2678 14.3845 12.2678Z"
                  fill="currentColor"
                />
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M13.4818 20.3557C13.0168 20.4352 12.5388 20.4766 12.0511 20.4766C11.5966 20.4766 11.1505 20.4406 10.7155 20.3714C10.1735 20.9859 9.32496 21.297 8.18783 21.297C7.49528 21.297 6.69532 21.1805 5.81077 20.9511L5.81039 20.951C5.79063 20.9455 5.18516 20.7768 4.52417 20.5147C3.44871 20.0883 2.89489 19.691 2.67202 19.1868C2.52503 18.8541 2.53568 18.4968 2.70224 18.1807C2.71768 18.1513 2.73421 18.1226 2.75182 18.095C2.4748 17.6719 2.52785 17.2611 2.57961 17.0639C2.64571 16.8123 2.78248 16.6031 2.96817 16.4529C2.88011 16.3066 2.82118 16.1485 2.79574 15.9721C2.74225 15.6018 2.8651 15.2318 3.14169 14.9306C3.35695 14.696 3.66137 14.5668 3.9984 14.5668L4.00736 14.5669C3.75908 13.7723 3.62529 12.9272 3.62529 12.0508C3.62529 7.39737 7.39765 3.625 12.0511 3.625C16.7046 3.625 20.4769 7.39737 20.4769 12.0508C20.4769 12.9294 20.3425 13.7766 20.093 14.5729C20.1336 14.5689 20.1735 14.5668 20.2126 14.5668C20.5496 14.5668 20.854 14.696 21.0693 14.9306C21.3459 15.2318 21.4687 15.6018 21.4153 15.9721C21.3898 16.1485 21.3309 16.3066 21.2428 16.4529C21.4285 16.6031 21.5653 16.8123 21.6314 17.0639C21.6831 17.2611 21.7362 17.6719 21.4592 18.095C21.4768 18.1226 21.4933 18.1513 21.5087 18.1807C21.6753 18.4968 21.686 18.8541 21.539 19.1868C21.3161 19.691 20.7623 20.0883 19.6868 20.5147C19.0256 20.7769 18.42 20.9456 18.4007 20.951L18.4002 20.9511C17.5157 21.1805 16.7157 21.297 16.0232 21.297C14.8764 21.297 14.0231 20.9806 13.4818 20.3557ZM12.0511 4.49476C16.2242 4.49476 19.6072 7.87772 19.6072 12.0508C19.6072 12.6276 19.5425 13.1893 19.4201 13.7291C19.2075 13.5224 18.9259 13.4098 18.6153 13.4098C18.3335 13.4098 18.0436 13.5031 17.7536 13.6871C17.5611 13.8093 17.3485 14.0258 17.1295 14.2981C16.9266 14.0167 16.6427 13.8297 16.3178 13.7786C16.2556 13.7688 16.1923 13.7638 16.1299 13.7638C15.3882 13.7638 14.942 14.4072 14.7733 14.986C14.6896 15.1815 14.2878 16.0722 13.6833 16.6762C12.7664 17.5926 12.5342 18.5377 12.9826 19.55C12.6774 19.5875 12.3665 19.6069 12.0511 19.6069C11.7713 19.6069 11.495 19.5917 11.223 19.562C11.6786 18.5452 11.4482 17.5962 10.5277 16.6762C9.92322 16.0722 9.52139 15.1815 9.43767 14.986C9.26894 14.4072 8.82275 13.7638 8.08106 13.7638C8.01866 13.7638 7.95538 13.7688 7.8932 13.7786C7.56834 13.8297 7.28436 14.0167 7.08149 14.2981C6.86253 14.0258 6.64987 13.8093 6.45744 13.6871C6.16737 13.5031 5.87752 13.4098 5.59572 13.4098C5.24368 13.4098 4.92905 13.5544 4.70965 13.8166L4.70412 13.8233C4.56745 13.2548 4.49506 12.6613 4.49506 12.0508C4.49506 7.87772 7.87802 4.49476 12.0511 4.49476ZM5.59572 14.2796C5.70662 14.2796 5.84208 14.3268 5.99146 14.4216C6.45526 14.7158 7.35025 16.2542 7.67793 16.8526C7.78774 17.053 7.97539 17.1378 8.14434 17.1378C8.47963 17.1378 8.74143 16.8045 8.175 16.3809C7.32328 15.7436 7.62205 14.7018 8.02866 14.6377C8.04649 14.6349 8.0641 14.6336 8.08106 14.6336C8.45071 14.6336 8.61379 15.2707 8.61379 15.2707C8.61379 15.2707 9.09173 16.4709 9.91278 17.2913C10.7338 18.112 10.7762 18.7706 10.1778 19.6482C9.76971 20.2466 8.98844 20.4273 8.18783 20.4273C7.35742 20.4273 6.50614 20.2329 6.02908 20.1092C6.0056 20.1031 3.10429 19.2835 3.47176 18.586C3.53352 18.4688 3.63528 18.4218 3.76335 18.4218C4.038 18.4218 4.43201 18.6387 4.80181 18.8423C5.12882 19.0224 5.43692 19.192 5.62681 19.192C5.71727 19.192 5.78098 19.1535 5.80707 19.0596C5.88544 18.7784 5.35099 18.5713 4.76671 18.3449C4.06546 18.0732 3.29243 17.7736 3.42088 17.2848C3.46241 17.1263 3.57505 17.0619 3.73334 17.0622C4.13901 17.0622 4.84392 17.4854 5.41743 17.8297C5.81072 18.0658 6.14222 18.2648 6.27305 18.2648C6.29762 18.2648 6.31523 18.2577 6.3248 18.2424C6.48592 17.9824 6.39764 17.8008 5.26195 17.1135C5.17294 17.0596 5.08601 17.0074 5.00159 16.9567C4.00899 16.3606 3.36466 15.9737 3.78249 15.5188C3.83467 15.4618 3.9086 15.4366 3.9984 15.4366C4.68791 15.4368 6.31697 16.9193 6.31697 16.9193C6.31697 16.9193 6.75664 17.3766 7.02256 17.3766C7.08367 17.3766 7.13563 17.3524 7.17086 17.2929C7.26579 17.1328 6.82107 16.6806 6.34216 16.1936C5.87006 15.7135 5.36473 15.1997 5.31044 14.8986C5.23629 14.4877 5.36241 14.2796 5.59572 14.2796ZM18.2195 14.4216C18.3689 14.3268 18.5044 14.2796 18.6153 14.2796C18.8486 14.2796 18.9747 14.4877 18.9006 14.8986C18.8463 15.1997 18.3409 15.7135 17.8688 16.1936C17.3899 16.6806 16.9452 17.1328 17.0401 17.2929C17.0754 17.3524 17.1273 17.3766 17.1884 17.3766C17.4544 17.3766 17.894 16.9193 17.894 16.9193C17.894 16.9193 19.5231 15.4368 20.2126 15.4366C20.3024 15.4366 20.3763 15.4618 20.4285 15.5188C20.8463 15.9737 20.202 16.3606 19.2094 16.9567C19.125 17.0074 19.038 17.0596 18.949 17.1135C17.8133 17.8008 17.7251 17.9824 17.8862 18.2424C17.8958 18.2577 17.9134 18.2648 17.9379 18.2648C18.0688 18.2648 18.4003 18.0658 18.7936 17.8297C19.3671 17.4854 20.072 17.0622 20.4776 17.0622C20.6359 17.0619 20.7486 17.1263 20.7901 17.2848C20.9186 17.7736 20.1455 18.0732 19.4443 18.3449C18.86 18.5713 18.3255 18.7784 18.4039 19.0596C18.43 19.1535 18.4937 19.192 18.5842 19.192C18.7741 19.192 19.0822 19.0224 19.4092 18.8423C19.779 18.6387 20.173 18.4218 20.4476 18.4218C20.5757 18.4218 20.6775 18.4688 20.7392 18.586C21.1067 19.2835 18.2054 20.1031 18.1819 20.1092C17.7048 20.2329 16.8536 20.4273 16.0232 20.4273C15.2225 20.4273 14.4413 20.2466 14.0331 19.6482C13.4348 18.7706 13.4772 18.112 14.2982 17.2913C15.1193 16.4709 15.5972 15.2707 15.5972 15.2707C15.5972 15.2707 15.7603 14.6336 16.1299 14.6336C16.1469 14.6336 16.1645 14.6349 16.1823 14.6377C16.5889 14.7018 16.8877 15.7436 16.036 16.3809C15.4696 16.8045 15.7314 17.1378 16.0667 17.1378C16.2356 17.1378 16.4233 17.053 16.5331 16.8526C16.8607 16.2542 17.7557 14.7158 18.2195 14.4216Z"
                  fill="currentColor"
                />
              </svg>

              <span>Hugging Face</span>
            </li>
          </ul>
        }
        onClick={() => sendTelemetryEvent(PRODUCT_SHORTNAMES.VECTOR)}
        image={<VectorVisual className="hidden sm:block" />}
      />
      <ProductCard
        alignLeft
        className="col-span-6 xl:col-span-3"
        url={props.products['data-api'].url}
        icon={props.products['data-api'].icon}
        title={props.products['data-api'].name}
        subtitle={props.products['data-api'].description}
        onClick={() => sendTelemetryEvent('data-api')}
        image={<DataAPIsVisual className="hidden sm:block" />}
      />
      <p className="text-xl sm:text-2xl text-foreground-lighter col-span-full tracking-[-.01rem]">
        <span className="text-foreground">Use one or all.</span> Best of breed products. Integrated
        as a platform.
      </p>
    </SectionContainer>
  )
}

export default Products
