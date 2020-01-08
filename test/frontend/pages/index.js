import { createClient } from '@supabase/supabase-js'

export default class Index extends React.Component {
  constructor() {
    super()
    this.supabase = createClient("http://localhost:8000/rest/v0", "")
  }
  componentDidMount() {
    this.loadData()
  }

  async loadData() {
    let countries = await this.supabase.get('countries')
    console.log('Here are the list of countries: ', countries)
  }

  render() {
    return (
      <div style={styles.main}>
        <h1>Test Suite</h1>
        <br/>
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
