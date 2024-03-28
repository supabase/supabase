import { useState } from 'react'
import { NextPage } from 'next'
import { NextSeo } from 'next-seo'
import DefaultLayout from '~/components/Layouts/Default'
import { Button, Input } from 'ui'
import { TextArea } from '@ui/components/shadcn/ui/text-area'

export const getServerSideProps = async (context: any) => {
  const id = context.params!.id
  const response = await fetch(
    `https://boards-api.greenhouse.io/v1/boards/supabase/jobs/${id}?questions=true`
  )
  const data = await response.json()
  return { props: { data } }
}

const Job: NextPage = ({ data }: any) => {
  const meta_title = 'Careers | Supabase'
  const meta_description = 'Help build software developers love'

  const [formData, setFormData] = useState({})

  const handleTextFormData = (question: string, value: string) => {
    setFormData({ ...formData, [question]: value })
  }

  const handleFileFormData = (question: string, value: any) => {
    setFormData({ ...formData, [question]: value })
  }

  function decodeHtml(html: string): string {
    const entityMap: Record<string, string> = {
      '&amp;': '&',
      '&lt;': '<',
      '&gt;': '>',
      '&quot;': '"',
      '&#39;': "'",
      '&#x2F;': '/',
      '&#x60;': '`',
      '&#x3D;': '=',
    }

    return html.replace(/&[^\s;]+;/g, (match) => {
      return entityMap[match] || match
    })
  }

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
      <DefaultLayout>
        <div className="container relative mx-auto px-6 py-10 lg:pt-12 lg:px-16 xl:px-20 text-center space-y-4">
          <h1 className="text-sm text-brand md:text-base">{data.location.name}</h1>
          <h2 className="text-3xl md:text-4xl xl:text-5xl lg:max-w-2xl xl:max-w-3xl lg:mx-auto tracking-[-1.5px]">
            {data.title}
          </h2>
          <a href="#application">
            <Button className="text-white xl:text-sm mt-4">Apply Now</Button>
          </a>
        </div>
        <div className="container mx-auto px-6 py-10 lg:pt-12 lg:px-16 xl:px-20 space-y-10">
          <iframe
            title="Who we hire at Supabase"
            className="w-full rounded-md aspect-video"
            src="https://www.youtube-nocookie.com/embed/-BG9XptyCKI?si=28Yk9yYRrEhdQJ0k"
            allow="autoplay; modestbranding; encrypted-media"
            allowFullScreen
          />
          <div
            className="application"
            dangerouslySetInnerHTML={{ __html: decodeHtml(data.content) }}
          />
        </div>
        <div
          id="application"
          className="container mx-auto px-6 py-10 lg:pt-12 lg:px-16 xl:px-20 space-y-10"
        >
          <div className="flex items-center justify-between">
            <h2 className="text-2xl">Apply for this Job</h2>
            <div className="space-x-1 text-sm">
              <span className="text-red-900">*</span>
              <span className="text-foreground-light">Required</span>
            </div>
          </div>
          <div className="space-y-4">
            {data.questions.map((question: any) =>
              question.fields.map((item: any, i: number) => {
                if (item.type == 'input_text') {
                  return (
                    <Input
                      key={i}
                      label={
                        <div>
                          {question.label}
                          {question.required ? <span className="ml-1 text-red-900">*</span> : null}
                        </div>
                      }
                      onChange={(e) => handleTextFormData(item.name, e.target.value)}
                      required={question.required}
                    />
                  )
                }
                if (item.type == 'input_file') {
                  return (
                    <Input
                      key={i}
                      label={
                        <div>
                          {question.label}
                          {question.required ? <span className="ml-1 text-red-900">*</span> : null}
                        </div>
                      }
                      onChange={(e) => handleFileFormData(item.name, e.target.files[0])}
                      type="file"
                      required={question.required}
                    />
                  )
                }
                if (item.type == 'textarea') {
                  return (
                    <div>
                      <div className="block text-foreground-light text-sm mb-2">
                        {question.label}
                        {question.required ? <span className="ml-1 text-red-900">*</span> : null}
                      </div>
                      <TextArea
                        key={i}
                        onChange={(e) => handleTextFormData(item.name, e.target.value)}
                      />
                    </div>
                  )
                }
              })
            )}
            <div className="!mt-8">
              <Button size="medium">Submit Application</Button>
            </div>
          </div>
        </div>
      </DefaultLayout>
    </>
  )
}

export default Job
