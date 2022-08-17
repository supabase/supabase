import { useEffect, useState } from 'react'
import Link from 'next/link'

const Positions = () => {
  const [data, setData]: any = useState('')

  useEffect(() => {
    fetch('https://boards-api.greenhouse.io/v1/boards/supabase/jobs/')
      .then((res) => res.json())
      .then((data) => setData(data))
  }, [])

  return (
    <section className="positions" id="positions">
      <div>
        <div className="space-y-6">
          <h1 className="text-4xl font-semibold">Open positions</h1>
          <div className="space-y-6">
           {data.jobs?.map((job: any, i: number) => {
               return (
                <div key={i}>
                  <Link href={`career/job/${job.id}`}>
                    <a>
                      <div className="px-6 py-4 border-2 border-white hover:border-brand-900 rounded-lg shadow hover:shadow-lg">
                        <div>{job.title}</div>
                        <div>{job.location.name}</div>
                      </div>
                    </a>
                  </Link>
                </div>
               )
             })} 
          </div>
        </div>
      </div>
    </section>
  )
}

export default Positions
