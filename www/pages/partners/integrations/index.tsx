import { createClient } from '@supabase/supabase-js'
import Link from 'next/link'
import { Typography, IconArrowRight, Input, IconSearch, Select } from '@supabase/ui'
import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import { Partner } from '~/types/partners'
import TileGrid from '../../../components/Partners/TileGrid'
import BecomeAPartner from '~/components/Partners/BecomeAPartners'

const supabase = createClient(
  'https://obuldanrptloktxcffvn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNzY1NjAxNSwiZXhwIjoxOTUzMjMyMDE1fQ.0sfp_Njf7l4g-nOCF5a1TQE11rPqtz8Y10uctIetkBA'
)

export async function getStaticProps() {
  const { data: partners } = await supabase
    .from<Partner>('partners')
    .select('*')
    .eq('approved', true)
    .eq('type', 'technology')
    .order('category')
    .order('title')

  return {
    props: {
      partners,
    },
    revalidate: 18000, // In seconds - refresh every 5 hours
  }
}

interface Props {
  partners: Partner[]
}

function IntegrationPartnersPage(props: Props) {
  const { partners } = props
  const partnersByCategory: { [category: string]: Partner[] } = {}
  partners.map(
    (p) => (partnersByCategory[p.category] = [...(partnersByCategory[p.category] ?? []), p])
  )
  const router = useRouter()

  const meta_title = 'Works With Supabase'
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
              url: `https://supabase.com${router.basePath}/images/product/database/database-og.jpg`, // TODO
            },
          ],
        }}
      />
      <DefaultLayout>
        <SectionContainer>
          {/* Horizontal link menu */}
          <div className="w-full flex justify-between">
            <Typography.Title level={3}>Partners</Typography.Title>
            <div className="flex space-x-6">
              <Link href={`/partners/integrations`}>
                <a>
                  <Typography.Title level={5}>INTEGRATIONS</Typography.Title>
                </a>
              </Link>
              <Link href={`/partners/experts`}>
                <a>
                  <Typography.Title level={5}>
                    <span className="text-brand-700 hover:text-brand-800">EXPERTS</span>
                  </Typography.Title>
                </a>
              </Link>
              <Link href={`/partners/integrations#become-a-partner`}>
                <a className="text-brand-700 hover:text-brand-800">
                  <Typography.Title level={5}>
                    <span className="flex text-brand-700 hover:text-brand-800">
                      BECOME A PARTNER <IconArrowRight />
                    </span>
                  </Typography.Title>
                </a>
              </Link>
            </div>
          </div>
          {/* Title */}
          <Typography.Title className="text-center">Find an Integration</Typography.Title>
          {/* Search Bar */}
          <div className="w-full md:flex md:space-x-6">
            <Input
              icon={<IconSearch />}
              placeholder="Search all partners"
              type="text"
              className="md:w-1/2"
            />
            <Select
              className="font-sans md:w-1/2"
              onChange={(e) => {
                router.push(`#${e.target.value}`)
              }}
            >
              <option value="" disabled selected>
                Category
              </option>
              {Object.keys(partnersByCategory).map((cat) => (
                <option value={cat.toLowerCase()} key={cat}>
                  {cat}
                </option>
              ))}
              <option value="become-a-partner">Become a partner</option>
            </Select>
          </div>
          {/* Partner Tiles */}
          <div className="grid">
            {partners.length ? (
              <TileGrid partnersByCategory={partnersByCategory} />
            ) : (
              <Typography.Title level={2}>Coming Soon...</Typography.Title>
            )}
          </div>
          {/* Become a partner form */}
          <BecomeAPartner supabase={supabase} />
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

export default IntegrationPartnersPage
