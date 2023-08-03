import { useEffect, useRef, useState } from 'react'
import Image from 'next/image'
import { useRouter } from 'next/router'
import Link from 'next/link'
import { useWindowSize } from 'react-use'

import TweetCard from '~/components/TweetCard'
import { Swiper, SwiperSlide } from 'swiper/react'
import SwiperCore, { Autoplay } from 'swiper'

import 'swiper/swiper.min.css'
import SectionContainer from '../Layouts/SectionContainer'
import { useBreakpoint } from 'common'

SwiperCore.use([Autoplay])

interface CardInterface {
  type: 'twitter' | 'customer-story'
  avatar?: string
  author: string
  role?: string
  quote: string | React.ReactNode
  abstract?: string
  image?: string
  url?: string
  logo?: string
  customer?: string
}

const vectorImagesDir = '/images/product/vector/community/'

const cards: CardInterface[] = [
  {
    type: 'twitter',
    avatar: '',
    author: 'Yasser',
    quote:
      '@kiwicopple @supabase @PostgreSQL @OpenAI Adding vector embeddings support to @Supabase is awesome. Glad I built https://t.co/jnCYOLa4iK on supabase.',
  },
  {
    type: 'customer-story',
    avatar: '',
    customer: 'Markprompt',
    author: 'Michael Fester',
    role: 'Co-Founder, Markprompt',
    quote:
      'We decided to use Supabase over other specialized vector databases because it enabled us to be GDPR compliant from day one with little effort.',
    image: vectorImagesDir + 'supabase+mendable.svg',
    abstract: 'Markprompt and Supabase - GDPR-Compliant AI Chatbots for Docs and Websites.',
    url: '/customers/markprompt',
  },
  {
    type: 'customer-story',
    avatar: '',
    customer: 'Mendable',
    author: 'Caleb Peffer',
    role: 'CEO, Mendable',
    quote:
      'We tried other vector databases - we tried Faiss, we tried Weaviate, we tried Pinecone. We found them to be incredibly expensive and not very intuitive. If you’re just doing vector search they’re great, but if you need to store a bunch of metadata that becomes a huge pain.',
    image: vectorImagesDir + 'supabase+markprompt.svg',
    abstract: 'Mendable switches from Pinecone to Supabase for PostgreSQL vector embeddings.',
    url: '/customers/mendable',
  },
  {
    type: 'twitter',
    avatar: '',
    author: 'Batuhan',
    quote: (
      <>
        To create long-term memory for your ChatGPT application you can use @supabase vector
        database.
        <br />
        You can fix two common problems with this method:
        <br />
        Global Memory Token Size Limit Handling
      </>
    ),
  },
]

const CommunitySlider = () => {
  const ref = useRef<any>(null)
  const isSm = useBreakpoint(768)
  const { basePath } = useRouter()
  const [swiperInstance, setSwiperInstance] = useState<SwiperCore | any | null>(null)
  const { width } = useWindowSize()

  useEffect(() => {
    // trigger autoplay if viewport resize
    if (swiperInstance) swiperInstance?.autoplay?.start()
  }, [width])

  useEffect(() => {
    if (!ref.current || !swiperInstance?.autoplay) return

    ref.current?.addEventListener('mouseover', () => swiperInstance?.autoplay?.stop())
    ref.current?.addEventListener('mouseleave', () => swiperInstance?.autoplay?.start())

    return () => {
      ref.current?.removeEventListener('mouseover', () => swiperInstance?.autoplay?.stop())
      ref.current?.removeEventListener('mouseleave', () => swiperInstance?.autoplay?.start())
    }
  }, [ref.current, swiperInstance?.autoplay])

  const Card = (card: CardInterface) => (
    <div className="dark:bg-scale-300 hover:border-scale-600 hover:dark:border-scale-700 border-scale-300 dark:border-scale-400 rounded-2xl border bg-white p-6 drop-shadow-sm flex flex-col gap-4">
      <div className="flex items-center gap-2">
        <div className="h-10 w-10 overflow-hidden rounded-full border dark:border-gray-600">
          <Image src={card.avatar!} layout="responsive" width="64" height="64" alt={card.author} />
        </div>
        <div>
          <p className="text-scale-1200 font-medium">{card.author}</p>
          <p className="text-scale-900 text-sm">{card.role}</p>
        </div>
      </div>

      <p className="text-scale-900 mt-2 text-base">{card.quote}</p>

      <div className="mt-3 pt-3 border-t">
        <div className="relative h-10">
          <Image
            src={card.image!}
            alt={`Supabase + ${card.customer}`}
            layout="fill"
            objectFit="contain"
            objectPosition="left"
          />
        </div>
      </div>
      <p className="text-scale-900 my-3 text-base">{card.abstract}</p>

      {card.url && (
        <div className="text-brand block cursor-pointer text-sm">Read Customer Story</div>
      )}
    </div>
  )

  return (
    <div className="py-16 sm:py-18 md:py-24 bg-scale-100">
      <div className="relative h-[300px] w-screen mx-auto md:w-full -mb-32 z-0">
        <Image
          src="/images/product/vector/community/vector-community.svg"
          alt="vector graphic"
          layout="fill"
          objectFit={isSm ? 'cover' : 'contain'}
        />
      </div>
      <SectionContainer className="!py-0">
        <div className="col-span-12 text-center relative z-10">
          <h3 className="text-3xl md:text-4xl heading-gradient">
            Join a growing <br />
            community of users
          </h3>
        </div>
      </SectionContainer>

      <div ref={ref} className="relative mx-auto pt-16 pb-0 swiper-transition-linear">
        <Swiper
          onSwiper={(swiper) => setSwiperInstance(swiper)}
          centeredSlides={true}
          spaceBetween={30}
          slidesPerView={3}
          speed={13000}
          loop={true}
          watchOverflow
          threshold={2}
          updateOnWindowResize
          allowTouchMove={false}
          autoplay={{
            delay: 0,
            disableOnInteraction: true,
            reverseDirection: false,
          }}
          breakpoints={{
            320: {
              slidesPerView: 1.5,
              spaceBetween: 10,
            },
            720: {
              slidesPerView: 2.5,
              spaceBetween: 20,
            },
            1280: {
              slidesPerView: 4,
              spaceBetween: 30,
            },
            1700: {
              slidesPerView: 5,
              spaceBetween: 30,
            },
            2100: {
              slidesPerView: 6,
              spaceBetween: 30,
            },
          }}
        >
          {cards.map((card, i) => (
            <SwiperSlide key={card.author}>
              {card.type === 'twitter' ? (
                <TweetCard
                  handle={`@${card.author}`}
                  quote={card.quote}
                  img_url={`${basePath}${card.avatar}`}
                />
              ) : (
                <Link href={`${basePath}${card.url}`}>
                  <a>
                    <Card {...card} />
                  </a>
                </Link>
              )}
            </SwiperSlide>
          ))}
        </Swiper>
      </div>
    </div>
  )
}

export default CommunitySlider
