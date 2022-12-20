import providers from '../data/authProviders'
import ButtonCard from './ButtonCard'

export default function AuthProviders() {
  return (
    <div className="grid md:grid-cols-12 gap-4">
      {providers.map((x) => (
        <div key={x.name} className="col-span-6">
          <ButtonCard to={x.href} title={x.name}>
            <div className="px-6 py-4">
              <div className="flex justify-between">
                <p className="mt-0">{x.name}</p>
                <p className="mt-0">
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
          </ButtonCard>
        </div>
      ))}
    </div>
  )
}
