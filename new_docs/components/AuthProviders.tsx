import data from '../data'
import Link from 'next/link'
import { Card } from '@supabase/ui'

export default function AuthProviders() {
  return (
    <div className="container" style={{ padding: 0 }}>
      <div className="row is-multiline">
        {data.providers.map((x: any) => (
          <div key={x.name} className="col col--6">
            <Link href={x.href} passHref>
              <Card hoverable>
                <div className="card__body">
                  <div
                    className=""
                    style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}
                  >
                    {x.logo && <img src={x.logo} alt={x.name} width="20" />}
                    <p>{x.name}</p>
                    <p>
                      {x.official ? (
                        <span className={`badge badge--official`}>Official</span>
                      ) : (
                        <span className={`badge badge--unofficial`}>Unofficial</span>
                      )}
                    </p>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                    <div
                      className="code-block"
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.7rem',
                      }}
                    >
                      <span>Platform:</span>
                      <span>{x.platform.toString()}</span>
                    </div>
                    <div
                      className="code-block"
                      style={{
                        width: '100%',
                        display: 'flex',
                        justifyContent: 'space-between',
                        fontSize: '0.7rem',
                      }}
                    >
                      <span>Self-Hosted:</span>
                      <span>{x.selfHosted.toString()}</span>
                    </div>
                  </div>
                </div>
              </Card>
            </Link>
          </div>
        ))}
      </div>
    </div>
  )
}
