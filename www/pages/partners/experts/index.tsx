import { createClient } from '@supabase/supabase-js'
import { IconArrowRight, IconSearch, Input, Select } from '@supabase/ui'
import { NextSeo } from 'next-seo'
import Link from 'next/link'
import { useRouter } from 'next/router'
import DefaultLayout from '~/components/Layouts/Default'
import SectionContainer from '~/components/Layouts/SectionContainer'
import BecomeAPartner from '~/components/Partners/BecomeAPartners'
import { Partner } from '~/types/partners'
import TileGrid from '../../../components/Partners/TileGrid'

const supabase = createClient(
  'https://obuldanrptloktxcffvn.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJyb2xlIjoiYW5vbiIsImlhdCI6MTYzNzY1NjAxNSwiZXhwIjoxOTUzMjMyMDE1fQ.0sfp_Njf7l4g-nOCF5a1TQE11rPqtz8Y10uctIetkBA'
)

export async function getStaticProps() {
  const { data: partners } = await supabase
    .from<Partner>('partners')
    .select('*')
    .eq('approved', true)
    .eq('type', 'expert')
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

function ExpertPartnersPage(props: Props) {
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
          url: `https://supabase.com/partners/experts`,
          images: [
            {
              url: `https://supabase.com${router.basePath}/images/product/database/database-og.jpg`, // TODO
            },
          ],
        }}
      />
      <DefaultLayout>
        <SectionContainer className="space-y-12">
          {/* Horizontal link menu */}
          <div className="flex flex-col items-start justify-between w-full space-y-3 md:space-y-0 md:flex-row md:items-center">
            <h3 className="h3" style={{ marginBottom: 0 }}>
              Partners
            </h3>

            <div className="flex flex-col space-y-1 sm:flex-row sm:space-y-0 sm:space-x-6">
              <Link href={`/partners/integrations`}>
                <a className="transition-colors text-brand-900 hover:text-brand-800">
                  INTEGRATIONS
                </a>
              </Link>
              <Link href={`/partners/experts`}>
                <a className="text-scale-1200">EXPERTS</a>
              </Link>
              <Link href={`/partners/integrations#become-a-partner`}>
                <a className="flex items-center space-x-1 transition-colors text-brand-900 hover:text-brand-800">
                  BECOME A PARTNER <IconArrowRight />
                </a>
              </Link>
            </div>
          </div>

          {/* Title */}
          <h1 className="text-center h1">Find an Expert</h1>

          {/* Search Bar */}
          <div className="w-full space-y-3 md:space-y-0 md:flex md:space-x-6">
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
              {Object.keys(partnersByCategory).map((category) => (
                <option key={category} value={category.toLowerCase()}>
                  {category}
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
              <h2 className="h2">No Partners Found</h2>
            )}
          </div>

          {/* Become a partner form */}
          <BecomeAPartner supabase={supabase} />
        </SectionContainer>
      </DefaultLayout>
    </>
  )
}

export default ExpertPartnersPage
