var axios = require('axios')
var fs = require('fs')

const fetchAllEvents = (repo, totalStars) => {
  const MAX_PER_PAGE = 100
  const baseUrl =
    'https://api.github.com/repos/supabase/' + repo + '/stargazers?per_page=' + MAX_PER_PAGE

  //Start fetching every page of repos.
  const fetchPromises = [],
    pageCount = Math.ceil(totalStars / MAX_PER_PAGE)
  for (let pageI = 1; pageI <= pageCount; ++pageI) {
    const fetchPagePromise = axios.get(baseUrl + '&page=' + pageI, {
      headers: { Accept: 'application/vnd.github.v3.star+json' },
    })
    fetchPromises.push(fetchPagePromise)
  }

  //This promise resolves after all the fetching is done.
  return Promise.all(fetchPromises)
    .then(responses => {
      //Parse all the responses to JSON.
      return Promise.all(responses.map(response => response.data))
    })
    .then(results => {
      //Copy the results into one big array that has all the friggin repos.
      let repos = []
      results.forEach(result => {
        repos = repos.concat(result)
      })
      return repos
    })
}

const formatResults = (repo, githubResponse) => {
  return githubResponse.map(x => ({
    repo,
    starred_at: x.starred_at,
    user: { login: x.user.login, id: x.user.id, avatar_url: x.user.avatar_url, url: x.user.url },
  }))
}

const main = async () => {
  const schemas = await fetchAllEvents('schemas', 100)
  const realtime = await fetchAllEvents('realtime', 400)
  const supabase = await fetchAllEvents('supabase', 100)
  const postgrestJs = await fetchAllEvents('postgrest-js', 100)

  const history = []
    .concat(formatResults('@supabase/schemas', schemas))
    .concat(formatResults('@supabase/realtime', realtime))
    .concat(formatResults('@supabase/supabase', supabase))
    .concat(formatResults('@supabase/postgrest-js', postgrestJs))

  const groups = history.reduce((groups, event) => {
    const date = event.starred_at.split('T')[0]
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(event)
    return groups
  }, {})

  var tally = {
    '@supabase/supabase': 0,
    '@supabase/realtime': 0,
    '@supabase/schemas': 0,
    '@supabase/postgrest-js': 0,
  }
  const data = Object.keys(groups)
    .sort((a, b) => a.localeCompare(b))
    .map(date => {
      let supabase = groups[date].filter(x => x.repo === '@supabase/supabase').length
      let realtime = groups[date].filter(x => x.repo === '@supabase/realtime').length
      let schemas = groups[date].filter(x => x.repo === '@supabase/schemas').length
      let postgrestJs = groups[date].filter(x => x.repo === '@supabase/postgrest-js').length
      tally['@supabase/supabase'] += supabase
      tally['@supabase/realtime'] += realtime
      tally['@supabase/schemas'] += schemas
      tally['@supabase/postgrest-js'] += postgrestJs
      return {
        name: date,
        '@supabase/supabase': tally['@supabase/supabase'],
        '@supabase/realtime': tally['@supabase/realtime'],
        '@supabase/schemas': tally['@supabase/schemas'],
        '@supabase/postgrest-js': tally['@supabase/postgrest-js'],
      }
    })

  fs.writeFile('./src/data/stars/stargazers.json', JSON.stringify(data, null, 2), 'utf8', function(
    err
  ) {
    if (err) throw err
    console.log('Saved.')
  })
}
main()
