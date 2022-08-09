const data = [
  {
    icon: '',
    title: 'Fully Remote',
    description:
      'Supabase is a 100% remote company. We hire globally. We believe you can do your best work from anywhere. There are no Supabase offices, we provide a WeWork membership if you’d need it.',
  },
  {
    icon: '',
    title: 'Open Source Community',
    description:
      'Open Source is not just a type of software development, it is our culture. We support existing open source communities and tools to make them better.',
  },
  {
    icon: '',
    title: 'Health benefits',
    description:
      'We provide 100% health coverage for employees and 80% for dependants. It’s important to us that you & your family have health care covered.',
  },
  {
    icon: '',
    title: 'Work Flexibly',
    description:
      'Set your own schedule to keep your personal and professional worlds perfectly in sync. We work in teams, but we work asynchronous. You know what you need to do and when it needs to be done.',
  },
  {
    icon: '',
    title: 'Flexible Time-off',
    description:
      'Prioritize doing the things you love outside of work. We have a generous time off policy to allow you to take time away from work when you need it.',
  },
  {
    icon: '',
    title: 'Tech allowance',
    description:
      'We provide everyone with a $4250 USD allowance every 3 years. This can be spent on anything needed to set up to your work environment, including tech.',
  },
  {
    icon: '',
    title: 'Annual off-sites',
    description:
      'We believe in the value of in-person time. We all come together for a week a year, somewhere different in the world. It’s the highlight of our annual calendar!',
  },
  {
    icon: '',
    title: 'Professional Development',
    description:
      'We provide everyone an annual allowance to spend on professional development and education. Use this for courses, books or anything that supports your continued learning.',
  },
]

const Join = () => {
  return (
    <section className="join" id="join">
      <div className="md:mx-10">
        <h1 className="text-center text-xl font-bold">Why join Supabase</h1>
        <div className="mt-4 space-y-4 md:grid md:grid-cols-2 md:gap-4">
          {data.map((data: any, i: number) => {
            return (
              <div
                key={i}
                className="hover:border-brand-900 rounded-lg border-2 border-white p-4 transition hover:scale-105 md:m-0"
              >
                <h1 className="text-md font-semibold">{data.title}</h1>
                <p>{data.description}</p>
              </div>
            )
          })}
        </div>
      </div>
    </section>
  )
}

export default Join
