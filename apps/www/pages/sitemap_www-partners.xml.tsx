import {NextPageContext} from 'next'
import React from 'react'
import supabase from '~/lib/supabase'

class Sitemap extends React.Component {
  static async getInitialProps({res}: NextPageContext) {
    res!.setHeader('Content-Type', 'text/xml')

    const { data: slugs } = await supabase.from('partners').select('slug,type')

    let sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n`

    sitemap += `  <urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n`
    
    if (slugs && slugs.length > 0) {
      slugs.forEach(({slug, type}) => {
        sitemap += `<url>\n`
        sitemap += `  <loc>https://supabase.com/partners/${type === "expert" ? "experts" : "integrations"}/${slug}</loc>\n`
        sitemap += `  <changefreq>weekly</changefreq>\n`
        sitemap += `  <changefreq>0.5</changefreq>\n`
        sitemap += `</url>\n`
      })
    }

    sitemap += `</urlset>`

    res!.write(sitemap)
    res!.end()
  }
}
 
export default Sitemap