import ReactMarkdown from 'react-markdown'
import { IconCheck } from '@supabase/ui'

const data = [
  {
    text: 'We are **goal-driven** and **dedicated**',
  },
  {
    text: 'We **use our own tools** every day',
  },
  {
    text: 'We thrive together with **our community**',
  },
  {
    text: 'We are **customer obsessed**',
  },
  {
    text: 'We believe in **peoples ability to grow**',
  },
]

const Culture = () => {
  return (
    <section className="culture" id="culture">
      <div className="justify-between md:mx-10 md:flex">
        <div className="mb-8 w-auto space-y-2 md:mb-0">
          <div className="text-brand-900 mx-auto w-fit text-xs uppercase md:mx-0">Our Culture</div>
          <h2 className="mx-auto text-center sm:w-2/3 md:mx-0 md:text-left md:text-xl">
            We base our philosophy on the principles of learning, collaboration, transparency,
            experimentation and passion.
          </h2>
        </div>
        <div className="min-w-max space-y-4">
          {data.map((data: any, i: number) => (
            <div key={i} className="flex items-center space-x-2">
              <div className="bg-brand-900 rounded-full p-3 text-white">
                <IconCheck size={14} strokeWidth={2} />
              </div>
              <ReactMarkdown className="text-scale-1200 text-sm">{data.text}</ReactMarkdown>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export default Culture
