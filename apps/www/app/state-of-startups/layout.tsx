import localFont from 'next/font/local'

const suisseIntl = localFont({
  src: [
    {
      path: '../../public/fonts/state-of-startups/SuisseIntl-Book.otf',
      weight: '450',
      style: 'normal',
    },
    {
      path: '../../public/fonts/state-of-startups/SuisseIntl-Regular.otf',
      weight: '400',
      style: 'normal',
    },
    {
      path: '../../public/fonts/state-of-startups/SuisseIntl-Medium.otf',
      weight: '500',
      style: 'normal',
    },
    {
      path: '../../public/fonts/state-of-startups/SuisseIntl-Bold.otf',
      weight: '700',
      style: 'normal',
    },
  ],
  variable: '--font-suisse-intl',
  display: 'swap',
})

export default function StateOfStartupsLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={suisseIntl.variable} style={{ fontFamily: 'var(--font-suisse-intl)' }}>
      {children}
    </div>
  )
}
