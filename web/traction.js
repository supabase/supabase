var axios = require('axios')
var fs = require('fs')

const fetchAllEvents = async (repo, totalStars) => {
  const MAX_PER_PAGE = 100
  const baseUrl = `https://api.github.com/repos/supabase/${repo}/stargazers?per_page=${MAX_PER_PAGE}`

  //Start fetching every page of repos.
  const fetchPromises = [],
    pageCount = Math.ceil(totalStars / MAX_PER_PAGE)
  for (let pageI = 1; pageI <= pageCount; ++pageI) {
    const fetchPagePromise = axios.get(`${baseUrl}&page=${pageI}`, {
      headers: {
        Accept: 'application/vnd.github.v3.star+json',
      },
    })
    fetchPromises.push(fetchPagePromise)
  }

  //This promise resolves after all the fetching is done.
  const responses = await Promise.all(fetchPromises)
  //Parse all the responses to JSON.
  const results = await Promise.all(responses.map((response) => response.data))
  //Copy the results into one big array that has all the friggin repos.
  let repos = []
  results.forEach((result) => {
    repos = repos.concat(result)
  })
  return repos
}

const formatResults = (repo, githubResponse) => {
  return githubResponse.map((x) => ({
    repo,
    starred_at: x.starred_at,
    user: { login: x.user.login, id: x.user.id, avatar_url: x.user.avatar_url, url: x.user.url },
  }))
}

const main = async () => {
  let repos = await axios.get('https://api.github.com/users/supabase/repos')
  repos = await Promise.all(
    repos.data
      .map((repo) => [repo.name, repo.stargazers_count])
      .map(async ([name, stars]) => [name, await fetchAllEvents(name, stars)])
  )

  const history = repos
    .map(([name, githubResponse]) => formatResults(name, githubResponse))
    .reduce((acc, x) => acc.concat(x), [])

  const groups = history.reduce((groups, event) => {
    const date = event.starred_at.split('T')[0]
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(event)
    return groups
  }, {})

  var tally = {}
  repos.forEach(([name, _]) => (tally[name] = 0))

  const data = Object.keys(groups)
    .sort((a, b) => a.localeCompare(b))
    .map((date) => {
      repos.forEach(
        ([name, _]) => (tally[name] += groups[date].filter((x) => x.repo === name).length)
      )

      let result = { name: date }
      repos.forEach(([name, _]) => (result[name] = tally[name]))
      return result
    })

  for (const [name, _] of repos) {
    let { data } = await axios.get(`https://api.github.com/repos/supabase/${name}`)
    fs.writeFile(`./src/data/repos/${name}.json`, JSON.stringify(data, null, 2), 'utf8', (err) => {
      if (err) throw err
      console.log(`${name}.json saved.`)
    })
  }

  fs.writeFile(
    './src/data/stars/stargazers.json',
    JSON.stringify(data, null, 2),
    'utf8',
    function (err) {
      if (err) throw err
      console.log('stargazers.json saved.')
    }
  )
}
main()
