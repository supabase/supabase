import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react';
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live'

export default class Index extends React.Component {
  render() {
    const code = `
    function World() {
      const [countries, setCountries] = useState(<div>Hello wordl</div>);

      getCountries = async function() {
        this.supabase = createClient('https://world.supabase.co', 'FkGhDLmT3V')

        let countries = await this.supabase
          .from('countries')
          .select("*")
      
        const countryNames = countries.body.map(country => <li key={country.name}>{country.name}</li>)

        setCountries(countryNames);
      }

      useEffect(() => {
        getCountries();
      }, []);

      return (
        <div>
          Hello
          {countries}
        </div>
      )

    }
    `

    return (
      <LiveProvider code={code} scope={{createClient, useState, useEffect}}>
        <LiveEditor />
        <LiveError />
        <LivePreview />
      </LiveProvider>
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
