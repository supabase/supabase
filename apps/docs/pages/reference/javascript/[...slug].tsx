import { MDXRemote } from 'next-mdx-remote'
import { useRouter } from 'next/router'
import { useEffect } from 'react'
import clientLibsCommonSections from '~/../../spec/common-client-libs-sections.json'
import typeSpec from '~/../../spec/enrichments/tsdoc_v2/combined.json'
// @ts-expect-error
import spec from '~/../../spec/supabase_js_v2_temp_new_shape.yml' assert { type: 'yml' }
import components from '~/components'
import RefEducationSection from '~/components/reference/RefEducationSection'
import RefFunctionSection from '~/components/reference/RefFunctionSection'
import OldLayout from '~/layouts/Default'
import { getAllDocs } from '~/lib/docs'
import { flattenSections } from '~/lib/helpers'
import generateOldRefMarkdown from '~/lib/mdx/generateOldRefMarkdown'
import generateRefMarkdown from '~/lib/mdx/generateRefMarkdown'

const sections = flattenSections(clientLibsCommonSections)

export default function JSReference(props) {
  // console.log('docs', props.docs)
  const router = useRouter()

  const slug = router.query.slug[0]

  const isNewDocs = process.env.NEXT_PUBLIC_NEW_DOCS === 'true'

  // When user lands on a url like http://supabase.com/docs/reference/javascript/sign-up
  // find the #sign-up element and scroll to that
  useEffect(() => {
    if (isNewDocs && document && slug !== 'start') {
      document.querySelector(`#${slug}`) && document.querySelector(`#${slug}`).scrollIntoView()
    }
  })

  /*
   * handle old ref pages
   */
  if (!isNewDocs) {
    return (
      // @ts-ignore
      <OldLayout meta={props.meta} toc={props.toc}>
        <MDXRemote {...props.content} components={components} />
      </OldLayout>
    )
  }

  return (
    <>
      {sections.map((x) => {
        switch (x.isFunc) {
          case false:
            const markdownData = props.docs.find((doc) => doc.id === x.id)
            console.log(markdownData)

            return <RefEducationSection item={x} markdownContent={markdownData} />
            break

          default:
            return (
              <RefFunctionSection funcData={x} commonFuncData={x} spec={spec} typeSpec={typeSpec} />
            )
            break
        }
      })}
    </>
  )
}

export async function getStaticProps({ params }: { params: { slug: string[] } }) {
  let markdownContent = await generateRefMarkdown(sections, '/js')

  console.log(markdownContent)

  /*
   * old content generation
   * this is for grabbing to old markdown files
   */

  let slug
  if (params.slug.length > 1) {
    slug = `docs/reference/javascript/${params.slug.join('/')}`
  } else {
    slug = `docs/reference/javascript/${params.slug[0]}`
  }

  /*
   * handle old ref pages
   */
  if (process.env.NEXT_PUBLIC_NEW_DOCS === 'false') {
    return await generateOldRefMarkdown(slug)
  } else {
    return {
      props: {
        docs: markdownContent,
      },
    }
  }
}

export function getStaticPaths() {
  let docs = getAllDocs()

  return {
    paths: docs.map(() => {
      return {
        params: {
          slug: docs.map((d) => d.slug),
        },
      }
    }),
    fallback: 'blocking',
  }
}

export const config = {
  unstable_includeFiles: ['node_modules/**/shiki/**/*.json'],
}
