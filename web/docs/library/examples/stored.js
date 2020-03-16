/**
 * stored-procedures.mdx examples
 */

export const storedSingleJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

const echoCity = async () => {
    try{
        let city = await supabase
            .rpc('echo_city', { name: 'The Shire' })
        return cities
    } catch (error) {
        console.log('Error: ', error)
    }
}
`

export const storedBulkJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

const echoCities = async () => {
    try{
        let cities = await supabase
            .rpc('echo_city', [
                { name: 'The Shire' },
                { name: 'Mordor' }
            ])
        return cities
    } catch (error) {
        console.log('Error: ', error)
    }
}
`

export const storedReadingJs = `
import { createClient } from '@supabase/supabase-js'

const supabase = createClient('https://world.supabase.co', '1a2b-3c4d-5e6f-7g8h')

const echoCities = async () => {
    try{
        let cities = await supabase
            .rpc('asian_pacific_countries')
        return cities
    } catch (error) {
        console.log('Error: ', error)
    }
}
`
