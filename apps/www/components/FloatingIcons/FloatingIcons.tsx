import { useRouter } from 'next/router'

import Styles from './FloatingIcons.module.css'

function FloatingIcons() {
  // base path for images
  const { basePath } = useRouter()

  return (
    <div className="absolute w-full h-full hidden lg:block">
      <div className="container max-w-screen-2xl h-full relative mx-auto">
        <img
          className={`${Styles['icon-react-one']}`}
          src={`${basePath}/images/product/auth/react-icon.svg`}
        />
        <img
          src={`${basePath}/images/product/auth/electron-icon.svg`}
          className={`${Styles['icon-electron']}`}
        />
        <img
          src={`${basePath}/images/product/auth/vue-icon.svg`}
          className={`${Styles['icon-vue']}`}
        />
        <img
          src={`${basePath}/images/product/auth/angular-icon.svg`}
          className={`${Styles['icon-angular']}`}
        />
        <img
          src={`${basePath}/images/product/auth/flutter-icon.svg`}
          className={`${Styles['icon-flutter']}`}
        />
        <img
          src={`${basePath}/images/product/auth/nuxt-icon.svg`}
          className={`${Styles['icon-nuxt']}`}
        />
        <img
          src={`${basePath}/images/product/auth/redwood-icon.svg`}
          className={`${Styles['icon-redwood']}`}
        />
      </div>
    </div>
  )
}

export default FloatingIcons
