import { createClient } from '@supabase/supabase-js'
import { useState, useEffect } from 'react'
import { reactLiveHome } from '../utils//themes'
import { LiveProvider, LiveEditor, LiveError, LivePreview } from 'react-live'

export default class Index extends React.Component {
  render() {
    const code = `
    // I am live code -- edit me :)
    function World() {
      const [countries, setCountries] = useState();

      getCountries = async function() {
        this.supabase = createClient('https://world.supabase.co', 'bhiGUYVHdhui7H')

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
          {countries}
        </div>
      )
    }
    `

    return (
      <LiveProvider code={code} scope={{ createClient, useState, useEffect }} theme={reactLiveHome}>
        <h3>Live Editor:</h3>
        <LiveEditor style={{ backgroundColor: 'black' }} />
        <LiveError />
        <h3>Output:</h3>
        <LivePreview style={{ margin: '20px' }} />
      </LiveProvider>
    )
  }
}
