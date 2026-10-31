import Image from 'next/image'
import { cn } from 'ui'

import { migrationSolutions, Solutions } from './Solutions'

interface ComparisonIconProps {
  className?: string
}

export const data = {
  label: 'Compare',
  comparisons: [
    {
      name: 'Firebase',
      url: '/alternatives/supabase-vs-firebase',
      icon: migrationSolutions.solutions.find((solution) => solution.id === Solutions.firebase)
        ?.icon,
    },
    {
      name: 'Heroku Postgres',
      url: '/alternatives/supabase-vs-heroku-postgres',
      icon: ({ className }: ComparisonIconProps) => (
        <Image
          src="/images/logos/heroku-icon.svg"
          alt=""
          width={16}
          height={16}
          className={className}
        />
      ),
    },
    {
      name: 'Auth0',
      url: '/alternatives/supabase-vs-auth0',
      icon: ({ className }: ComparisonIconProps) => (
        <>
          <Image
            src="/images/logos/auth0-icon-light.svg"
            alt=""
            width={16}
            height={16}
            className={cn(className, 'dark:hidden')}
          />
          <Image
            src="/images/logos/auth0-icon.svg"
            alt=""
            width={16}
            height={16}
            className={cn(className, 'hidden dark:block')}
          />
        </>
      ),
    },
  ],
}

export default data
