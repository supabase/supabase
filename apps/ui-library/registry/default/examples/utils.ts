import { sample } from 'lodash'

export const users = [
  {
    name: 'Gemma Scout',
    image: `${process.env.NEXT_PUBLIC_BASE_PATH}/img/profile-images/profile-0.png`,
  },
  {
    name: 'Miss Casey',
    image: `${process.env.NEXT_PUBLIC_BASE_PATH}/img/profile-images/profile-0.png`,
  },
  {
    name: 'Mark S.',
    image: `${process.env.NEXT_PUBLIC_BASE_PATH}/img/profile-images/profile-1.png`,
  },
  {
    name: 'Mark Scout',
    image: `${process.env.NEXT_PUBLIC_BASE_PATH}/img/profile-images/profile-1.png`,
  },
  {
    name: 'Seth Milchik',
    image: `${process.env.NEXT_PUBLIC_BASE_PATH}/img/profile-images/profile-2.png`,
  },
  {
    name: 'Helly R.',
    image: `${process.env.NEXT_PUBLIC_BASE_PATH}/img/profile-images/profile-3.png`,
  },
  {
    name: 'Helena Eagan',
    image: `${process.env.NEXT_PUBLIC_BASE_PATH}/img/profile-images/profile-3.png`,
  },
  {
    name: 'Dylan G.',
    image: `${process.env.NEXT_PUBLIC_BASE_PATH}/img/profile-images/profile-4.png`,
  },
  {
    name: 'Dylan George',
    image: `${process.env.NEXT_PUBLIC_BASE_PATH}/img/profile-images/profile-4.png`,
  },
  {
    name: 'Irving B.',
    image: `${process.env.NEXT_PUBLIC_BASE_PATH}/img/profile-images/profile-5.png`,
  },
  {
    name: 'Irving Bailiff',
    image: `${process.env.NEXT_PUBLIC_BASE_PATH}/img/profile-images/profile-5.png`,
  },
]

export function getRandomUser() {
  return sample(users)!
}

export function generateFullName(): string {
  return sample(users)?.name!
}
