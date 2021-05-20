import Styles from './FloatingIcons.module.css'

function FloatingIcons() {
  return (
    <div className="absolute w-full h-full hidden lg:block">
      <div className="container max-w-screen-2xl h-full relative mx-auto">
        <img
          className={`${Styles['icon-react-one']}`}
          src="/images/product/auth/react-icon.svg"
        />
        <img
          src="/images/product/auth/electron-icon.svg"
          className={`${Styles['icon-electron']}`}
        />
        <img
          src="/images/product/auth/vue-icon.svg"
          className={`${Styles['icon-vue']}`}
        />
        <img
          src="/images/product/auth/angular-icon.svg"
          className={`${Styles['icon-angular']}`}
        />
        <img
          src="/images/product/auth/flutter-icon.svg"
          className={`${Styles['icon-flutter']}`}
        />
        <img
          src="/images/product/auth/nuxt-icon.svg"
          className={`${Styles['icon-nuxt']}`}
        />
        <img
          src="/images/product/auth/redwood-icon.svg"
          className={`${Styles['icon-redwood']}`}
        />
      </div>
    </div>
  )
}

export default FloatingIcons
