import dynamic from 'next/dynamic'
import { getSortedPosts } from '~/lib/posts'
import PostTypes from '~/types/post'
import Layout from '~/components/Layouts/Default'
import Hero from '~/components/Hero/Hero'
import {
  Button,
  CommandEmpty_Shadcn_,
  CommandGroup_Shadcn_,
  CommandInput_Shadcn_,
  CommandItem_Shadcn_,
  Command_Shadcn_,
  PopoverContent_Shadcn_,
  PopoverTrigger_Shadcn_,
  Popover_Shadcn_,
  cn,
} from 'ui'

// Import Swiper styles if swiper used on page
import 'swiper/swiper.min.css'
import { CheckCircleIcon, ChevronUpIcon } from '@heroicons/react/outline'
import { useState } from 'react'

const Features = dynamic(() => import('~/components/Features/index'))
const BackedBy = dynamic(() => import('~/components/BackedBy'))
const BuiltExamples = dynamic(() => import('components/BuiltWithSupabase/index'))
const MadeForDevelopers = dynamic(() => import('components/MadeForDevelopers/index'))
const AdminAccess = dynamic(() => import('components/AdminAccess/index'))
const CTABanner = dynamic(() => import('components/CTABanner/index'))
const CustomerStories = dynamic(() => import('components/CustomerStories'))
const TwitterSocialSection = dynamic(() => import('~/components/TwitterSocialSection'))

type Props = { customerStories: PostTypes[] }

const Index = ({ customerStories }: Props) => {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState('')

  const frameworks = [
    {
      value: 'next.js',
      label: 'Next.js',
    },
    {
      value: 'sveltekit',
      label: 'SvelteKit',
    },
    {
      value: 'nuxt.js',
      label: 'Nuxt.js',
    },
    {
      value: 'remix',
      label: 'Remix',
    },
    {
      value: 'astro',
      label: 'Astro',
    },
  ]
  return (
    <Layout>
      <Popover_Shadcn_ open={open} onOpenChange={setOpen}>
        <PopoverTrigger_Shadcn_ asChild>
          <Button
            type="default"
            role="combobox"
            aria-expanded={open}
            className="w-[200px] justify-between m-10"
            iconRight={<ChevronUpIcon className="h-4 w-4 shrink-0 opacity-50" />}
          >
            {value
              ? frameworks.find((framework) => framework.value === value)?.label
              : 'Select framework...'}
          </Button>
        </PopoverTrigger_Shadcn_>
        <PopoverContent_Shadcn_ className="w-[200px] p-0" side="bottom">
          <Command_Shadcn_>
            <CommandInput_Shadcn_
              placeholder="Search framework..."
              className="border-none ring-0"
            />
            <CommandEmpty_Shadcn_>No framework found.</CommandEmpty_Shadcn_>
            <CommandGroup_Shadcn_>
              {frameworks.map((framework) => (
                <CommandItem_Shadcn_
                  key={framework.value}
                  onSelect={(currentValue) => {
                    setValue(currentValue === value ? '' : currentValue)
                    setOpen(false)
                  }}
                >
                  <CheckCircleIcon
                    className={cn(
                      'mr-2 h-4 w-4',
                      value === framework.value ? 'opacity-100' : 'opacity-0'
                    )}
                  />
                  {framework.label}
                </CommandItem_Shadcn_>
              ))}
            </CommandGroup_Shadcn_>
          </Command_Shadcn_>
        </PopoverContent_Shadcn_>
      </Popover_Shadcn_>

      <Hero />
      <Features />
      <BackedBy className="pt-8 sm:pb-18 pb-16 md:pb-24 lg:pb-24" />
      <TwitterSocialSection />
      <BuiltExamples />
      <MadeForDevelopers />
      <AdminAccess />
      <CustomerStories customerStories={customerStories} />
      <CTABanner />
    </Layout>
  )
}

export async function getStaticProps() {
  const customerStories = getSortedPosts('_customers', 3)

  return {
    props: {
      customerStories,
    },
  }
}

export default Index
