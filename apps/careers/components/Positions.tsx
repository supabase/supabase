import Link from 'next/link'

const Positions = () => {
  return (
    <section className="positions" id="positions">
      <div>
        <div className="space-y-6">
          <h1>Open positions</h1>
          <div>
            <Link href="https://boards.greenhouse.io/supabase">
              <a>View Open Positions</a>
            </Link>
          </div>
        </div>
        <div className="mt-6 space-y-6">
          <h1>Internships</h1>
          <div>
            <Link href="https://boards.greenhouse.io/supabase">
              <a>View Open Internships</a>
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}

export default Positions
