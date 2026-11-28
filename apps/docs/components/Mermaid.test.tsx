import { renderMermaidSVG } from 'beautiful-mermaid'
import { load } from 'cheerio'
import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'

import { Mermaid } from './Mermaid'

function renderChart(metadata = '') {
  return load(
    renderToStaticMarkup(<Mermaid chart={`flowchart TD\n${metadata}\nA[Client] --> B[Server]`} />)
  )
}

describe('Mermaid accessibility', () => {
  it('preserves charts without metadata', () => {
    const $ = renderChart()
    expect($('svg').attr('role')).toBeUndefined()
    expect($('svg').attr('aria-labelledby')).toBeUndefined()
    expect($('svg').attr('aria-describedby')).toBeUndefined()
    expect($('svg > title, svg > desc')).toHaveLength(0)
    expect(
      $('svg text')
        .toArray()
        .map((node) => $(node).text())
    ).toEqual(['Client', 'Server'])
  })

  it.each([
    ['accTitle: Client connection', 'title', 'aria-labelledby', 'Client connection'],
    ['accDescr: Client calls Server.', 'desc', 'aria-describedby', 'Client calls Server.'],
  ])('supports a single metadata field: %s', (metadata, element, attribute, text) => {
    const $ = renderChart(metadata)
    expect($('svg').attr('role')).toBe('img')
    expect($(`svg > ${element}`).text()).toBe(text)
    expect($('svg').attr(attribute)).toBe($(`svg > ${element}`).attr('id'))
    expect($('svg > title, svg > desc')).toHaveLength(1)
    const otherAttribute = element === 'title' ? 'aria-describedby' : 'aria-labelledby'
    expect($('svg').attr(otherAttribute)).toBeUndefined()
  })

  it.each([
    '  accTitle: Connection  \n  accDescr: Client calls Server.  ',
    'accTitle: Connection\naccDescr {\nClient calls Server.\n}',
    'accTitle: Connection\r\naccDescr { Client calls Server. }',
  ])('adds metadata without changing diagram layout: %s', (metadata) => {
    const $ = renderChart(metadata)
    const baseline = renderChart()
    expect($('svg > title').text()).toBe('Connection')
    expect($('svg > desc').text()).toBe('Client calls Server.')
    expect($('svg').attr('aria-labelledby')).toBe($('svg > title').attr('id'))
    expect($('svg').attr('aria-describedby')).toBe($('svg > desc').attr('id'))
    expect(
      $('svg text')
        .toArray()
        .map((node) => $(node).text())
    ).toEqual(['Client', 'Server'])
    expect($('svg').attr('viewBox')).toBe(baseline('svg').attr('viewBox'))
    expect($('svg path')).toHaveLength(baseline('svg path').length)
  })

  it('keeps multiline descriptions as text and escapes SVG markup', () => {
    const title = 'Client & Server <script>alert("test")</script>'
    const description = 'Client calls <Server>.\nServer responds with A & B.'
    const $ = renderChart(`accTitle: ${title}\naccDescr {\n${description}\n}`)
    expect($('svg > title').text()).toBe(title)
    expect($('svg > desc').text()).toBe(description)
    expect($('svg script, svg desc > *')).toHaveLength(0)
  })

  it('uses the last directive and omits empty fields', () => {
    const $ = renderChart(
      'accTitle: First\naccDescr: First\naccTitle: Last\naccDescr { Last description }'
    )
    expect($('svg > title')).toHaveLength(1)
    expect($('svg > title').text()).toBe('Last')
    expect($('svg > desc')).toHaveLength(1)
    expect($('svg > desc').text()).toBe('Last description')
    const empty = renderChart('accTitle: First\naccTitle: \naccDescr {\n }')
    expect(empty('svg > title, svg > desc')).toHaveLength(0)
    expect(empty('svg').attr('role')).toBeUndefined()
  })

  it('rejects an unterminated description block', () => {
    expect(() => renderChart('accDescr {\nClient calls Server.')).toThrow(
      'Unterminated Mermaid accDescr block'
    )
  })

  it('preserves comments and directive-like text in quoted labels', () => {
    const chart = `flowchart TD
%% accTitle: Ignored "
A["accTitle: A label"] --> B["A multiline label
accDescr: Still a label"]`
    const baseline = load(renderMermaidSVG(chart))
    const $ = load(renderToStaticMarkup(<Mermaid chart={`${chart}\naccTitle: Actual title`} />))
    expect($('svg > title').text()).toBe('Actual title')
    expect($('svg > desc')).toHaveLength(0)
    expect($('svg text').text()).toContain('accTitle: A label')
    expect($('svg text').text()).toBe(baseline('svg text').text())
  })

  it('keeps accessibility and arrow references valid across multiple diagrams', () => {
    const chart = 'flowchart TD\naccTitle: Connection\naccDescr: Client calls Server.\nA --> B'
    const $ = load(
      renderToStaticMarkup(
        <>
          <Mermaid chart={chart} />
          <Mermaid chart={chart} />
        </>
      )
    )
    const ids = $('[id]')
      .toArray()
      .map((node) => $(node).attr('id'))
    expect(new Set(ids).size).toBe(ids.length)
    $('svg').each((_, svg) => {
      expect($(svg).attr('aria-labelledby')).toBe($(svg).children('title').attr('id'))
      expect($(svg).attr('aria-describedby')).toBe($(svg).children('desc').attr('id'))
      const marker = $(svg).find('marker').first().attr('id')
      expect(marker).toBeTruthy()
      expect($(svg).find('[marker-end]').attr('marker-end')).toBe(`url(#${marker})`)
    })
  })
})
