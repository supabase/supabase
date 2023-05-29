import { NextSeo } from 'next-seo'
import { useRouter } from 'next/router'
import DefaultLayout from '~/components/Layouts/Default'
import CommunitySlider from '~/components/Sections/CommunitySlider'
import ProductHeaderCentered from '~/components/Sections/ProductHeaderCentered'
import FeaturesSection from '~/components/Sections/FeaturesSection'
import HighlightCards from '~/components/Sections/HighlightCards'
import UseCasesSection from '~/components/Sections/UseCasesSection'
import CenteredTitleImage from '~/components/Sections/CenteredTitleImage'
import TimedTabsSection from '~/components/Sections/TimedTabsSection'
import ProductsCta from '~/components/Sections/ProductsCta'
import EnterpriseCta from '~/components/Sections/EnterpriseCta'

import { pageData } from '~/data/products/vector/page'

import 'swiper/swiper.min.css'

function VectorPage() {
  // base path for images
  const { basePath } = useRouter()
  const meta_title = 'Vector | The open source vector database for AI applications'
  const meta_description =
    'Integrate Supabase Vector database with your favorite ML-models to store, index and access vector embeddings for any AI use case.'

  return (
    <>
      <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/vector`,
          images: [
            {
              url: `https://supabase.com${basePath}/images/vector/og.jpg`,
            },
          ],
        }}
      />
      <DefaultLayout className="bg-scale-100">
        <ProductHeaderCentered {...pageData.heroSection} />
        <HighlightCards {...pageData.highlightsSection} />
        <CenteredTitleImage {...pageData.integrations} />
        <TimedTabsSection {...pageData.APIsection} />
        <UseCasesSection {...pageData.useCasesSection} />
        <FeaturesSection {...pageData.featuresSection} />
        <CommunitySlider />
        <EnterpriseCta />
        <div className="bg-scale-200">
          <div className="w-full h-[1px] bg-gradient-to-r from-scale-100 via-scale-500 dark:via-scale-600 to-scale-100" />
          <ProductsCta />
        </div>
      </DefaultLayout>
    </>
  )
}

export default VectorPage
