import ButtonCard from './ButtonCard'
import { useTheme } from 'next-themes'

const Frameworks = () => {
  const { resolvedTheme } = useTheme()

  const frameworks = [
    {
      name: 'Angular',
      logo: {
        light: '/docs/img/icons/angular-icon.svg',
        dark: '/docs/img/icons/angular-icon.svg',
      },
      href: '/guides/with-angular',
    },
    {
      name: 'Expo React Native',
      logo: {
        light: '/docs/img/icons/expo-icon-light.svg',
        dark: '/docs/img/icons/expo-icon.svg',
      },
      href: '/guides/with-expo-react-native',
    },
    {
      name: 'Flutter',
      logo: {
        light: '/docs/img/icons/flutter-icon.svg',
        dark: '/docs/img/icons/flutter-icon.svg',
      },
      href: '/guides/with-flutter',
    },
    {
      name: 'JavaScript',
      logo: {
        light: '/docs/img/icons/javascript-icon.svg',
        dark: '/docs/img/icons/javascript-icon.svg',
      },
      href: '/reference/javascript/installing#javascript',
    },
    {
      name: 'Kotlin',
      logo: {
        light: '/docs/img/icons/kotlin-icon.svg',
        dark: '/docs/img/icons/kotlin-icon.svg',
      },
      href: '/guides/with-kotlin',
    },
    {
      name: 'Next.js',
      logo: {
        light: '/docs/img/icons/nextjs-icon-light.svg',
        dark: '/docs/img/icons/nextjs-icon.svg',
      },
      href: '/guides/with-nextjs',
    },
    {
      name: 'React',
      logo: {
        light: '/docs/img/icons/react-icon.svg',
        dark: '/docs/img/icons/react-icon.svg',
      },
      href: '/guides/with-react',
    },
    {
      name: 'RedwoodJS',
      logo: {
        light: '/docs/img/icons/redwoodjs-icon.svg',
        dark: '/docs/img/icons/redwoodjs-icon.svg',
      },
      href: '/guides/with-redwoodjs',
    },
    {
      name: 'SolidJS',
      logo: {
        light: '/docs/img/icons/solidjs-icon.svg',
        dark: '/docs/img/icons/solidjs-icon.svg',
      },
      href: '/guides/with-solidjs',
    },
    {
      name: 'Svelte',
      logo: {
        light: '/docs/img/icons/svelte-icon.svg',
        dark: '/docs/img/icons/svelte-icon.svg',
      },
      href: '/guides/with-svelte',
    },
    {
      name: 'Vue',
      logo: {
        light: '/docs/img/icons/vuejs-icon.svg',
        dark: '/docs/img/icons/vuejs-icon.svg',
      },
      href: '/guides/with-vue-3',
    },
    {
      name: 'refine',
      logo: {
        light: '/docs/img/icons/refine-icon.svg',
        dark: '/docs/img/icons/refine-icon.svg',
      },
      href: '/guides/getting-started/tutorials/with-refine',
    },
  ]
  return (
    <div className="grid md:grid-cols-12 gap-4 not-prose">
      {frameworks.map((x) => (
        <div key={x.name} className="col-span-3">
          <ButtonCard
            layout="horizontal"
            to={x.href}
            title={x.name}
            icon={resolvedTheme === 'dark' ? x.logo.dark : x.logo.light}
          />
        </div>
      ))}
    </div>
  )
}

export default Frameworks
