import { Typography, Tabs } from '@supabase/ui'
import { NextSeo } from 'next-seo'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/router'
import { useState } from 'react'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import TileGrid from './TileGrid'

interface Partner {
  title: string
  size: string
  source: string
}

export async function getStaticProps() {
  const res = await fetch('https://example.com')
  console.log(res.status)
  // TODO fetch from DB
  const partners: Partner[] = [
    {
      title: 'IMG_4985.HEIC',
      size: '3.9 MB',
      source:
        'https://images.unsplash.com/photo-1582053433976-25c00369fc93?ixid=MXwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHw%3D&ixlib=rb-1.2.1&auto=format&fit=crop&w=512&q=80',
    },
    // More files...
  ]

  return {
    props: {
      partners,
    },
    revalidate: 3600, // In seconds
  }
}

interface Props {
  partners: Partner[]
}

function PartnerPage(props: Props) {
  const { partners } = props
  // base path for images
  const { basePath } = useRouter()

  const [tabId, setTabId] = useState('integrations')

  const meta_title = 'Works with Supabase'
  const meta_description = `Find Integration Partners and Expert Services that work with Supabase.`

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/partners`,
          images: [
            {
              url: `https://supabase.com${basePath}/images/product/database/database-og.jpg`, // TODO
            },
          ],
        }}
      />
      <DefaultLayout>
        <SectionContainer>
          <Typography.Title className="text-center">{`Find an ${
            tabId === 'integrations' ? 'Integration' : 'Expert'
          }`}</Typography.Title>
          <div className="grid">
            <div className={'dashboard-tabs sbui-tabs--underline-alt'}>
              <Tabs
                size="xlarge"
                activeId={tabId}
                onChange={setTabId}
                type="underlined"
                tabBarStyle={{
                  marginBottom: 0,
                  // borderBottom: '1px solid #dedede',
                }}
                // block
              >
                <Tabs.Panel id="integrations" label="Integrations">
                  {partners ? <TileGrid category={tabId} partners={partners} /> : ''}
                </Tabs.Panel>
                <Tabs.Panel id="experts" label="Experts">
                  {partners ? <TileGrid category={tabId} partners={partners} /> : ''}
                </Tabs.Panel>
              </Tabs>
            </div>
          </div>
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

export default PartnerPage
