import { NextPage } from "next"
import { NextSeo } from 'next-seo'

export const getServerSideProps = (context: any) => {
  const params = context.params
  return { props: { id: params!.id } }
}

const Job: NextPage = ({ id }: any) => {
  const meta_title = 'Careers | Supabase'
  const meta_description = 'Help build software developers love'

  return (
    <>
    <NextSeo
        title={meta_title}
        description={meta_description}
        openGraph={{
          title: meta_title,
          description: meta_description,
          url: `https://supabase.com/careers`,
          // images: [
          //   {
          //     url: `https://supabase.com${basePath}/images/career/careers_og.jpg`,
          //   },
          // ],
        }}
      />
    <div>{id}</div>
    </>
  )
}

export default Job
