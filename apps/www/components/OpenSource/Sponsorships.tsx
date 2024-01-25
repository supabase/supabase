import Link from 'next/link'
import React from 'react'
import { IconArrowUpRight, cn } from 'ui'

import Panel from '~/components/Panel'

const Sponsorships = ({ sponsorships }: { sponsorships: any[] }) => {
  return (
    <div className="flex flex-col gap-8 xl:gap-10">
      <div className="w-full gap-2 flex flex-col items-center text-center">
        <h2 className="text-3xl xl:text-4xl max-w-[280px] sm:max-w-xs xl:max-w-[360px] tracking-[-1px]">
          Sponsored Projects
        </h2>
        <p className="text-foreground-lighter mb-4 max-w-sm">
          We don't just live and breath open-source, we also sponsor projects we love.
        </p>
      </div>
      <div className="relative w-full h-fit grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sponsorships.map((link) => (
          <Link href={link.url} key={link.name} target="_blank">
            <Panel
              innerClassName={cn(
                'relative group flex flex-col gap-2 p-4 ',
                link.isGithub ? 'md:min-h-[170px] md:h-[200px]' : 'min-h-[120px] md:h-[140px]'
              )}
              hasActiveOnHover
            >
              <div className="flex gap-1 items-center">
                {link.isGithub && (
                  <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    className="fill-foreground-lighter grouopp-hover:fill-foreground"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M12 3.33215C7.09969 3.33215 3.12744 7.31061 3.12744 12.2198C3.12744 16.1459 5.66943 19.4775 9.19538 20.6523C9.63901 20.7339 9.80049 20.4597 9.80049 20.2237C9.80049 20.0135 9.7934 19.4536 9.78896 18.7127C7.32061 19.2495 6.79979 17.5211 6.79979 17.5211C6.39698 16.4937 5.81494 16.2204 5.81494 16.2204C5.00931 15.6703 5.87616 15.681 5.87616 15.681C6.76608 15.7431 7.23455 16.5966 7.23455 16.5966C8.02598 17.9541 9.31161 17.562 9.81646 17.3348C9.89809 16.7608 10.127 16.3695 10.3808 16.1477C8.41105 15.9232 6.33931 15.1602 6.33931 11.7549C6.33931 10.7851 6.68534 9.99101 7.25229 9.36993C7.16091 9.14545 6.85658 8.24134 7.33925 7.0187C7.33925 7.0187 8.08454 6.77914 9.7792 7.92903C10.503 7.73162 11.2498 7.63108 12 7.63002C12.7542 7.63357 13.5128 7.73206 14.2217 7.92903C15.9155 6.77914 16.659 7.01781 16.659 7.01781C17.1434 8.24134 16.8382 9.14545 16.7477 9.36993C17.3155 9.99101 17.6598 10.7851 17.6598 11.7549C17.6598 15.169 15.5845 15.9205 13.6086 16.1406C13.9271 16.4147 14.2102 16.9569 14.2102 17.7864C14.2102 18.9736 14.1995 19.9327 14.1995 20.2237C14.1995 20.4615 14.3592 20.7383 14.8099 20.6514C16.5767 20.0588 18.1126 18.9259 19.2005 17.4129C20.2884 15.8999 20.8733 14.0833 20.8726 12.2198C20.8726 7.31061 16.8994 3.33215 12 3.33215Z"
                      fill="currentColor"
                    />
                  </svg>
                )}

                <p className="text-foreground group-hover:text-brand text-lg m-0 leading-none">
                  {link.name}
                </p>
              </div>
              <p className="text-sm flex-1 text-foreground-lighter">{link.description}</p>
              <div className="text-sm w-full flex justify-between text-foreground-lighter mt-2">
                <IconArrowUpRight className="w-4 stroke-[1.5px]" />
              </div>
            </Panel>
          </Link>
        ))}
      </div>
    </div>
  )
}

export default Sponsorships
