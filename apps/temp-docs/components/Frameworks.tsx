import ButtonCard from './ButtonCard'

const Frameworks = () => {
  const frameworks = [
    {
      name: 'Angular',
      // logo: AngularLogo,
      href: '/guides/with-angular',
    },
    {
      name: 'Expo',
      // logo: ExpoLogo,
      href: '/guides/with-expo',
    },
    {
      name: 'Flutter',
      // logo: FlutterLogo,
      href: '/guides/with-flutter',
    },
    {
      name: 'JavaScript',
      // logo: JavascriptLogo,
      href: '/reference/javascript/installing#javascript',
    },
    {
      name: 'Next.js',
      themed: true,
      logo: {
        dark: '/img/libraries/nextjs-dark-icon.svg',
        light: '/img/libraries/nextjs-light-icon.svg',
      },
      href: '/guides/with-nextjs',
    },
    {
      name: 'React',
      // logo: ReactLogo,
      href: '/guides/with-react',
    },
    {
      name: 'RedwoodJS',
      // logo: RedwoodJsLogo,
      href: '/guides/with-redwoodjs',
    },
    {
      name: 'SolidJS',
      // logo: SolidJSLogo,
      href: '/guides/with-solidjs',
    },
    {
      name: 'Svelte',
      // logo: SvelteLogo,
      href: '/guides/with-svelte',
    },
    {
      name: 'Vue',
      // logo: VuejsLogo,
      href: '/guides/with-vue-3',
    },
  ]
  return (
    <div className="grid grid-cols-12 gap-4">
      {frameworks.map((x) => (
        <div key={x.name} className="col-span-3">
          <ButtonCard
            layout="horizontal"
            to={x.href}
            title={x.name}
            // icon={
            //   x.logo && !x.themed ? (
            //     <x.logo
            //       width="20"
            //       alt={x.name}
            //       style={{ display: 'block', maxHeight: 20, minWidth: 20 }}
            //     />
            //   ) : (
            //     <ThemedImage
            //       style={{
            //         display: 'block',
            //         maxHeight: 20,
            //         minWidth: 20,
            //         margin: 0,
            //       }}
            //       alt={x.name}
            //       width="20"
            //       sources={{
            //         light: useBaseUrl(x.logo.light),
            //         dark: useBaseUrl(x.logo.dark),
            //       }}
            //     />
            //   )
            // }
          />
        </div>
      ))}
    </div>
  )
}

export default Frameworks
