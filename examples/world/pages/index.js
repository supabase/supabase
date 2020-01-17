import { createClient } from '@supabase/supabase-js'

export default class Index extends React.Component {
  constructor() {
    super()
    this.supabase = createClient('https://world.supabase.co', 'FkGhDLmT3V')

    this.state = {
      countries : []
    }
  }

  async getCountries() {
    let countries = await this.supabase
      .from('countries')
      .select("*")
  
    this.setState({ countries: countries.body })
  }

  componentDidMount() {
    this.getCountries();
  }

  render() {
    const countryNames = []

    for (const country of this.state.countries) {
      countryNames.push(<li key={country.name}>{country.name}</li>)
    }

    return (
      <div style={styles.main}>
        {countryNames}
      </div>
    )
  }
}

const styles = {
  main: { fontFamily: 'monospace', padding: 30 },
  pre: {
    whiteSpace: 'pre',
    overflow: 'auto',
    background: '#333',
    maxHeight: 200,
    borderRadius: 6,
    padding: 5,
  },
  code: { display: 'block', wordWrap: 'normal', color: '#fff' },
}
