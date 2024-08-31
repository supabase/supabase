export const frameworks = [
  {
    name: 'nextjs-shadcn-app-router',
    label: "Next.js 'use server' + shadcn",
  },
  {
    name: 'nextjs-shadcn-pages-router',
    label: "Next.js 'use client' + shadcn",
  },
  // {
  //   name: 'nextjs-app-router',
  //   label: 'NextJS App router',
  // },
  // {
  //   name: 'nextjs-pages-router',
  //   label: 'NextJS Pages router',
  // },
  // {
  //   name: 'react-shadcn',
  //   label: 'React ui.shadcn',
  // },
] as const

export type Framework = (typeof frameworks)[number]
